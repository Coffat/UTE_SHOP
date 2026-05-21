import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (typeof uri !== 'string' || !uri.trim()) {
    console.error('❌ Missing MONGO_URI. Tạo file backend/.env và set MONGO_URI=mongodb://...');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ MongoDB connection error: ${errorMessage}`);
    process.exit(1);
  }
};

export default connectDB;
