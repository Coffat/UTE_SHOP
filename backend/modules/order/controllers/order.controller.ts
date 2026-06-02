import { Request, Response } from 'express';
import * as orderService from '../services/order.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import { AppError } from '../../../shared/utils/AppError.js';

const ADMIN_STAFF_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'];

// GET /api/v1/orders
export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    statusGroup,
    orderType,
    search,
    dateFrom,
    dateTo,
    page,
    limit,
    includeSummary,
    customerId: queryCustomerId,
    paymentStatus,
  } = req.query;

  const isCustomer = req.user!.role === 'CUSTOMER';
  const customerId = isCustomer ? req.user!.id : (queryCustomerId as string | undefined);
  const isAdminView = ADMIN_STAFF_ROLES.includes(req.user!.role);

  const result = await orderService.getOrders({
    customerId,
    status: status as string,
    statusGroup: statusGroup as string,
    orderType: orderType as string,
    search: search as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    paymentStatus: isAdminView ? (paymentStatus as string) : undefined,
    page: page ? +page : undefined,
    limit: limit ? +limit : undefined,
    includeSummary: isAdminView && includeSummary === 'true',
  });

  const { items, total, page: currentPage, limit: currentLimit, pages, summary } = result;

  sendSuccess(res, 200, 'OK', {
    items,
    meta: {
      total,
      page: currentPage,
      limit: currentLimit,
      pages,
      ...(summary ? { summary } : {}),
    },
  });
});

// GET /api/v1/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  try {
    orderService.assertOrderAccess(order, req.user!.id, req.user!.role);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
    throw err;
  }

  const orderObj = order.toObject();
  if (req.user!.role === 'CUSTOMER') {
    const Review = (await import('../../catalog/models/Review.js')).default;
    for (const item of orderObj.items) {
      const productId = item.productVariant && typeof item.productVariant === 'object' && item.productVariant.product
        ? (item.productVariant.product._id || item.productVariant.product)
        : null;
      if (productId) {
        const reviewExists = await Review.findOne({
          customer: req.user!.id,
          product: productId,
          order: order._id,
        });
        item.isReviewed = !!reviewExists;
      } else {
        item.isReviewed = false;
      }
    }
  }

  sendSuccess(res, 200, 'OK', orderObj);
});

// POST /api/v1/orders – Đặt hàng (ACID transaction)
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.placeOrder({ ...req.body, customerId: req.user!.id });
  sendSuccess(res, 201, 'Đặt hàng thành công', order);
});

// POST /api/v1/orders/cart/sync – Đồng bộ giỏ hàng
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const cart = await orderService.syncCart(req.user!.id, items);
  sendSuccess(res, 200, 'Đồng bộ giỏ hàng thành công', { cartId: String((cart as { _id: unknown })._id) });
});

// PATCH /api/v1/orders/:id/status
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(
    id,
    status as OrderStatus,
    note ?? '',
    req.user!.id
  );
  sendSuccess(res, 200, 'Cập nhật trạng thái thành công', order);
});

// DELETE /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const order = await orderService.cancelOrder(id, reason, req.user!.id);
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', order);
});
