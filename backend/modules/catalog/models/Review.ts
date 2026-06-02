import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  product: Types.ObjectId;
  customer: Types.ObjectId;
  order?: Types.ObjectId | null;
  rating: number;
  comment: string;
  imageUrls: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    imageUrls: [{ type: String }],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1, order: 1 }, { unique: true });

const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
