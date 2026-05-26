/**
 * seed_staff.ts – Tạo 6 tài khoản nhân viên (SALES, WAREHOUSE_STAFF, STORE_STAFF)
 *
 * Chạy: npx tsx seed_staff.ts
 *
 * Đăng nhập: staff1@uteshop.vn … staff6@uteshop.vn / mật khẩu: 123456
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './modules/user/models/User.js';
import { Sales, WarehouseStaff, StoreStaff } from './modules/user/models/Staff.js';
import UserStatus from './shared/enums/UserStatus.js';

dotenv.config();

const PASSWORD = '123456';

const staffAccounts = [
  {
    model: Sales,
    role: 'SALES' as const,
    email: 'staff1@uteshop.vn',
    fullName: 'Nhân viên Sales 1',
    phone: '0901000001',
    extra: { isOnline: true },
  },
  {
    model: Sales,
    role: 'SALES' as const,
    email: 'staff2@uteshop.vn',
    fullName: 'Nhân viên Sales 2',
    phone: '0901000002',
    extra: { isOnline: false },
  },
  {
    model: WarehouseStaff,
    role: 'WAREHOUSE_STAFF' as const,
    email: 'staff3@uteshop.vn',
    fullName: 'Nhân viên Kho 1',
    phone: '0901000003',
    extra: { assignedWarehouse: null },
  },
  {
    model: WarehouseStaff,
    role: 'WAREHOUSE_STAFF' as const,
    email: 'staff4@uteshop.vn',
    fullName: 'Nhân viên Kho 2',
    phone: '0901000004',
    extra: { assignedWarehouse: null },
  },
  {
    model: StoreStaff,
    role: 'STORE_STAFF' as const,
    email: 'staff5@uteshop.vn',
    fullName: 'Nhân viên Cửa hàng 1',
    phone: '0901000005',
    extra: { counterId: 'QUAY-01', storeLocation: 'UTE Shop Q1' },
  },
  {
    model: StoreStaff,
    role: 'STORE_STAFF' as const,
    email: 'staff6@uteshop.vn',
    fullName: 'Nhân viên Cửa hàng 2',
    phone: '0901000006',
    extra: { counterId: 'QUAY-02', storeLocation: 'UTE Shop Q1' },
  },
];

const seedStaff = async () => {
  console.log('🌱 Seeding 6 staff accounts...');
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Missing MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    for (const account of staffAccounts) {
      const existing = await User.findOne({ email: account.email });

      if (existing) {
        existing.passwordHash = passwordHash;
        existing.set('fullName', account.fullName);
        existing.set('phone', account.phone);
        existing.set('status', UserStatus.ACTIVE);
        existing.set('isActive', true);
        await existing.save();
        console.log(`🔄 Updated: ${account.email} (${account.role})`);
        continue;
      }

      await (account.model as typeof Sales).create({
        email: account.email,
        passwordHash,
        phone: account.phone,
        fullName: account.fullName,
        status: UserStatus.ACTIVE,
        performanceScore: 100,
        isActive: true,
        ...account.extra,
      });
      console.log(`✅ Created: ${account.email} (${account.role})`);
    }

    console.log('\n📋 Tài khoản đăng nhập (email / mật khẩu 123456):');
    staffAccounts.forEach((a, i) => {
      console.log(`   staff${i + 1} → ${a.email} [${a.role}]`);
    });
    console.log('\n✅ Staff seed completed.');
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Seed error:', message);
    process.exit(1);
  }
};

seedStaff();
