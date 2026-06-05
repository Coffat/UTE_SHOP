import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';
import {
  getAdminSettings,
  putAdminSettings,
  rotateAdminApiKey,
} from '../services/settings.service.js';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminSettings();
  sendSuccess(res, 200, 'OK', data);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await putAdminSettings(req.body);
    sendSuccess(res, 200, 'Lưu cấu hình thành công', data);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

export const rotateApiKey = asyncHandler(async (_req: Request, res: Response) => {
  const data = await rotateAdminApiKey();
  sendSuccess(res, 200, 'Đã tạo API key mới', data);
});
