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
  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true }).populate('campaign');

  if (!voucher) throw new Error('Mã voucher không tồn tại hoặc đã bị khóa');
  
  if (voucher.campaign) {
    const campaign = voucher.campaign as any;
    if (!campaign.isActive) throw new Error('Chiến dịch chứa mã voucher này đang tạm dừng');
    
    const now = new Date();
    if (now < new Date(campaign.startDate)) throw new Error('Chiến dịch chứa mã voucher này chưa bắt đầu');
    if (now > new Date(campaign.endDate)) throw new Error('Chiến dịch chứa mã voucher này đã kết thúc');
  }

  const now = new Date();
  if (voucher.startDate > now) throw new Error('Mã voucher chưa đến thời gian sử dụng');
  if (voucher.endDate < now) throw new Error('Mã voucher đã hết hạn');
  
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

import Campaign from '../models/Campaign.js';
import { AppError } from '../../../shared/utils/AppError.js';

export const createVoucher = async (data: Partial<IVoucher>): Promise<IVoucher> => {
  if (data.campaign) {
    const campaign = await Campaign.findById(data.campaign);
    if (!campaign) throw new AppError('Chiến dịch không tồn tại', 400);
    
    const vStart = new Date(data.startDate!);
    const vEnd = new Date(data.endDate!);
    const cStart = new Date(campaign.startDate);
    const cEnd = new Date(campaign.endDate);
    
    if (vStart < cStart || vEnd > cEnd) {
      throw new AppError(`Thời gian của Voucher phải nằm trong khoảng thời gian diễn ra Chiến dịch (từ ${cStart.toLocaleDateString('vi-VN')} đến ${cEnd.toLocaleDateString('vi-VN')})`, 400);
    }
  }
  return Voucher.create(data);
};

export const getVouchers = async (): Promise<IVoucher[]> => {
  return Voucher.find().populate('campaign', 'name');
};

export const toggleVoucher = async (id: string, isActive: boolean): Promise<IVoucher | null> => {
  return Voucher.findByIdAndUpdate(id, { isActive }, { new: true });
};

export const updateVoucher = async (id: string, data: Partial<IVoucher>): Promise<IVoucher | null> => {
  if (data.campaign) {
    const campaign = await Campaign.findById(data.campaign);
    if (!campaign) throw new AppError('Chiến dịch không tồn tại', 400);
    
    const vStart = data.startDate ? new Date(data.startDate) : null;
    const vEnd = data.endDate ? new Date(data.endDate) : null;
    const cStart = new Date(campaign.startDate);
    const cEnd = new Date(campaign.endDate);
    
    if (vStart && vStart < cStart) {
      throw new AppError(`Thời gian bắt đầu của Voucher phải nằm trong khoảng thời gian diễn ra Chiến dịch (từ ${cStart.toLocaleDateString('vi-VN')} đến ${cEnd.toLocaleDateString('vi-VN')})`, 400);
    }
    if (vEnd && vEnd > cEnd) {
      throw new AppError(`Thời gian kết thúc của Voucher phải nằm trong khoảng thời gian diễn ra Chiến dịch (từ ${cStart.toLocaleDateString('vi-VN')} đến ${cEnd.toLocaleDateString('vi-VN')})`, 400);
    }
  }
  return Voucher.findByIdAndUpdate(id, data, { new: true });
};

export type SerializedCustomerVoucher = {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
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
    startDate: voucher.startDate.toISOString(),
    endDate: voucher.endDate.toISOString(),
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
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [{ customer: null }, { customer: customerId }],
    $expr: {
      $or: [
        { $eq: ['$usageLimit', null] },
        { $lt: ['$usedCount', '$usageLimit'] },
      ],
    },
  }).populate('campaign').sort({ endDate: 1 });

  // Filter out vouchers belonging to inactive/expired campaigns
  const validVouchers = vouchers.filter((v) => {
    if (v.campaign) {
      const campaign = v.campaign as any;
      if (!campaign.isActive) return false;
      if (now < new Date(campaign.startDate)) return false;
      if (now > new Date(campaign.endDate)) return false;
    }
    return true;
  });

  return validVouchers.map(serializeCustomerVoucher);
};
