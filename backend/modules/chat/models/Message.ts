import mongoose, { Schema, type Document } from 'mongoose';
import {
  CHAT_MESSAGE_TYPES,
  CHAT_SENDER_TYPES,
  type ChatMessageType,
  type ChatSenderType,
} from '../constants/chat.constants.js';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderType: ChatSenderType;
  senderId?: mongoose.Types.ObjectId | null;
  clientMessageId?: string | null;
  messageType: ChatMessageType;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderType: { type: String, enum: CHAT_SENDER_TYPES, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    clientMessageId: { type: String, default: null, trim: true, maxlength: 120 },
    messageType: { type: String, enum: CHAT_MESSAGE_TYPES, default: 'text', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, _id: 1 });
messageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientMessageId: { $type: 'string' },
      senderId: { $type: 'objectId' },
    },
  }
);

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
