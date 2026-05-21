import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem {
  productVariant: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  customer: Types.ObjectId | null;
  sessionId: string | null;
  items: ICartItem[];
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED';
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productVariant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new Schema<ICart>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: null },
    items: [cartItemSchema],
    status: { type: String, enum: ['ACTIVE', 'CONVERTED', 'ABANDONED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

const Cart = mongoose.model<ICart>('Cart', cartSchema);
export default Cart;
