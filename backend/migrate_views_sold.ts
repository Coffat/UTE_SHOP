import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './modules/catalog/models/Product.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop';

const migrate = async () => {
  console.log('🌱 Starting views and soldCount migration...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate`);

    let count = 0;
    for (const product of products) {
      // Backfill with realistic counts
      // Random sold count between 10 and 150
      const soldCount = Math.floor(Math.random() * 141) + 10;
      // Random views count between soldCount + 50 and soldCount + 550
      const views = soldCount + Math.floor(Math.random() * 501) + 50;

      product.soldCount = soldCount;
      product.views = views;
      await product.save();
      count++;
    }

    console.log(`🎉 Migration completed successfully! Updated ${count} products.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

migrate();
