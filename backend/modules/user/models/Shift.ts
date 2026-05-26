import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  bg: string;
  date: Date;
  assignedStaff: mongoose.Types.ObjectId[];
  isCancelled: boolean;
  cancelledAt: Date | null;
  cancelledBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    title: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true }, // e.g. "06:00"
    endTime: { type: String, required: true, trim: true }, // e.g. "14:00"
    color: { type: String, required: true, default: '#10b981' },
    bg: { type: String, required: true, default: 'rgba(16,185,129,0.12)' },
    date: { type: Date, required: true },
    assignedStaff: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

// Indexes to optimize shift listings and lookups
shiftSchema.index({ date: 1 });
shiftSchema.index({ assignedStaff: 1 });
shiftSchema.index({ isCancelled: 1 });
shiftSchema.index({ isCancelled: 1, date: 1 });

const Shift = mongoose.model<IShift>('Shift', shiftSchema);
export default Shift;
