import { Request, Response } from 'express';
import * as orderService from '../../order/services/order.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';

const STAFF_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF'];

// GET /api/v1/staff/orders
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

  const userRole = req.user!.role;
  if (!STAFF_ROLES.includes(userRole)) {
    return sendError(res, 403, 'Bạn không có quyền truy cập');
  }

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

  // Apply DTO filtering for list view based on role
  const staffItems = items.map((item: any) => {
    if (userRole === 'STORE_STAFF') {
      const { totalAmount, payment, ...rest } = item;
      return rest;
    }
    return item;
  });

  sendSuccess(res, 200, 'OK', {
    items: staffItems,
    meta: {
      total,
      page: currentPage,
      limit: currentLimit,
      pages,
      summary,
    },
  });
});

// GET /api/v1/staff/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  const userRole = req.user!.role;
  if (!STAFF_ROLES.includes(userRole)) {
    return sendError(res, 403, 'Bạn không có quyền truy cập');
  }

  const staffDto = orderService.toStaffOrderDto(order, userRole);
  sendSuccess(res, 200, 'OK', staffDto);
});

// PATCH /api/v1/staff/orders/:id/status
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, note } = req.body;
  const userRole = req.user!.role;

  if (!STAFF_ROLES.includes(userRole)) {
    return sendError(res, 403, 'Bạn không có quyền truy cập');
  }

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  // Enforce order transition authorization matrix
  if (!orderService.canTransitionOrderStatus(userRole, order.status, status as OrderStatus)) {
    return sendError(res, 403, 'Bạn không có quyền thực hiện chuyển đổi trạng thái này');
  }

  const beforeOrder = order.toObject();
  const updatedOrder = await orderService.updateOrderStatus(
    id,
    status as OrderStatus,
    note ?? '',
    req.user!.id,
    userRole
  );

  // Write audit log for staff mutation
  await writeAuditLog(
    req,
    'UPDATE_STATUS',
    'Order',
    id,
    beforeOrder,
    updatedOrder.toObject()
  );

  sendSuccess(
    res,
    200,
    'Cập nhật trạng thái thành công',
    orderService.toStaffOrderDto(updatedOrder, userRole)
  );
});
