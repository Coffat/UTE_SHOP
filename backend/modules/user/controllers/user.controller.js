import * as userService from '../services/user.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

// GET /api/v1/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');
  sendSuccess(res, 200, 'OK', user);
});

// PUT /api/v1/users/profile
export const editProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateUserProfile(req.user.id, req.body);
  if (!updated) return sendError(res, 404, 'Không tìm thấy người dùng');
  sendSuccess(res, 200, 'Cập nhật profile thành công', updated);
});

// GET /api/v1/users/favorites
export const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await userService.getUserFavorites(req.user.id);
  sendSuccess(res, 200, 'Tải danh sách yêu thích thành công', favorites);
});

// POST /api/v1/users/favorites/:productId
export const addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) return sendError(res, 400, 'Mã sản phẩm là bắt buộc');
  
  await userService.addProductToFavorites(req.user.id, productId);
  sendSuccess(res, 200, 'Đã thêm sản phẩm vào danh sách yêu thích');
});

// DELETE /api/v1/users/favorites/:productId
export const removeFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) return sendError(res, 400, 'Mã sản phẩm là bắt buộc');
  
  await userService.removeProductFromFavorites(req.user.id, productId);
  sendSuccess(res, 200, 'Đã xóa sản phẩm khỏi danh sách yêu thích');
});
