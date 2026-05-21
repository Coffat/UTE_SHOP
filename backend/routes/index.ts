/**
 * routes/index.ts – Router tổng hợp (Strangler Fig Pattern)
 *
 * Mount tất cả module routes vào prefix /api/v1/
 */

import express from 'express';

// ─── Module: User & Auth ──────────────────────────────────────────────────────
import authRoutes from '../modules/user/routes/auth.routes.js';
import userRoutes from '../modules/user/routes/user.routes.js';

// ─── Module: Catalog ──────────────────────────────────────────────────────────
import productRoutes from '../modules/catalog/routes/product.routes.js';
import categoryRoutes from '../modules/catalog/routes/category.routes.js';
import reviewRoutes from '../modules/catalog/routes/review.routes.js';
import storefrontRoutes from '../modules/catalog/routes/storefront.routes.js';

// ─── Module: Inventory ────────────────────────────────────────────────────────
import stockRoutes from '../modules/inventory/routes/stock.routes.js';

// ─── Module: Marketing ────────────────────────────────────────────────────────
import voucherRoutes from '../modules/marketing/routes/voucher.routes.js';

// ─── Module: Order ────────────────────────────────────────────────────────────
import orderRoutes from '../modules/order/routes/order.routes.js';

// ─── Module: Finance ──────────────────────────────────────────────────────────
import paymentRoutes from '../modules/finance/routes/payment.routes.js';

// ─── Module: Logistics ────────────────────────────────────────────────────────
import addressRoutes from '../modules/logistics/routes/address.routes.js';

// ─── Module: Notification ─────────────────────────────────────────────────────
import notificationRoutes from '../modules/notification/routes/notification.routes.js';

// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Catalog
router.use('/storefront', storefrontRoutes);
router.use('/products', productRoutes);
router.use('/products', reviewRoutes);     // nested: /products/:id/reviews
router.use('/categories', categoryRoutes);

// Inventory
router.use('/stock', stockRoutes);

// Marketing
router.use('/vouchers', voucherRoutes);

// Orders
router.use('/orders', orderRoutes);

// Finance
router.use('/payments', paymentRoutes);

// Logistics
router.use('/addresses', addressRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

export default router;
