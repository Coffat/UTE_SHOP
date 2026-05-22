import mongoose, { Schema } from 'mongoose';
import User, { IUser } from './User.js';

export interface ICustomer extends IUser {
  fullName: string;
  isEmailVerified: boolean;
  loyalty: {
    points: number;
    tier: string;
  };
  favorites: mongoose.Types.ObjectId[];
}

const customerSchema = new Schema<ICustomer>({
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  loyalty: {
    points: { type: Number, default: 0 },
    tier: { type: String, default: 'BRONZE' },
  },
  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }
  ],
});

const Customer = User.discriminator<ICustomer>('CUSTOMER', customerSchema);
export default Customer;
