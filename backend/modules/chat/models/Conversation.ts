import mongoose, { Schema, type Document } from 'mongoose';
import { CHAT_CONVERSATION_STATUSES, type ChatConversationStatus } from '../constants/chat.constants.js';

export interface IConversation extends Document {
  customerId: mongoose.Types.ObjectId;
  assignedStaffId?: mongoose.Types.ObjectId | null;
  status: ChatConversationStatus;
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null;
  lastMessageSenderType?: 'customer' | 'staff' | 'system' | null;
  lastCustomerMessageAt?: Date | null;
  lastStaffMessageAt?: Date | null;
  customerLastReadAt?: Date | null;
  staffLastReadAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    status: {
      type: String,
      enum: CHAT_CONVERSATION_STATUSES,
      default: 'waiting_staff',
      required: true,
      index: true,
    },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: null, maxlength: 2000 },
    lastMessageSenderType: { type: String, enum: ['customer', 'staff', 'system'], default: null },
    lastCustomerMessageAt: { type: Date, default: null },
    lastStaffMessageAt: { type: Date, default: null },
    customerLastReadAt: { type: Date, default: null },
    staffLastReadAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ customerId: 1, status: 1, updatedAt: -1 });
conversationSchema.index({ assignedStaffId: 1, status: 1, updatedAt: -1 });
conversationSchema.index({ status: 1, updatedAt: -1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
