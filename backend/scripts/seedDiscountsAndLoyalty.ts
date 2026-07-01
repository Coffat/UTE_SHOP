import '../config/loadEnv.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../modules/user/models/User.js';
import Campaign from '../modules/marketing/models/Campaign.js';
import Voucher from '../modules/marketing/models/Voucher.js';
import DiscountType from '../shared/enums/DiscountType.js';

async function run() {
  console.log('Seeding discount and loyalty points test data...');
  await connectDB();

  // 1. Create/Update a test customer with 500 points
  const testCustomerEmail = 'testcustomer@uteshop.vn';
  let testUser = await User.findOne({ email: testCustomerEmail });
  if (!testUser) {
    testUser = await User.create({
      email: testCustomerEmail,
      password: 'hashedPassword123', // dummy password
      fullName: 'Test Customer Discount Loyalty',
      role: 'CUSTOMER',
      points: 500,
    });
    console.log(`Created test customer: ${testCustomerEmail}`);
  } else {
    testUser.points = 500;
    await testUser.save();
    console.log(`Reset test customer loyalty points: 500`);
  }

  // 2. Create a test campaign
  const campaignName = 'Chiến dịch thử nghiệm Khuyến mãi & Tích điểm';
  let campaign = await Campaign.findOne({ name: campaignName });
  if (!campaign) {
    campaign = await Campaign.create({
      name: campaignName,
      description: 'Chiến dịch dùng để test giảm giá và tích điểm.',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
      isActive: true,
      showPopup: false,
    });
    console.log(`Created test campaign: ${campaignName}`);
  }

  // 3. Create test vouchers
  const vouchersToSeed = [
    {
      code: 'TESTPERCENT20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('20'),
      maxDiscountAmount: mongoose.Types.Decimal128.fromString('50000'), // max 50k
      minOrderAmount: mongoose.Types.Decimal128.fromString('100000'), // min 100k
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      campaign: campaign._id,
    },
    {
      code: 'TESTFIXED50K',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: mongoose.Types.Decimal128.fromString('50000'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('150000'), // min 150k
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 10,
      usedCount: 0,
      isActive: true,
      campaign: campaign._id,
    },
    {
      code: 'TESTEXPIRED',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired yesterday
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      campaign: campaign._id,
    }
  ];

  for (const vData of vouchersToSeed) {
    await Voucher.deleteOne({ code: vData.code });
    await Voucher.create(vData);
    console.log(`Seeded voucher: ${vData.code}`);
  }

  console.log('✅ Discount and Loyalty test data seeded successfully!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
