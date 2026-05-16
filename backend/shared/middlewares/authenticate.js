import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware: authenticate
 *
 * Đọc accessToken từ HttpOnly cookie, verify JWT và gắn payload vào req.user.
 * Tất cả route private đều phải đi qua middleware này.
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return sendError(res, 401, 'Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
 * @param  {...string} allowedRoles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Bạn không có quyền truy cập tài nguyên này.');
    }
    next();
  };
};
