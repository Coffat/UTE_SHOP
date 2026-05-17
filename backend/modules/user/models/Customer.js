import mongoose from 'mongoose';
import User from './User.js';

/**
 * Customer – discriminator của User.
 * role = 'CUSTOMER'
 */
const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  loyalty: {
    points: { type: Number, default: 0 },
    tier: { type: String, default: 'BRONZE' },
  },
  // địa chỉ được lưu ở module logistics/Address
});

const Customer = User.discriminator('CUSTOMER', customerSchema);
export default Customer;
