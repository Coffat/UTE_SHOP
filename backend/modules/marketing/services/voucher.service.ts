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
  orderTotal: number,
  customerId?: string
): Promise<{ discountAmount: number; voucher: IVoucher }> => {
  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

  if (!voucher) throw new Error('Mã voucher không tồn tại hoặc đã hết hạn');
  if (voucher.validUntil < new Date()) throw new Error('Mã voucher đã hết hạn');
  if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
    throw new Error('Mã voucher đã hết lượt sử dụng');
  }
  if (voucher.customer && customerId && voucher.customer.toString() !== customerId) {
    throw new Error('Mã voucher này không dành cho tài khoản của bạn');
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

export type SerializedCustomerVoucher = {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
};

function serializeCustomerVoucher(voucher: IVoucher): SerializedCustomerVoucher {
  return {
    _id: voucher._id.toString(),
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: Number(voucher.discountValue),
    maxDiscountAmount: voucher.maxDiscountAmount != null ? Number(voucher.maxDiscountAmount) : null,
    minOrderAmount: Number(voucher.minOrderAmount ?? 0),
    validUntil: voucher.validUntil.toISOString(),
    usageLimit: voucher.usageLimit ?? null,
    usedCount: voucher.usedCount,
  };
}

/**
 * Lấy danh sách voucher khách hàng có thể sử dụng (global hoặc gán riêng user).
 */
export const getAvailableVouchersForCustomer = async (
  customerId: string
): Promise<SerializedCustomerVoucher[]> => {
  const now = new Date();
  const vouchers = await Voucher.find({
    isActive: true,
    validUntil: { $gte: now },
    $or: [{ customer: null }, { customer: customerId }],
    $expr: {
      $or: [
        { $eq: ['$usageLimit', null] },
        { $lt: ['$usedCount', '$usageLimit'] },
      ],
    },
  }).sort({ validUntil: 1 });

  return vouchers.map(serializeCustomerVoucher);
};
