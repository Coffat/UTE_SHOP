import mongoose, { Document, Schema } from 'mongoose';

export interface IShippingProvider extends Document {
  providerName: string;
  apiEndpoint?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaybill extends Document {
  order: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  trackingCode: string;
  status: string;
  estimatedDelivery?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const shippingProviderSchema = new Schema<IShippingProvider>(
  {
    providerName: { type: String, required: true, trim: true },
    apiEndpoint: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const waybillSchema = new Schema<IWaybill>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    provider: { type: Schema.Types.ObjectId, ref: 'ShippingProvider', required: true },
    trackingCode: { type: String, required: true, unique: true },
    status: { type: String, default: 'PENDING' },
    estimatedDelivery: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ShippingProvider = mongoose.model<IShippingProvider>('ShippingProvider', shippingProviderSchema);
export const Waybill = mongoose.model<IWaybill>('Waybill', waybillSchema);
