import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: null }, // cho guest cart
    items: [cartItemSchema],
    status: { type: String, enum: ['ACTIVE', 'CONVERTED', 'ABANDONED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
