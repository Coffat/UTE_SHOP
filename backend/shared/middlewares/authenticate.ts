import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';

// Global declaration merging to add 'user' to Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

/**
 * Middleware: authenticate
 *
 * Đọc accessToken từ HttpOnly cookie, verify JWT và gắn payload vào req.user.
 * Tất cả route private đều phải đi qua middleware này.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return sendError(res, 401, 'Access denied. No token provided.');
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return sendError(res, 500, 'Server configuration error: ACCESS_TOKEN_SECRET is missing.');
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    };
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch {
    return sendError(res, 403, 'Invalid or expired token.');
  }
};

/**
 * Middleware: authorize (RBAC)
 *
 * Phải đặt SAU authenticate. Kiểm tra role của req.user.
 *
 * Sử dụng:
 *   router.get('/admin', authenticate, authorize('ADMIN'), handler)
 *   router.get('/staff', authenticate, authorize('ADMIN', 'SALES'), handler)
 *
 * Roles hệ thống: CUSTOMER | ADMIN | SALES | WAREHOUSE_STAFF | STORE_STAFF
 *
 * @param allowedRoles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Bạn không có quyền truy cập tài nguyên này.');
    }
    next();
  };
};
