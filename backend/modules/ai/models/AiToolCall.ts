import mongoose, { Schema, type Document } from 'mongoose';
import type { AiToolName } from '../tools/tool.types.js';

export type AiToolCallStatus = 'SUCCESS' | 'FAILED' | 'DENIED' | 'INVALID_REQUEST' | 'TIMEOUT';

export interface IAiToolCall extends Document {
  conversationId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  toolName: AiToolName;
  status: AiToolCallStatus;
  parserStrategy: 'strict_json' | 'first_object' | 'invalid';
  arguments: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number;
  provider: string;
  modelName: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiToolCallSchema = new Schema<IAiToolCall>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true, trim: true, maxlength: 40 },
    toolName: { type: String, required: true, trim: true, maxlength: 80, index: true },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILED', 'DENIED', 'INVALID_REQUEST', 'TIMEOUT'],
      index: true,
    },
    parserStrategy: {
      type: String,
      required: true,
      enum: ['strict_json', 'first_object', 'invalid'],
      default: 'strict_json',
    },
    arguments: { type: Schema.Types.Mixed, default: null },
    result: { type: Schema.Types.Mixed, default: null },
    errorCode: { type: String, default: null, maxlength: 120 },
    errorMessage: { type: String, default: null, maxlength: 500 },
    durationMs: { type: Number, required: true, min: 0, default: 0 },
    provider: { type: String, required: true, trim: true, maxlength: 40 },
    modelName: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

aiToolCallSchema.index({ conversationId: 1, createdAt: -1 });
aiToolCallSchema.index({ actorId: 1, createdAt: -1 });
aiToolCallSchema.index({ toolName: 1, status: 1, createdAt: -1 });

const AiToolCall = mongoose.model<IAiToolCall>('AiToolCall', aiToolCallSchema);

export default AiToolCall;
