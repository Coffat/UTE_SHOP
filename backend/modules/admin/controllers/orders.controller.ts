import { Request, Response } from 'express';
import * as orderService from '../../order/services/order.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';

// GET /api/v1/admin/orders
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
    paymentStatus,
  } = req.query;

  const result = await orderService.getOrders({
    status: status as string,
    statusGroup: statusGroup as string,
    orderType: orderType as string,
    search: search as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    paymentStatus: paymentStatus as string,
    page: page ? +page : undefined,
    limit: limit ? +limit : undefined,
    includeSummary: true,
  });

  const { items, total, page: currentPage, limit: currentLimit, pages, summary } = result;

  sendSuccess(res, 200, 'OK', {
    items,
    meta: {
      total,
      page: currentPage,
      limit: currentLimit,
      pages,
      summary,
    },
  });
});

// GET /api/v1/admin/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'OK', order);
});

// PATCH /api/v1/admin/orders/:id/status
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

// POST /api/v1/admin/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const order = await orderService.cancelOrder(id, reason, req.user!.id);
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', order);
});

// DELETE /api/v1/admin/orders/:id - Soft-delete order
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.softDeleteOrder(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'Xóa đơn hàng thành công (soft delete)', null);
});

// POST /api/v1/admin/orders/preview
export const previewOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.previewAdminOrder(req.body);
  sendSuccess(res, 200, 'OK', result);
});

// POST /api/v1/admin/orders
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createAdminOrder(req.body, req.user!.id);
  sendSuccess(res, 201, 'Tạo đơn hàng thành công', order);
});
