import Review from '../models/Review.js';

export const createReview = async (customerId, productId, data) => {
  return Review.create({ customer: customerId, product: productId, ...data });
};

export const getReviewsByProduct = async (productId, { page = 1, limit = 10 } = {}) => {
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

export const approveReview = async (reviewId) =>
  Review.findByIdAndUpdate(reviewId, { isVerified: true }, { new: true });

export const rejectReview = async (reviewId) =>
  Review.findByIdAndDelete(reviewId);
