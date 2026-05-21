import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

// POST /api/v1/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, 201, result.message);
});

// POST /api/v1/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await authService.verifyRegistrationOtp(email, otp);
  sendSuccess(res, 200, result.message);
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

  res.cookie('accessToken', accessToken, {
    httpOnly: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect URL theo role
  const roleRedirect: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    CUSTOMER: '/user/profile',
    SALES: '/staff/orders',
    WAREHOUSE_STAFF: '/staff/inventory',
    STORE_STAFF: '/staff/pos',
  };

  sendSuccess(res, 200, 'Đăng nhập thành công', {
    redirectUrl: roleRedirect[user.role as string] ?? '/user/profile',
  });
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  sendSuccess(res, 200, result.message);
});

// POST /api/v1/auth/reset-password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);
  sendSuccess(res, 200, result.message);
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logoutUser(refreshToken);

  res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' });
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

  sendSuccess(res, 200, 'Đăng xuất thành công');
});

// POST /api/v1/auth/refresh
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    return sendError(res, 401, 'Không có refresh token');
  }

  const { accessToken, refreshToken } = await authService.rotateRefreshToken(oldRefreshToken);

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true, sameSite: 'strict', secure: isProd, maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, sameSite: 'strict', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, 200, 'Refresh token thành công');
});
