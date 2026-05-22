import express from 'express';
import {
  getProfile,
  editProfile,
  changePassword,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { validateChangePassword } from '../middlewares/user.validator.js';

const ADMIN_PORTAL_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;

const router = express.Router();

// GET /api/v1/users/profile – Lấy profile (mọi role đã đăng nhập)
router.get('/profile', authenticate, getProfile);

// PUT /api/v1/users/profile – Cập nhật profile
router.put(
  '/profile',
  authenticate,
  authorize('CUSTOMER', ...ADMIN_PORTAL_ROLES),
  editProfile
);

// POST /api/v1/users/change-password
router.post(
  '/change-password',
  authenticate,
  authorize('CUSTOMER', ...ADMIN_PORTAL_ROLES),
  validateChangePassword,
  changePassword
);

// GET /api/v1/users/favorites – Lấy danh sách yêu thích (chỉ CUSTOMER)
router.get('/favorites', authenticate, authorize('CUSTOMER'), getFavorites);

// POST /api/v1/users/favorites/:productId – Thêm sản phẩm vào danh sách yêu thích (chỉ CUSTOMER)
router.post('/favorites/:productId', authenticate, authorize('CUSTOMER'), addFavorite);

// DELETE /api/v1/users/favorites/:productId – Xóa sản phẩm khỏi danh sách yêu thích (chỉ CUSTOMER)
router.delete('/favorites/:productId', authenticate, authorize('CUSTOMER'), removeFavorite);

export default router;
