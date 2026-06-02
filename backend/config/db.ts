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

    // Automatically check and drop legacy 'product_1_customer_1' index from 'reviews' collection if it exists
    const db = conn.connection.db;
    if (db) {
      try {
        const reviewsCollection = db.collection('reviews');
        const indexes = await reviewsCollection.indexes();
        const hasOldIndex = indexes.some(idx => idx.name === 'product_1_customer_1');
        if (hasOldIndex) {
          console.log('🧹 Dropping legacy index "product_1_customer_1" from reviews collection...');
          await reviewsCollection.dropIndex('product_1_customer_1');
          console.log('✨ Legacy index "product_1_customer_1" dropped successfully.');
        }
      } catch (indexErr) {
        console.warn('⚠️ Warning: Failed to clean up legacy index on reviews:', indexErr);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ MongoDB connection error: ${errorMessage}`);
    process.exit(1);
  }
};

export default connectDB;
