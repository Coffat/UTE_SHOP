/**
 * routes/index.ts – Router tổng hợp (Strangler Fig Pattern)
 *
 * Mount tất cả module routes vào prefix /api/v1/
 */

import express from 'express';

// ─── Module: User & Auth ──────────────────────────────────────────────────────
import authRoutes from '../modules/user/routes/auth.routes.js';
import userRoutes from '../modules/user/routes/user.routes.js';
import adminRoutes from '../modules/user/routes/admin.routes.js';
import dashboardRoutes from '../modules/admin/routes/dashboard.routes.js';
import reportsRoutes from '../modules/admin/routes/reports.routes.js';
import settingsRoutes from '../modules/admin/routes/settings.routes.js';
import uploadRoutes from '../modules/admin/routes/upload.routes.js';
import adminProductRoutes from '../modules/admin/routes/products.routes.js';
import adminCategoryRoutes from '../modules/admin/routes/categories.routes.js';

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

// ─── Module: Blog & System Support ────────────────────────────────────────────
import blogRoutes from '../modules/system/routes/blog.routes.js';
import supportRoutes from '../modules/system/routes/support.routes.js';
import adminBlogRoutes from '../modules/system/routes/blog.routes.js';
import staffProductRoutes from '../modules/staff/routes/products.routes.js';
import staffCategoryRoutes from '../modules/staff/routes/categories.routes.js';
import staffOrderRoutes from '../modules/staff/routes/orders.routes.js';
import staffBlogRoutes from '../modules/staff/routes/blogs.routes.js';
import staffReviewRoutes from '../modules/staff/routes/reviews.routes.js';
import adminOrderRoutes from '../modules/admin/routes/orders.routes.js';
import adminReviewRoutes from '../modules/admin/routes/reviews.routes.js';

// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Specific admin routes first
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/reports', reportsRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/upload', uploadRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/reviews', adminReviewRoutes);
router.use('/admin/stock', stockRoutes);
router.use('/admin/vouchers', voucherRoutes);
router.use('/admin/blogs', adminBlogRoutes); // Admin namespace alias (Phase 5)

// Specific staff routes
router.use('/staff/products', staffProductRoutes);
router.use('/staff/categories', staffCategoryRoutes);
router.use('/staff/orders', staffOrderRoutes);
router.use('/staff/blogs', staffBlogRoutes);
router.use('/staff/reviews', staffReviewRoutes);

// General catch-all admin route last
router.use('/admin', adminRoutes);


// Catalog
router.use('/storefront', storefrontRoutes);
router.use('/products', productRoutes);
router.use('/products/:id/reviews', reviewRoutes);
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

// Blogs & Support
router.use('/blogs', blogRoutes);
router.use('/admin/blogs', adminBlogRoutes); // Admin namespace alias (Phase 5)
router.use('/support', supportRoutes);

export default router;
