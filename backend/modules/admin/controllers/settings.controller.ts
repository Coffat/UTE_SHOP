import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import {
  getAdminSettings,
  putAdminSettings,
  rotateAdminApiKey,
} from '../services/settings.service.js';

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAdminSettings();
    sendSuccess(res, 200, 'OK', data);
  } catch (error) {
    console.error('[settings.getSettings]', error);
    sendError(res, 500, 'Không thể tải cấu hình');
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await putAdminSettings(req.body);
    sendSuccess(res, 200, 'Lưu cấu hình thành công', data);
  } catch (error) {
    console.error('[settings.updateSettings]', error);
    sendError(res, 500, 'Không thể lưu cấu hình');
  }
};

export const rotateApiKey = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await rotateAdminApiKey();
    sendSuccess(res, 200, 'Đã tạo API key mới', data);
  } catch (error) {
    console.error('[settings.rotateApiKey]', error);
    sendError(res, 500, 'Không thể xoay API key');
  }
};
