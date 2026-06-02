import express from 'express';
import {
  getProfile,
  editProfile,
  changePassword,
} from '../controllers/user.controller.js';
import * as wishlistController from '../controllers/wishlist.controller.js';
import * as pointController from '../controllers/point.controller.js';
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

// Wishlist routes
router.get('/wishlist', authenticate, wishlistController.getWishlist);
router.post('/wishlist/:productId', authenticate, wishlistController.toggleWishlist);

// Points route
router.get('/points/history', authenticate, pointController.getPointHistory);

export default router;
