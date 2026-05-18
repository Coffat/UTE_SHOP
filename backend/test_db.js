import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ute_shop').then(async () => {
  const users = await mongoose.connection.db.collection('users').find().limit(3).toArray();
  console.log(users);
  process.exit(0);
});
