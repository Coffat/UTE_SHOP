/**
 * seed_data.ts – Tạo dữ liệu mẫu ban đầu (ESM)
 *
 * Chạy: npx tsx seed_data.ts
 *
 * Tạo:
 *  - 1 Admin account
 *  - 1 Customer account (đã verify email)
 *
 * --- openingHours workaround (Phase 0) ---
 * WebsiteInfo is a singleton document created lazily on first request.
 * If the chatbot shows "shop hiện chưa cập nhật giờ mở cửa" after deployment,
 * the Admin must visit /admin/settings and click Save once to populate
 * WebsiteInfo.openingHours in MongoDB.
 *
 * TODO (Phase 7 — DEFER): Add WebsiteInfo initialization here once a
 * representative default value is agreed with the team:
 *   import WebsiteInfo from './modules/admin/models/WebsiteInfo.js';
 *   await WebsiteInfo.findOneAndUpdate(
 *     { key: 'default' },
 *     { $setOnInsert: { key: 'default', openingHours: '' } },
 *     { upsert: true, setDefaultsOnInsert: true }
 *   );
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models từ modules/ mới
import './modules/user/models/Customer.js'; // đảm bảo discriminator CUSTOMER đã đăng ký
import './modules/user/models/Admin.js';    // đảm bảo discriminator ADMIN đã đăng ký
import User from './modules/user/models/User.js';
import Customer from './modules/user/models/Customer.js';
import Admin from './modules/user/models/Admin.js';
import UserStatus from './shared/enums/UserStatus.js';

dotenv.config();

const seedUsers = [
  {
    model: Admin,
    data: {
      ownerName: 'System Admin',
      email: 'admin@uteshop.vn',
      passwordHash: '123456',
      phone: '0000000000',
      status: UserStatus.ACTIVE,
    },
  },
  {
    model: Customer,
    data: {
      fullName: 'Thang Vu',
      email: 'vuthang@uteshop.vn',
      passwordHash: 'password123',
      phone: '0901234567',
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
    },
  },
];

const seedData = async () => {
  console.log('🌱 Starting seed data script...');
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Missing MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    for (const { model, data } of seedUsers) {
      const existing = await User.findOne({ email: data.email });

      if (existing) {
        console.log(`⚠️  User ${data.email} already exists — skipping.`);
        continue;
      }

      const passwordHash = await bcrypt.hash(data.passwordHash, 10);
      await (model as any).create({ ...data, passwordHash });
      console.log(`✅ Created: ${data.email} (role: ${model.modelName})`);
    }

    console.log('\n✅ Seed completed.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedData();
