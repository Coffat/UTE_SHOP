import Review, { IReview } from '../models/Review.js';

export const createReview = async (
  customerId: string,
  productId: string,
  data: Partial<IReview>
): Promise<IReview> => {
  return Review.create({ customer: customerId, product: productId, ...data });
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
    Review.find({ product: productId })
      .populate('customer', 'fullName')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Review.countDocuments({ product: productId }),
  ]);
  return { items, total, page, limit };
};

export const approveReview = async (reviewId: string): Promise<IReview | null> =>
  Review.findByIdAndUpdate(reviewId, { isVerified: true }, { new: true });

export const rejectReview = async (reviewId: string): Promise<IReview | null> =>
  Review.findByIdAndDelete(reviewId);

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
