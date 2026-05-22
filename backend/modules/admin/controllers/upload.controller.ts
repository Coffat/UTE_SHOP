import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export const uploadImage = (req: Request, res: Response): void => {
  if (!req.file) {
    sendError(res, 400, 'Không có file ảnh được tải lên');
    return;
  }

  sendSuccess(res, 201, 'Tải ảnh thành công', {
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
};
