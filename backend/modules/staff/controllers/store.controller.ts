import { Request, Response } from 'express';
import * as orderService from '../../order/services/order.service.js';
import * as paymentService from '../../finance/services/payment.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';
import Payment from '../../finance/models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';

// GET /api/v1/store/summary — Dashboard stats
export const getStoreSummary = asyncHandler(async (_req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayOrders, needActionOrders, readyOrders] = await Promise.all([
    // Đơn hôm nay
    orderService.getOrders({ dateFrom: todayStart.toISOString() }),
    // Đơn cần xử lý: CONFIRMED (đang chờ STORE_STAFF chuẩn bị)
    orderService.getOrders({ statusGroup: 'confirmed' }),
    // Đơn đang sắp giao: READY + DELIVERING
    orderService.getOrders({ statusGroup: 'shipping' }),
  ]);

  const completedToday = (todayOrders.items as any[]).filter(
    (o: any) => o.status === OrderStatus.COMPLETED
  ).length;

  const urgentOrders = (needActionOrders.items as any[]).slice(0, 5).map((o: any) => ({
    id: o.id || o._id,
    orderCode: o.orderCode,
    customerName: o.recipient?.fullName || o.customer?.fullName || 'Khách vãng lai',
    status: o.status,
    orderType: o.orderType,
    createdAt: o.createdAt,
  }));

  sendSuccess(res, 200, 'OK', {
    needActionCount: needActionOrders.total,
    readyCount: readyOrders.total,
    todayTotal: todayOrders.total,
    completedToday,
    urgentOrders,
  });
});

// GET /api/v1/store/orders
export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, statusGroup, orderType, search, dateFrom, dateTo, page, limit, paymentStatus } = req.query;

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
    includeSummary: false,
  });

  sendSuccess(res, 200, 'OK', {
    items: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    },
  });
});

// GET /api/v1/store/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'OK', orderService.toStaffOrderDto(order, 'STORE_STAFF'));
});

// PATCH /api/v1/store/orders/:id/status
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const userRole = req.user!.role;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  if (!orderService.canTransitionOrderStatus(userRole, order.status, status as OrderStatus)) {
    return sendError(res, 403, 'Bạn không có quyền thực hiện chuyển đổi trạng thái này');
  }

  const beforeOrder = order.toObject();
  const updatedOrder = await orderService.updateOrderStatus(id, status as OrderStatus, note ?? '', req.user!.id);

  await writeAuditLog(req, 'UPDATE_STATUS', 'Order', id, beforeOrder, updatedOrder.toObject());

  sendSuccess(res, 200, 'Cập nhật trạng thái thành công', orderService.toStaffOrderDto(updatedOrder, userRole));
});

// POST /api/v1/store/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status as OrderStatus)) {
    return sendError(res, 400, 'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý hoặc Đã xác nhận');
  }

  const cancelled = await orderService.cancelOrder(id, reason ?? 'Hủy bởi nhân viên cửa hàng', req.user!.id);
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', orderService.toStaffOrderDto(cancelled, 'STORE_STAFF'));
});

// POST /api/v1/store/orders/:id/confirm-payment
// Xác nhận thanh toán thủ công (CASH tại quầy, MOMO kiểm tra ngoài hệ thống)
export const confirmPaymentManual = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod, note } = req.body;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  // Tìm payment record hiện tại của đơn
  const payments = await paymentService.getPaymentsByOrder(id);
  let payment = payments.find((p) => p.status !== PaymentStatus.SUCCESS);

  if (!payment) {
    // Nếu chưa có payment record (đơn AT_STORE tạo thủ công), tạo mới
    payment = await paymentService.createPaymentRecord({
      orderId: id,
      amount: (order as any).finalTotal || (order as any).totalAmount,
      paymentMethod: paymentMethod || 'CASH',
    });
  }

  // Đánh dấu payment là SUCCESS
  await Payment.findByIdAndUpdate(payment._id, {
    status: PaymentStatus.SUCCESS,
    transactionId: `MANUAL-${Date.now()}`,
  });

  // Cập nhật paymentStatus trên Order
  await (order as any).constructor.findByIdAndUpdate(id, {
    paymentStatus: 'PAID',
    $push: { statusHistory: { status: order.status, note: note || 'Xác nhận thanh toán thủ công', changedBy: req.user!.id } },
  });

  sendSuccess(res, 200, 'Xác nhận thanh toán thành công', { orderId: id });
});

// POST /api/v1/store/orders — Tạo đơn AT_STORE
export const createAtStoreOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    customerId,  // optional — null nếu khách vãng lai
    items,       // [{ variantId, quantity }]
    recipientInfo, // { fullName, phone, deliveryNote }
    paymentMethod = 'CASH',
    note,
    voucherCode,
  } = req.body;

  if (!items || items.length === 0) {
    return sendError(res, 400, 'Vui lòng chọn ít nhất một sản phẩm');
  }
  if (!recipientInfo?.fullName || !recipientInfo?.phone) {
    return sendError(res, 400, 'Vui lòng nhập họ tên và số điện thoại người nhận');
  }

  const order = await orderService.createAdminOrder(
    {
      customerId: customerId || null,
      items,
      recipientInfo,
      orderType: OrderType.AT_STORE,
      paymentMethod,
      note: note || '',
      voucherCode,
    },
    req.user!.id
  );

  sendSuccess(res, 201, 'Tạo đơn hàng thành công', { id: (order as any)._id || (order as any).id, orderCode: (order as any).orderCode });
});
