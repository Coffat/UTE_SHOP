import type { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
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
  const data = await putAdminSettings(req.body);
  sendSuccess(res, 200, 'Lưu cấu hình thành công', data);
});

export const rotateApiKey = asyncHandler(async (_req: Request, res: Response) => {
  const data = await rotateAdminApiKey();
  sendSuccess(res, 200, 'Đã tạo API key mới', data);
});
