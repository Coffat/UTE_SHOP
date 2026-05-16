import mongoose from 'mongoose';

const loyaltyAccountSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], default: 'BRONZE' },
  },
  { timestamps: true }
);

const LoyaltyAccount = mongoose.model('LoyaltyAccount', loyaltyAccountSchema);
export default LoyaltyAccount;
