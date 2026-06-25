import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Recipe from './modules/catalog/models/Recipe.js';
import './modules/catalog/models/ProductVariant.js';
import './modules/catalog/models/Product.js';
import './modules/inventory/models/Material.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop');
  try {
    const recipes = await Recipe.find()
      .populate({
        path: 'productVariant',
        populate: { path: 'product', select: 'name' }
      })
      .populate('ingredients.material');
    console.log(recipes);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
