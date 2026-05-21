import { ClientSession } from 'mongoose';
import Voucher, { IVoucher } from '../models/Voucher.js';
import DiscountType from '../../../shared/enums/DiscountType.js';

/**
 * ⚡ Được gọi bởi order.service.js (Cross-Module Communication)
 *
 * Validate và tính giá trị giảm của voucher cho một đơn hàng.
 * Không import Order model – chỉ nhận orderTotal (số tiền) từ order.service.
 *
 * @param {string} code - mã voucher
 * @param {number} orderTotal - tổng tiền đơn hàng (trước giảm giá)
 * @returns {{ discountAmount: number, voucher: IVoucher }}
 */
export const validateAndCalculateVoucher = async (
  code: string,
  orderTotal: number
): Promise<{ discountAmount: number; voucher: IVoucher }> => {
  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

  if (!voucher) throw new Error('Mã voucher không tồn tại hoặc đã hết hạn');
  if (voucher.validUntil < new Date()) throw new Error('Mã voucher đã hết hạn');
  if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
    throw new Error('Mã voucher đã hết lượt sử dụng');
  }
  if (Number(voucher.minOrderAmount) > orderTotal) {
    throw new Error(`Đơn hàng tối thiểu ${voucher.minOrderAmount} để dùng voucher này`);
  }

  let discountAmount =
    voucher.discountType === DiscountType.PERCENTAGE
      ? (orderTotal * Number(voucher.discountValue)) / 100
      : Number(voucher.discountValue);

  if (voucher.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(voucher.maxDiscountAmount));
  }

  return { discountAmount, voucher };
};

/**
 * ⚡ Được gọi bởi order.service.js sau khi tạo order thành công
 * Tăng usedCount của voucher
 */
export const markVoucherUsed = async (voucherId: string, session: ClientSession | null = null): Promise<void> => {
  await Voucher.findByIdAndUpdate(
    voucherId,
    { $inc: { usedCount: 1 } },
    { session }
  );
};

export const createVoucher = async (data: Partial<IVoucher>): Promise<IVoucher> => {
  return Voucher.create(data);
};

export const getVouchers = async (): Promise<IVoucher[]> => {
  return Voucher.find().populate('campaign', 'name');
};

export const toggleVoucher = async (id: string, isActive: boolean): Promise<IVoucher | null> => {
  return Voucher.findByIdAndUpdate(id, { isActive }, { new: true });
};
