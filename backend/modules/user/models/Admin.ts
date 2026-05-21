import { Schema } from 'mongoose';
import User, { IUser } from './User.js';

export interface IAdmin extends IUser {
  ownerName?: string;
}

const adminSchema = new Schema<IAdmin>({
  ownerName: {
    type: String,
    trim: true,
  },
});

const Admin = User.discriminator<IAdmin>('ADMIN', adminSchema);
export default Admin;
