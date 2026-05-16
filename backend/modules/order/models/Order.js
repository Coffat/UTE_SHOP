import mongoose from 'mongoose';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';

const orderItemSchema = new mongoose.Schema({
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: mongoose.Types.Decimal128, required: true }, // snapshot tại thời điểm đặt
  snapshotName: { type: String, required: true },                // snapshot tên SKU
  subtotal: { type: mongoose.Types.Decimal128, required: true },
});

const orderStatusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: Object.values(OrderStatus), required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const recipientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  deliveryNote: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = guest
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    orderType: { type: String, enum: Object.values(OrderType), required: true },
    items: [orderItemSchema],
    recipient: { type: recipientSchema, required: true },
    deliveryAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    subtotal: { type: mongoose.Types.Decimal128, required: true },
    shippingFee: { type: mongoose.Types.Decimal128, default: 0 },
    discountAmount: { type: mongoose.Types.Decimal128, default: 0 },
    totalAmount: { type: mongoose.Types.Decimal128, required: true },
    note: { type: String, default: '' },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // SALES hoặc STORE_STAFF
    statusHistory: [orderStatusHistorySchema],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
