import mongoose, { Document, Schema } from 'mongoose';

export interface IWebsiteInfo extends Document {
  key: string;
  address: string;
  hotline: string;
  supportEmail: string;
  openingHours: string;
  createdAt: Date;
  updatedAt: Date;
}

const websiteInfoSchema = new Schema<IWebsiteInfo>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    address: { type: String, default: '' },
    hotline: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    openingHours: { type: String, default: '' },
  },
  { timestamps: true }
);

const WebsiteInfo = mongoose.model<IWebsiteInfo>('WebsiteInfo', websiteInfoSchema);

export default WebsiteInfo;

