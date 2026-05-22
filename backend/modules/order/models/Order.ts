import mongoose, { Schema, Document, Types } from 'mongoose';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';

export interface IOrderItem {
  productVariant: Types.ObjectId;
  quantity: number;
  unitPrice: Types.Decimal128;
  snapshotName: string;
  subtotal: Types.Decimal128;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  note: string;
  timestamp?: Date;
  changedBy?: Types.ObjectId;
}

export interface IRecipient {
  fullName: string;
  phone: string;
  deliveryNote: string;
}

export interface IOrder extends Document {
  orderCode: string;
  customer: Types.ObjectId | null;
  status: OrderStatus;
  orderType: OrderType;
  items: IOrderItem[];
  recipient: IRecipient;
  deliveryAddress: Types.ObjectId | null;
  subtotal: Types.Decimal128;
  shippingFee: Types.Decimal128;
  discountAmount: Types.Decimal128;
  totalAmount: Types.Decimal128;
  note: string;
  voucher: Types.ObjectId | null;
  handledBy: Types.ObjectId | null;
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productVariant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Schema.Types.Decimal128, required: true },
  snapshotName: { type: String, required: true },
  subtotal: { type: Schema.Types.Decimal128, required: true },
});

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  status: { type: String, enum: Object.values(OrderStatus), required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const recipientSchema = new Schema<IRecipient>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  deliveryNote: { type: String, default: '' },
});

const orderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    orderType: { type: String, enum: Object.values(OrderType), required: true },
    items: [orderItemSchema],
    recipient: { type: recipientSchema, required: true },
    deliveryAddress: { type: Schema.Types.ObjectId, ref: 'Address', default: null },
    subtotal: { type: Schema.Types.Decimal128, required: true },
    shippingFee: { type: Schema.Types.Decimal128, default: 0 },
    discountAmount: { type: Schema.Types.Decimal128, default: 0 },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
    note: { type: String, default: '' },
    voucher: { type: Schema.Types.ObjectId, ref: 'Voucher', default: null },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    statusHistory: [orderStatusHistorySchema],
  },
  { timestamps: true }
);

// Indexes for admin reporting and search optimization
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1, status: 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
