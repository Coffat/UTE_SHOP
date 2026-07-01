import '../config/loadEnv.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../modules/user/models/User.js';

async function run() {
  await connectDB();
  const customers = await User.find({ role: 'CUSTOMER' }).limit(5).lean();
  console.log('Customer Documents in DB:', JSON.stringify(customers, null, 2));
  await mongoose.disconnect();
}

run();
