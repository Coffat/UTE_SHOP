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
