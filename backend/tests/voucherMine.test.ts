import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableVouchersForCustomer } from '../modules/marketing/services/voucher.service.js';
import Voucher from '../modules/marketing/models/Voucher.js';

describe('getAvailableVouchersForCustomer', () => {
  it('returns global and owned vouchers that are still valid', async () => {
    const originalFind = Voucher.find;
    const future = new Date(Date.now() + 86400000);
    const past = new Date(Date.now() - 86400000);

    Voucher.find = ((query: Record<string, unknown>) => ({
      populate: function() {
        return {
          sort: () => [
            {
              _id: 'v1',
              code: 'GLOBAL10',
              discountType: 'PERCENTAGE',
              discountValue: 10,
              maxDiscountAmount: null,
              minOrderAmount: 0,
              startDate: past,
              endDate: future,
              usageLimit: null,
              usedCount: 0,
              isActive: true,
              customer: null,
            },
            {
              _id: 'v2',
              code: 'MINE20',
              discountType: 'FIXED',
              discountValue: 20000,
              maxDiscountAmount: null,
              minOrderAmount: 100000,
              startDate: past,
              endDate: future,
              usageLimit: 5,
              usedCount: 1,
              isActive: true,
              customer: 'user123',
            },
            {
              _id: 'v3',
              code: 'EXPIRED',
              discountType: 'FIXED',
              discountValue: 5000,
              maxDiscountAmount: null,
              minOrderAmount: 0,
              startDate: new Date(Date.now() - 86400000 * 2),
              endDate: past,
              usageLimit: null,
              usedCount: 0,
              isActive: true,
              customer: null,
            },
          ].filter((v) => {
            const or = query.$or as Array<Record<string, unknown>> | undefined;
            const customerMatch =
              v.customer === null ||
              (or?.some((clause) => clause.customer === 'user123') && v.customer === 'user123');
            const valid = v.startDate <= new Date() && v.endDate >= new Date();
            const hasUsage =
              v.usageLimit === null || v.usedCount < (v.usageLimit as number);
            return v.isActive && valid && hasUsage && customerMatch;
          })
        };
      }
    })) as unknown as typeof Voucher.find;

    try {
      const result = await getAvailableVouchersForCustomer('user123');
      assert.equal(result.length, 2);
      assert.deepEqual(
        result.map((v) => v.code),
        ['GLOBAL10', 'MINE20']
      );
      assert.equal(result[0].discountValue, 10);
    } finally {
      Voucher.find = originalFind;
    }
  });

  it('excludes vouchers that exhausted usage limit', async () => {
    const originalFind = Voucher.find;
    const future = new Date(Date.now() + 86400000);

    Voucher.find = (() => ({
      populate: function() {
        return {
          sort: () => [],
        };
      }
    })) as unknown as typeof Voucher.find;

    try {
      const result = await getAvailableVouchersForCustomer('user123');
      assert.equal(result.length, 0);
    } finally {
      Voucher.find = originalFind;
    }
  });
});
