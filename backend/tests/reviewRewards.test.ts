import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndCalculateVoucher } from '../modules/marketing/services/voucher.service.js';
import Voucher from '../modules/marketing/models/Voucher.js';

describe('validateAndCalculateVoucher with customer ownership', () => {
  it('allows voucher if customer matches', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      code: 'REV-OWNED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validUntil: new Date(Date.now() + 1000000),
      usageLimit: 1,
      usedCount: 0,
      isActive: true,
      customer: 'user123',
      minOrderAmount: 0,
      populate: function() { return this; },
    })) as any;

    try {
      const result = await validateAndCalculateVoucher('REV-OWNED', 100000, 'user123');
      assert.equal(result.voucher.code, 'REV-OWNED');
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('rejects voucher if customer does not match', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      code: 'REV-OWNED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validUntil: new Date(Date.now() + 1000000),
      usageLimit: 1,
      usedCount: 0,
      isActive: true,
      customer: 'user123',
      minOrderAmount: 0,
      populate: function() { return this; },
    })) as any;

    try {
      await assert.rejects(
        validateAndCalculateVoucher('REV-OWNED', 100000, 'other456'),
        /Mã voucher này không dành cho tài khoản của bạn/
      );
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });

  it('allows voucher if it is global (no customer restriction)', async () => {
    const originalFindOne = Voucher.findOne;
    Voucher.findOne = (() => ({
      code: 'GLOBAL10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validUntil: new Date(Date.now() + 1000000),
      usageLimit: 1,
      usedCount: 0,
      isActive: true,
      customer: null,
      minOrderAmount: 0,
      populate: function() { return this; },
    })) as any;

    try {
      const result = await validateAndCalculateVoucher('GLOBAL10', 100000, 'other456');
      assert.equal(result.voucher.code, 'GLOBAL10');
    } finally {
      Voucher.findOne = originalFindOne;
    }
  });
});
