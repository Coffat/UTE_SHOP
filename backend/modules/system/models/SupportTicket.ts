import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: 'ORDER' | 'PAYMENT' | 'PRODUCT' | 'OTHER';
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    fullName: { type: String, required: [true, 'Họ và tên là bắt buộc'], trim: true },
    email: { type: String, required: [true, 'Email là bắt buộc'], trim: true, lowercase: true },
    phone: { type: String, required: [true, 'Số điện thoại là bắt buộc'], trim: true },
    subject: { type: String, required: [true, 'Tiêu đề hỗ trợ là bắt buộc'], trim: true },
    category: {
      type: String,
      enum: {
        values: ['ORDER', 'PAYMENT', 'PRODUCT', 'OTHER'],
        message: 'Danh mục không hợp lệ'
      },
      required: [true, 'Danh mục hỗ trợ là bắt buộc']
    },
    message: { type: String, required: [true, 'Nội dung hỗ trợ là bắt buộc'] },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
        message: 'Trạng thái không hợp lệ'
      },
      default: 'OPEN'
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }
  },
  {
    timestamps: true
  }
);

// Indexing for search or querying by status and category
supportTicketSchema.index({ email: 1, status: 1 });
supportTicketSchema.index({ userId: 1 });

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;
