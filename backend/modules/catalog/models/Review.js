import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    imageUrls: [{ type: String }],
    isVerified: { type: Boolean, default: false }, // chỉ verified purchase mới được approve
  },
  { timestamps: true }
);

// Đảm bảo 1 customer chỉ review 1 lần cho 1 sản phẩm
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
