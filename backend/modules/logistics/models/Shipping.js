import mongoose from 'mongoose';

const shippingProviderSchema = new mongoose.Schema(
  {
    providerName: { type: String, required: true, trim: true },
    apiEndpoint: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const waybillSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingProvider', required: true },
    trackingCode: { type: String, required: true, unique: true },
    status: { type: String, default: 'PENDING' },
    estimatedDelivery: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ShippingProvider = mongoose.model('ShippingProvider', shippingProviderSchema);
export const Waybill = mongoose.model('Waybill', waybillSchema);
