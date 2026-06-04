import { Request, Response } from 'express';
import PointLedger from '../models/PointLedger.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const getPointHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const history = await PointLedger.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50); // Get latest 50 transactions

  sendSuccess(res, 200, 'Lịch sử điểm', history);
});
