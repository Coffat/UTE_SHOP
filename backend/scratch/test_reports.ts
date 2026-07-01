import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAdminReports } from '../modules/admin/services/reports.service.js';
import Product from '../modules/catalog/models/Product.js';
import Category from '../modules/catalog/models/Category.js';

dotenv.config();

const test = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGO_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    // Force register models
    const _p = Product.modelName;
    const _c = Category.modelName;

    console.log('Fetching reports for 30d...');
    const reports = await getAdminReports('30d', 5);
    console.log('SUCCESS! Reports Data:');
    console.log('Period Label:', reports.periodLabel);
    console.log('Stats:', reports.stats);
    console.log('Total Orders:', reports.totalOrdersInPeriod);
    console.log('Revenue Growth items:', reports.revenueGrowth.length);
    console.log('Category Revenue items:', reports.categoryRevenue);
    console.log('Top Products:', reports.topProducts.slice(0, 3));
    console.log('Channel Performance:', reports.channelPerformance);
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing reports:', err);
    process.exit(1);
  }
};

test();
