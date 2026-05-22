import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

// GET /api/v1/users/profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const user = await userService.getUserById(req.user.id);
  if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');
  sendSuccess(res, 200, 'OK', user);
});

// PUT /api/v1/users/profile
export const editProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const updated = await userService.updateUserProfile(req.user.id, req.body);
  if (!updated) return sendError(res, 404, 'Không tìm thấy người dùng');
  sendSuccess(res, 200, 'Cập nhật profile thành công', updated);
});

// POST /api/v1/users/change-password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await userService.changeUserPassword(req.user.id, currentPassword, newPassword);
  sendSuccess(res, 200, 'Đổi mật khẩu thành công', null);
});

// GET /api/v1/users/favorites
export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const favorites = await userService.getUserFavorites(req.user.id);
  sendSuccess(res, 200, 'Tải danh sách yêu thích thành công', favorites);
});

// POST /api/v1/users/favorites/:productId
export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const productId = req.params.productId as string;
  if (!productId) return sendError(res, 400, 'Mã sản phẩm là bắt buộc');
  
  await userService.addProductToFavorites(req.user.id, productId);
  sendSuccess(res, 200, 'Đã thêm sản phẩm vào danh sách yêu thích');
});

// DELETE /api/v1/users/favorites/:productId
export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const productId = req.params.productId as string;
  if (!productId) return sendError(res, 400, 'Mã sản phẩm là bắt buộc');
  
  await userService.removeProductFromFavorites(req.user.id, productId);
  sendSuccess(res, 200, 'Đã xóa sản phẩm khỏi danh sách yêu thích');
});
