import express from 'express';
import { getProfile, editProfile, getFavorites, addFavorite, removeFavorite } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

// GET /api/v1/users/profile – Lấy profile (mọi role đã đăng nhập)
router.get('/profile', authenticate, getProfile);

// PUT /api/v1/users/profile – Cập nhật profile (chỉ CUSTOMER & ADMIN)
router.put('/profile', authenticate, authorize('CUSTOMER', 'ADMIN'), editProfile);

// GET /api/v1/users/favorites – Lấy danh sách yêu thích (chỉ CUSTOMER)
router.get('/favorites', authenticate, authorize('CUSTOMER'), getFavorites);

// POST /api/v1/users/favorites/:productId – Thêm sản phẩm vào danh sách yêu thích (chỉ CUSTOMER)
router.post('/favorites/:productId', authenticate, authorize('CUSTOMER'), addFavorite);

// DELETE /api/v1/users/favorites/:productId – Xóa sản phẩm khỏi danh sách yêu thích (chỉ CUSTOMER)
router.delete('/favorites/:productId', authenticate, authorize('CUSTOMER'), removeFavorite);

export default router;
