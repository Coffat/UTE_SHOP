import mongoose from 'mongoose';
import User from './User.js';

/**
 * Admin – discriminator của User.
 * role = 'ADMIN'
 */
const adminSchema = new mongoose.Schema({
  ownerName: {
    type: String,
    trim: true,
  },
});

const Admin = User.discriminator('ADMIN', adminSchema);
export default Admin;
