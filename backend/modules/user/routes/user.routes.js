import express from 'express';
import { getProfile, editProfile } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

// GET /api/v1/users/profile – Lấy profile (mọi role đã đăng nhập)
router.get('/profile', authenticate, getProfile);

// PUT /api/v1/users/profile – Cập nhật profile (chỉ CUSTOMER & ADMIN)
router.put('/profile', authenticate, authorize('CUSTOMER', 'ADMIN'), editProfile);

export default router;
