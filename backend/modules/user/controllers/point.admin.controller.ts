import { Request, Response } from 'express';
import PointLedger, { PointTransactionType } from '../models/PointLedger.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getUsersPoints = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ role: 'CUSTOMER' })
    .select('fullName email phone points createdAt')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Danh sách điểm khách hàng', users);
});

export const getUserPointLedger = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const history = await PointLedger.find({ user: id })
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Lịch sử điểm khách hàng', history);
});

export const adjustUserPoints = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { points, action, description } = req.body;
  const adminId = req.user!.id;

  if (!points || points <= 0 || !['ADD', 'SUBTRACT'].includes(action) || !description) {
    return sendError(res, 400, 'Dữ liệu không hợp lệ. Vui lòng nhập số điểm, hành động và lý do.');
  }

  const user = await User.findById(id);
  if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    if (action === 'SUBTRACT' && user.points < points) {
      throw new Error('Số điểm trừ vượt quá số điểm hiện có của khách hàng');
    }

    const adjustment = action === 'ADD' ? points : -points;
    await User.findByIdAndUpdate(id, { $inc: { points: adjustment } }, { session });

    await PointLedger.create([{
      user: id,
      createdBy: adminId,
      amount: points,
      type: PointTransactionType.ADMIN_ADJUST,
      description: `[${action === 'ADD' ? 'Cộng' : 'Trừ'} thủ công] ${description}`
    }], { session });

    await session.commitTransaction();
    sendSuccess(res, 200, 'Điều chỉnh điểm thành công');
  } catch (err: any) {
    await session.abortTransaction();
    sendError(res, 400, err.message || 'Lỗi khi điều chỉnh điểm');
  } finally {
    session.endSession();
  }
});
