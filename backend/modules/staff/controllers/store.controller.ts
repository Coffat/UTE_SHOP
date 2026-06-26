import { Request, Response } from 'express';
import * as orderService from '../../order/services/order.service.js';
import * as paymentService from '../../finance/services/payment.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';
import OrderPaymentStatus from '../../../shared/enums/OrderPaymentStatus.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';
import Customer from '../../user/models/Customer.js';

// GET /api/v1/store/summary — Dashboard stats
export const getStoreSummary = asyncHandler(async (_req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayOrders, needActionOrders, readyOrders, deliveringOrders] = await Promise.all([
    // Đơn hôm nay
    orderService.getOrders({ dateFrom: todayStart.toISOString() }),
    // Đơn cần xử lý: CONFIRMED (đang chờ STORE_STAFF chuẩn bị)
    orderService.getOrders({ statusGroup: 'confirmed' }),
    // Đơn đã sẵn sàng
    orderService.getOrders({ statusGroup: 'ready' }),
    // Đơn đang giao
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
    readyCount: readyOrders.total + deliveringOrders.total,
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

// GET /api/v1/store/customers
export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

  const filter: Record<string, unknown> = {
    role: 'CUSTOMER',
    deletedAt: null,
  };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { fullName: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const customers = await Customer.find(filter)
    .select('fullName email phone')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  sendSuccess(res, 200, 'OK', {
    items: customers.map((customer) => ({
      id: customer._id.toString(),
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
    })),
    meta: { limit, total: customers.length },
  });
});

// GET /api/v1/store/orders/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(String(req.params.id));
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  sendSuccess(res, 200, 'OK', orderService.toStaffOrderDto(order, 'STORE_STAFF'));
});

// PATCH /api/v1/store/orders/:id/status
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, note } = req.body;
  const userRole = req.user!.role;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

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

  await writeAuditLog(req, 'UPDATE_STATUS', 'Order', id, beforeOrder, updatedOrder.toObject());

  sendSuccess(res, 200, 'Cập nhật trạng thái thành công', orderService.toStaffOrderDto(updatedOrder, userRole));
});

// POST /api/v1/store/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { reason } = req.body;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status as OrderStatus)) {
    return sendError(res, 400, 'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý hoặc Đã xác nhận');
  }

  const cancelled = await orderService.cancelOrder(
    id,
    reason ?? 'Hủy bởi nhân viên cửa hàng',
    req.user!.id,
    req.user!.role
  );
  sendSuccess(res, 200, 'Hủy đơn hàng thành công', orderService.toStaffOrderDto(cancelled, 'STORE_STAFF'));
});

// POST /api/v1/store/orders/:id/confirm-payment
// Xác nhận thanh toán thủ công (CASH tại quầy, MOMO kiểm tra ngoài hệ thống)
export const confirmPaymentManual = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { paymentMethod, note } = req.body;

  const order = await orderService.getOrderById(id);
  if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');
  if (order.paymentStatus === OrderPaymentStatus.PAID) {
    return sendError(res, 400, 'Đơn hàng đã được thanh toán');
  }
  if (order.paymentMethod === 'VNPAY') {
    return sendError(res, 400, 'Đơn thanh toán VNPay phải xác nhận qua cổng VNPay, không thể xác nhận thủ công');
  }
  if (paymentMethod === 'VNPAY') {
    return sendError(res, 400, 'Không hỗ trợ xác nhận thủ công bằng phương thức VNPay');
  }

  const payment = await paymentService.confirmManualPaymentByOrder({
    orderId: id,
    paymentMethod: (paymentMethod || 'CASH') as 'MOMO' | 'COD' | 'CASH' | 'VNPAY',
    note,
    actorId: req.user!.id,
  });

  sendSuccess(res, 200, 'Xác nhận thanh toán thành công', {
    orderId: id,
    paymentId: payment._id,
    transactionId: payment.transactionId,
  });
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
