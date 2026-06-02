import Review, { IReview } from '../models/Review.js';
import Order from '../../order/models/Order.js';
import Customer from '../../user/models/Customer.js';
import Voucher from '../../marketing/models/Voucher.js';
import Product from '../models/Product.js';
import DiscountType from '../../../shared/enums/DiscountType.js';
import { AppError } from '../../../shared/utils/AppError.js';

const recomputeProductReviewStats = async (productId: string): Promise<void> => {
  const approvedReviews = await Review.find({ product: productId, isVerified: true }).select('rating');
  const totalReviews = approvedReviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (approvedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  await Product.findByIdAndUpdate(productId, {
    'reviewStats.averageRating': averageRating,
    'reviewStats.totalReviews': totalReviews,
  });
};

export const createReview = async (
  customerId: string,
  productId: string,
  data: { rating: number; comment?: string; imageUrls?: string[]; orderId: string }
): Promise<any> => {
  const { rating, comment = '', imageUrls = [], orderId } = data;

  // 1. Verify Order: must exist, belong to this customer, and be COMPLETED
  const order = await Order.findById(orderId).populate('items.productVariant');
  if (!order) {
    throw new AppError('Không tìm thấy đơn hàng tương ứng', 404);
  }
  if (order.customer?.toString() !== customerId) {
    throw new AppError('Bạn không có quyền đánh giá đơn hàng này', 403);
  }
  if (order.status !== 'COMPLETED') {
    throw new AppError('Bạn chỉ có thể đánh giá sản phẩm của đơn hàng đã mua thành công', 400);
  }

  // 2. Verify Product is in the order
  const hasProduct = order.items.some((item: any) => {
    const pVar = item.productVariant;
    if (pVar && typeof pVar === 'object') {
      return pVar.product?.toString() === productId;
    }
    return false;
  });
  if (!hasProduct) {
    throw new AppError('Sản phẩm này không nằm trong đơn hàng của bạn', 400);
  }

  // 3. Check duplicate review
  const existingReview = await Review.findOne({
    customer: customerId,
    product: productId,
    order: orderId,
  });
  if (existingReview) {
    throw new AppError('Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi', 400);
  }

  // 4. Create the Review
  const review = await Review.create({
    product: productId,
    customer: customerId,
    order: orderId,
    rating,
    comment,
    imageUrls,
    isVerified: false,
  });

  // 5. Reward points (+100 points)
  await Customer.findByIdAndUpdate(customerId, {
    $inc: { 'loyalty.points': 100 }
  });

  // 6. Generate unique single-use Voucher code
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const voucherCode = `REV-${randomSuffix}`;
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30); // 30 days from now

  const voucher = await Voucher.create({
    code: voucherCode,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderAmount: 0,
    validUntil,
    usageLimit: 1,
    usedCount: 0,
    isActive: true,
    customer: customerId,
  });

  // 7. Return review details and reward info
  return {
    review,
    reward: {
      points: 100,
      voucherCode: voucher.code,
      discountValue: 10,
      reviewStatus: 'PENDING_APPROVAL',
    }
  };
};

interface GetReviewsParams {
  page?: number;
  limit?: number;
}

export interface ReviewListResponse {
  items: IReview[];
  total: number;
  page: number;
  limit: number;
}

export const getReviewsByProduct = async (
  productId: string,
  { page = 1, limit = 10 }: GetReviewsParams = {}
): Promise<ReviewListResponse> => {
  const [items, total] = await Promise.all([
    Review.find({ product: productId, isVerified: true })
      .populate('customer', 'fullName')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Review.countDocuments({ product: productId, isVerified: true }),
  ]);
  return { items, total, page, limit };
};

export const approveReview = async (reviewId: string): Promise<IReview | null> => {
  const updatedReview = await Review.findByIdAndUpdate(reviewId, { isVerified: true }, { new: true });
  if (updatedReview) {
    await recomputeProductReviewStats(updatedReview.product.toString());
  }
  return updatedReview;
};

export const rejectReview = async (reviewId: string): Promise<IReview | null> => {
  const deletedReview = await Review.findByIdAndDelete(reviewId);
  if (deletedReview) {
    await recomputeProductReviewStats(deletedReview.product.toString());
  }
  return deletedReview;
};

export const getAllReviews = async (
  { page = 1, limit = 10 }: GetReviewsParams = {}
): Promise<ReviewListResponse> => {
  const [items, total] = await Promise.all([
    Review.find({})
      .populate('customer', 'fullName email')
      .populate('product', 'name slug')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Review.countDocuments({}),
  ]);
  return { items, total, page, limit };
};

export const getReviewById = async (id: string): Promise<IReview | null> => {
  return Review.findById(id)
    .populate('customer', 'fullName email')
    .populate('product', 'name slug');
};
