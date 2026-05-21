import * as orderService from '../services/order.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

// GET /api/v1/orders
export const listOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  // Customer chỉ thấy đơn của mình; Admin/Staff thấy tất
  const customerId = req.user.role === 'CUSTOMER' ? req.user.id : req.query.customerId;
  sendSuccess(res, 200, 'OK', await orderService.getOrders({ customerId, status, page: +page, limit: +limit }));
});

// GET /api/v1/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'OK', order);
});

// POST /api/v1/orders – Đặt hàng (ACID transaction)
export const placeOrder = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder({ ...req.body, customerId: req.user.id });
  sendSuccess(res, 201, 'Đặt hàng thành công', order);
});

// POST /api/v1/orders/cart/sync – Đồng bộ giỏ hàng
export const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const cart = await orderService.syncCart(req.user.id, items);
  sendSuccess(res, 200, 'Đồng bộ giỏ hàng thành công', { cartId: cart._id });
});

// PATCH /api/v1/orders/:id/status
export const changeStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, note, req.user.id);
  sendSuccess(res, 200, 'Cập nhật trạng thái thành công', order);
});

// DELETE /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await orderService.cancelOrder(req.params.id, reason, req.user.id);
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', order);
});
