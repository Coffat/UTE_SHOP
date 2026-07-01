import '../config/loadEnv.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import StockTransaction from '../modules/inventory/models/StockTransaction.js';

async function run() {
  console.log('🧹 Cleaning orphaned and legacy stock transactions...');
  await connectDB();

  const result = await StockTransaction.deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} legacy transactions.`);

  await mongoose.disconnect();
  console.log('👋 Finished cleaning transactions!');
}

run().catch((err) => {
  console.error('❌ Cleaning failed:', err);
  process.exit(1);
});
