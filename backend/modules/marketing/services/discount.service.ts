import mongoose, { ClientSession } from 'mongoose';
import Voucher from '../models/Voucher.js';
import User from '../../user/models/User.js';
import PointLedger, { PointTransactionType } from '../../user/models/PointLedger.js';
import DiscountType from '../../../shared/enums/DiscountType.js';
import { AppError } from '../../../shared/utils/AppError.js';

export interface CalculateTotalParams {
  subTotal: number;
  voucherCode?: string;
  pointsToUse?: number;
  userId: string;
}

export interface CalculateTotalResult {
  subTotal: number;
  shippingFee: number;
  voucherDiscount: number;
  pointsDiscount: number;
  finalTotal: number;
  voucherId?: string;
  pointsUsed: number;
}

const POINT_VALUE_VND = 1000;
const MAX_POINT_DISCOUNT_RATIO = 0.5;

export const calculateOrderTotal = async ({
  subTotal,
  voucherCode,
  pointsToUse = 0,
  userId,
}: CalculateTotalParams): Promise<CalculateTotalResult> => {
  let voucherDiscount = 0;
  let voucherId: string | undefined = undefined;

  // 1. Calculate Voucher Discount
  if (voucherCode) {
    const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase(), isActive: true });
    
    if (!voucher) throw new AppError('Mã voucher không tồn tại hoặc đã bị khóa', 400);
    if (voucher.validUntil < new Date()) throw new AppError('Mã voucher đã hết hạn', 400);
    
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new AppError('Mã voucher đã hết lượt sử dụng', 400);
    }
    
    // Check user specific limits if implemented (e.g. max 1 per user)
    // For this MVP, we assume max 1 usage per user if usageLimit is set.
    const userUsage = voucher.usedBy?.find(u => u.userId.toString() === userId);
    if (userUsage && userUsage.usageCount >= 1) {
      throw new AppError('Bạn đã sử dụng mã voucher này rồi', 400);
    }

    if (voucher.customer && voucher.customer.toString() !== userId) {
      throw new AppError('Mã voucher này không dành cho tài khoản của bạn', 403);
    }
    if (Number(voucher.minOrderAmount) > subTotal) {
      throw new AppError(`Đơn hàng tối thiểu ${voucher.minOrderAmount} để dùng voucher này`, 400);
    }

    voucherDiscount = voucher.discountType === DiscountType.PERCENTAGE
      ? (subTotal * Number(voucher.discountValue)) / 100
      : Number(voucher.discountValue);

    if (voucher.maxDiscountAmount) {
      voucherDiscount = Math.min(voucherDiscount, Number(voucher.maxDiscountAmount));
    }

    voucherId = (voucher._id as mongoose.Types.ObjectId).toString();
  }

  // 2. Calculate Points Discount
  let pointsDiscount = 0;
  let finalPointsToUse = 0;

  if (pointsToUse > 0) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    if (user.points < pointsToUse) {
      throw new AppError(`Bạn chỉ có ${user.points} điểm`, 400);
    }

    const valueAfterVoucher = subTotal - voucherDiscount;
    const maxDiscountAllowed = valueAfterVoucher * MAX_POINT_DISCOUNT_RATIO;
    const requestedPointsValue = pointsToUse * POINT_VALUE_VND;

    if (requestedPointsValue > maxDiscountAllowed) {
      throw new AppError(`Chỉ được dùng tối đa 50% giá trị đơn hàng (tương đương ${Math.floor(maxDiscountAllowed / POINT_VALUE_VND)} điểm)`, 400);
    }

    pointsDiscount = requestedPointsValue;
    finalPointsToUse = pointsToUse;
  }

  // 3. Final Calculation
  const shippingFee = 30000; // Fixed for now, can be passed as param
  const finalTotal = Math.max(0, subTotal + shippingFee - voucherDiscount - pointsDiscount);

  return {
    subTotal,
    shippingFee,
    voucherDiscount,
    pointsDiscount,
    finalTotal,
    voucherId,
    pointsUsed: finalPointsToUse,
  };
};

export const applyDiscounts = async (
  userId: string,
  orderId: string,
  pointsUsed: number,
  voucherId?: string,
  session?: ClientSession
): Promise<void> => {
  // Apply Voucher (Atomic update)
  if (voucherId) {
    const updateResult = await Voucher.updateOne(
      { 
        _id: voucherId,
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
        ]
      },
      { 
        $inc: { usedCount: 1 } 
      },
      { session }
    );

    if (updateResult.modifiedCount === 0) {
      throw new AppError('Áp dụng mã giảm giá thất bại, có thể mã đã hết lượt ngay lúc bạn đặt hàng.', 400);
    }

    // Add user to usedBy array
    const addUsedByResult = await Voucher.updateOne(
      { _id: voucherId, 'usedBy.userId': userId },
      { $inc: { 'usedBy.$.usageCount': 1 } },
      { session }
    );
    if (addUsedByResult.modifiedCount === 0) {
      await Voucher.updateOne(
        { _id: voucherId },
        { $push: { usedBy: { userId, usageCount: 1 } } },
        { session }
      );
    }
  }

  // Deduct points and write ledger (Atomic update)
  if (pointsUsed > 0) {
    const userUpdateResult = await User.updateOne(
      { _id: userId, points: { $gte: pointsUsed } },
      { $inc: { points: -pointsUsed } },
      { session }
    );

    if (userUpdateResult.modifiedCount === 0) {
      throw new AppError('Số dư điểm không đủ, vui lòng thử lại.', 400);
    }

    await PointLedger.create(
      [{
        user: userId,
        order: orderId,
        amount: -pointsUsed,
        type: PointTransactionType.SPENT,
        description: `Dùng điểm cho đơn hàng`,
      }],
      { session }
    );
  }
};
