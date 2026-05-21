import { Request, Response } from 'express';
import * as orderService from '../services/order.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';

// GET /api/v1/orders
export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;
  // Customer chỉ thấy đơn của mình; Admin/Staff thấy tất
  const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : (req.query.customerId as string);
  
  const result = await orderService.getOrders({
    customerId,
    status: status as string,
    page: page ? +page : undefined,
    limit: limit ? +limit : undefined,
  });
  
  sendSuccess(res, 200, 'OK', result);
});

// GET /api/v1/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'OK', order);
});

// POST /api/v1/orders – Đặt hàng (ACID transaction)
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.placeOrder({ ...req.body, customerId: req.user!.id });
  sendSuccess(res, 201, 'Đặt hàng thành công', order);
});

// PATCH /api/v1/orders/:id/status
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(id, status as OrderStatus, note, req.user!.id);
  sendSuccess(res, 200, 'Cập nhật trạng thái thành công', order);
});

// DELETE /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const order = await orderService.cancelOrder(id, reason, req.user!.id);
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', order);
});
