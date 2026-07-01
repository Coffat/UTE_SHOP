import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { calculateOrderTotal } from '../modules/marketing/services/discount.service.js';
import Voucher from '../modules/marketing/models/Voucher.js';
import User from '../modules/user/models/User.js';
import DiscountType from '../shared/enums/DiscountType.js';

describe('Discounts & Loyalty Points Calculation (Whitebox Tests)', () => {
  it('calculates PERCENTAGE discount and respects maxDiscountAmount limit', async () => {
    // 1. Mock Voucher.findOne
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'TESTPERCENT20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('20'),
      maxDiscountAmount: mongoose.Types.Decimal128.fromString('50000'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('100000'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      usedBy: [],
      populate: function() { return this; }
    })) as any;

    try {
      // 300,000 VND order. 20% discount = 60,000 VND. Capped at 50,000 VND.
      const result = await calculateOrderTotal({
        subTotal: 300000,
        voucherCode: 'TESTPERCENT20',
        userId: new mongoose.Types.ObjectId().toString(),
      });

      assert.equal(result.voucherDiscount, 50000);
      assert.equal(result.subTotal, 300000);
      assert.equal(result.shippingFee, 30000);
      assert.equal(result.finalTotal, 300000 + 30000 - 50000); // 280,000 VND
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('calculates FIXED_AMOUNT discount and rejects if subTotal is below minOrderAmount', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'TESTFIXED50K',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: mongoose.Types.Decimal128.fromString('50000'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('150000'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      usageLimit: 10,
      usedCount: 0,
      isActive: true,
      usedBy: [],
      populate: function() { return this; }
    })) as any;

    try {
      // Order of 100,000 VND < minOrderAmount of 150,000 VND -> Should throw error
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          voucherCode: 'TESTFIXED50K',
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Đơn hàng tối thiểu 150000 để dùng voucher này/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects expired vouchers', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'TESTEXPIRED',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 2 * 3600000),
      endDate: new Date(Date.now() - 3600000), // expired 1 hour ago
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      usedBy: [],
      populate: function() { return this; }
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 50000,
          voucherCode: 'TESTEXPIRED',
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Mã voucher đã hết hạn/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('applies loyalty points and respects max 50% discount limit', async () => {
    const originalUserFindById = User.findById;
    // Mock user with 200 points (value: 200,000 VND)
    User.findById = (() => ({
      _id: new mongoose.Types.ObjectId(),
      points: 200,
    })) as any;

    try {
      // Order: subTotal: 100,000 VND. Max points discount allowed is 50% = 50,000 VND (equivalent to 50 points).
      // If user requests to use 60 points (60,000 VND), it should reject.
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          pointsToUse: 60,
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Chỉ được dùng tối đa 50% giá trị đơn hàng/
      );

      // Using valid 40 points (40,000 VND <= 50,000 VND) should succeed
      const result = await calculateOrderTotal({
        subTotal: 100000,
        pointsToUse: 40,
        userId: new mongoose.Types.ObjectId().toString(),
      });

      assert.equal(result.pointsDiscount, 40000);
      assert.equal(result.pointsUsed, 40);
      assert.equal(result.finalTotal, 100000 + 30000 - 40000); // 90,000 VND
    } finally {
      User.findById = originalUserFindById;
    }
  });

  it('rejects vouchers when usageLimit is reached', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'LIMITEXHAUSTED',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      usageLimit: 5,
      usedCount: 5,
      isActive: true,
      usedBy: [],
      populate: function() { return this; }
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          voucherCode: 'LIMITEXHAUSTED',
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Mã voucher đã hết lượt sử dụng/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects vouchers already used by the user', async () => {
    const originalFindOne = Voucher.findOne;
    const userId = new mongoose.Types.ObjectId();
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'ONETIMEONLY',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      usageLimit: 10,
      usedCount: 1,
      isActive: true,
      usedBy: [{ userId: userId, usageCount: 1 }],
      populate: function() { return this; }
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          voucherCode: 'ONETIMEONLY',
          userId: userId.toString(),
        }),
        /Bạn đã sử dụng mã voucher này rồi/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects vouchers locked to another customer', async () => {
    const originalFindOne = Voucher.findOne;
    const customerId = new mongoose.Types.ObjectId();
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'PRIVATEVOUCHER',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      usageLimit: 10,
      usedCount: 0,
      isActive: true,
      customer: customerId,
      usedBy: [],
      populate: function() { return this; }
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          voucherCode: 'PRIVATEVOUCHER',
          userId: new mongoose.Types.ObjectId().toString(), // different user
        }),
        /Mã voucher này không dành cho tài khoản của bạn/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects vouchers associated with an inactive or expired campaign', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      _id: new mongoose.Types.ObjectId(),
      code: 'CAMPAIGNINACTIVE',
      discountType: DiscountType.PERCENTAGE,
      discountValue: mongoose.Types.Decimal128.fromString('10'),
      minOrderAmount: mongoose.Types.Decimal128.fromString('0'),
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000),
      isActive: true,
      usedBy: [],
      campaign: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Expired Campaign',
        isActive: false, // Inactive
        startDate: new Date(Date.now() - 7200000),
        endDate: new Date(Date.now() - 3600000),
      },
      populate: function() { return this; }
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          voucherCode: 'CAMPAIGNINACTIVE',
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Chiến dịch chứa mã voucher này đang tạm dừng/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects if user tries to use more points than they have', async () => {
    const originalUserFindById = User.findById;
    User.findById = (() => ({
      _id: new mongoose.Types.ObjectId(),
      points: 10, // Only 10 points
    })) as any;

    try {
      await assert.rejects(
        calculateOrderTotal({
          subTotal: 100000,
          pointsToUse: 50, // Wants to use 50 points
          userId: new mongoose.Types.ObjectId().toString(),
        }),
        /Bạn chỉ có 10 điểm/
      );
    } finally {
      User.findById = originalUserFindById;
    }
  });
});
