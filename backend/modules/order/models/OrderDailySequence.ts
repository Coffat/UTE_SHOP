import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderDailySequence extends Document {
  _id: string;
  businessDate: string;
  sequence: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderDailySequenceSchema = new Schema<IOrderDailySequence>(
  {
    _id: { type: String, required: true },
    businessDate: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0 },
    timezone: { type: String, required: true, default: 'Asia/Ho_Chi_Minh' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'order_daily_sequences',
  }
);

const OrderDailySequence = mongoose.model<IOrderDailySequence>(
  'OrderDailySequence',
  orderDailySequenceSchema
);

export default OrderDailySequence;
