import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri!);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  const reviewsCollection = db.collection('reviews');

  console.log('Fetching indexes for reviews collection...');
  const indexes = await reviewsCollection.indexes();
  console.log('Current indexes:', JSON.stringify(indexes, null, 2));

  const hasOldIndex = indexes.some(idx => idx.name === 'product_1_customer_1');
  if (hasOldIndex) {
    console.log('Dropping old index product_1_customer_1...');
    await reviewsCollection.dropIndex('product_1_customer_1');
    console.log('Old index dropped successfully!');
  } else {
    console.log('Old index product_1_customer_1 not found.');
  }

  // Print indexes again to verify
  const updatedIndexes = await reviewsCollection.indexes();
  console.log('Updated indexes:', JSON.stringify(updatedIndexes, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
