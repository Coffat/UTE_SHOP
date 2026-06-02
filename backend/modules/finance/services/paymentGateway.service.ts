import mongoose, { ClientSession, Types } from 'mongoose';
import Order from '../../order/models/Order.js';
import Payment, { IPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';
import OrderPaymentStatus from '../../../shared/enums/OrderPaymentStatus.js';
import PaymentMethod from '../../../shared/enums/PaymentMethod.js';
import { AppError } from '../../../shared/utils/AppError.js';
import {
  appendTransactionCallbackPayload,
  getLatestPaymentTransactionByOrder,
  getOrCreatePendingTransaction,
  getPaymentTransactionByRef,
  markTransactionStatus,
  setTransactionProviderResponse,
} from './paymentTransaction.service.js';
import { createMomoSandboxPayment, verifyMomoIpnSignature } from './momoPayment.service.js';
import { createVnpaySandboxPayment, verifyVnpaySignature } from './vnpayPayment.service.js';
import { IPaymentTransaction, PaymentProvider, PaymentTransactionStatus } from '../models/PaymentTransaction.js';

interface UserContext {
  id: string;
  role: string;
}

interface FinalizePaymentParams {
  transaction: IPaymentTransaction;
  success: boolean;
  providerTransactionId?: string | null;
  callbackPayload?: Record<string, unknown>;
}

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in (value as object)) {
    return Number((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(String(value)) || 0;
};

const getOrderOwnedByUser = async (orderId: string, user: UserContext) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  if (user.role === 'CUSTOMER') {
    const ownerId = order.customer?.toString();
    if (!ownerId || ownerId !== user.id) {
      throw new AppError('Bạn không có quyền thao tác thanh toán cho đơn hàng này', 403);
    }
  }

  return order;
};

const getLatestLegacyPaymentByOrder = async (orderId: Types.ObjectId, session?: ClientSession): Promise<IPayment | null> => {
  return Payment.findOne({ order: orderId }).sort({ createdAt: -1 }).session(session || null);
};

const finalizePaymentWithoutTransaction = async ({
  transaction,
  success,
  providerTransactionId = null,
  callbackPayload = {},
}: FinalizePaymentParams) => {
  const updatedTransaction = await markTransactionStatus({
    transactionRef: transaction.transactionRef,
    status: success ? PaymentTransactionStatus.SUCCESS : PaymentTransactionStatus.FAILED,
    providerTransactionId,
    callbackPayload,
  });

  if (!updatedTransaction) {
    throw new AppError('Không tìm thấy transaction để cập nhật trạng thái', 404);
  }

  const order = await Order.findById(updatedTransaction.orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng cho transaction', 404);

  if (success) {
    order.paymentStatus = OrderPaymentStatus.PAID;
  } else if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    order.paymentStatus = OrderPaymentStatus.FAILED;
  }
  await order.save();

  const payment = await getLatestLegacyPaymentByOrder(order._id as Types.ObjectId);
  if (payment && payment.status !== PaymentStatus.SUCCESS) {
    payment.status = success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    payment.transactionId = providerTransactionId || updatedTransaction.transactionRef;
    await payment.save();
  }

  return { transaction: updatedTransaction, order, payment };
};

const finalizePaymentState = async ({
  transaction,
  success,
  providerTransactionId = null,
  callbackPayload = {},
}: FinalizePaymentParams) => {
  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessionErr: any) {
    console.warn('⚠️ Standard MongoDB without replica set, bypassing session creation in finalizePaymentState:', sessionErr.message);
  }

  if (!session) {
    return finalizePaymentWithoutTransaction({ transaction, success, providerTransactionId, callbackPayload });
  }

  try {
    const updatedTransaction = await markTransactionStatus({
      transactionRef: transaction.transactionRef,
      status: success ? PaymentTransactionStatus.SUCCESS : PaymentTransactionStatus.FAILED,
      providerTransactionId,
      callbackPayload,
      session,
    });

    if (!updatedTransaction) {
      throw new AppError('Không tìm thấy transaction để cập nhật trạng thái', 404);
    }

    const order = await Order.findById(updatedTransaction.orderId).session(session);
    if (!order) throw new AppError('Không tìm thấy đơn hàng cho transaction', 404);

    if (success) {
      order.paymentStatus = OrderPaymentStatus.PAID;
    } else if (order.paymentStatus !== OrderPaymentStatus.PAID) {
      order.paymentStatus = OrderPaymentStatus.FAILED;
    }
    await order.save({ session });

    const payment = await getLatestLegacyPaymentByOrder(order._id as Types.ObjectId, session);
    if (payment && payment.status !== PaymentStatus.SUCCESS) {
      payment.status = success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      payment.transactionId = providerTransactionId || updatedTransaction.transactionRef;
      await payment.save({ session });
    }

    await session.commitTransaction();
    return { transaction: updatedTransaction, order, payment };
  } catch (error: any) {
    await session.abortTransaction();
    const isTransactionError =
      error.message?.includes('replica set') || error.message?.includes('Transaction numbers');
    if (isTransactionError) {
      session.endSession();
      return finalizePaymentWithoutTransaction({ transaction, success, providerTransactionId, callbackPayload });
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const assertOrderCanCreatePayment = (order: any) => {
  if (order.paymentStatus === OrderPaymentStatus.PAID) {
    throw new AppError('Đơn hàng đã được thanh toán', 409);
  }
  if (order.status === 'CANCELLED') {
    throw new AppError('Đơn hàng đã hủy, không thể tạo thanh toán', 409);
  }
};

export const createMomoPaymentUrl = async (orderId: string, user: UserContext) => {
  const order = await getOrderOwnedByUser(orderId, user);
  assertOrderCanCreatePayment(order);

  if (order.paymentMethod !== PaymentMethod.MOMO) {
    throw new AppError('Đơn hàng không sử dụng phương thức MoMo', 400);
  }

  const amount = toNumber(order.totalAmount);
  const transaction = await getOrCreatePendingTransaction({
    orderId,
    provider: PaymentProvider.MOMO,
    amount,
    requestPayload: { orderId },
  });
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    order.paymentStatus = OrderPaymentStatus.PENDING;
    await order.save();
  }

  const gatewayResponse = await createMomoSandboxPayment({
    orderCode: order.orderCode,
    orderId,
    transactionRef: transaction.transactionRef,
    amount,
  });

  await setTransactionProviderResponse(transaction.transactionRef, gatewayResponse.responsePayload);
  return {
    orderId,
    transactionRef: transaction.transactionRef,
    payUrl: gatewayResponse.payUrl,
    deeplink: gatewayResponse.deeplink,
    qrCodeUrl: gatewayResponse.qrCodeUrl,
  };
};

export const createVnpayPaymentUrl = async (orderId: string, user: UserContext, ipAddress?: string) => {
  const order = await getOrderOwnedByUser(orderId, user);
  assertOrderCanCreatePayment(order);

  if (order.paymentMethod !== PaymentMethod.VNPAY) {
    throw new AppError('Đơn hàng không sử dụng phương thức VNPAY', 400);
  }

  const amount = toNumber(order.totalAmount);
  const transaction = await getOrCreatePendingTransaction({
    orderId,
    provider: PaymentProvider.VNPAY,
    amount,
    requestPayload: { orderId },
  });
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    order.paymentStatus = OrderPaymentStatus.PENDING;
    await order.save();
  }

  const gatewayResponse = await createVnpaySandboxPayment({
    orderCode: order.orderCode,
    transactionRef: transaction.transactionRef,
    amount,
    ipAddress,
  });

  await setTransactionProviderResponse(transaction.transactionRef, { paymentUrl: gatewayResponse.paymentUrl });
  return {
    orderId,
    transactionRef: transaction.transactionRef,
    paymentUrl: gatewayResponse.paymentUrl,
  };
};

const rejectInvalidIpn = (message: string, statusCode = 400): never => {
  console.warn(`[PAYMENT_IPN_REJECTED] ${message}`);
  throw new AppError(message, statusCode);
};

export const handleMomoIpn = async (payload: Record<string, unknown>) => {
  const isSignatureValid = verifyMomoIpnSignature(payload);
  if (!isSignatureValid) {
    rejectInvalidIpn('MoMo IPN signature không hợp lệ', 400);
  }

  const transactionRef = String(payload.orderId || payload.requestId || '');
  if (!transactionRef) rejectInvalidIpn('Thiếu transactionRef trong payload MoMo', 400);

  const transaction = await getPaymentTransactionByRef(transactionRef);
  if (!transaction || transaction.provider !== PaymentProvider.MOMO) {
    rejectInvalidIpn('Không tìm thấy transaction MoMo tương ứng', 404);
  }
  const resolvedTransaction = transaction as IPaymentTransaction;

  const order = await Order.findById(resolvedTransaction.orderId);
  if (!order) rejectInvalidIpn('Không tìm thấy order của transaction MoMo', 404);
  const resolvedOrder = order as NonNullable<typeof order>;

  const providerAmount = Number(payload.amount ?? 0);
  const txAmount = toNumber(resolvedTransaction.amount);
  const orderAmount = toNumber(resolvedOrder.totalAmount);
  if (providerAmount !== txAmount || providerAmount !== orderAmount) {
    rejectInvalidIpn('MoMo IPN amount không khớp', 400);
  }

  if (resolvedTransaction.status === PaymentTransactionStatus.SUCCESS) {
    return { idempotent: true, transactionRef, status: 'SUCCESS' };
  }
  await appendTransactionCallbackPayload(transactionRef, payload);

  const success = Number(payload.resultCode ?? -1) === 0;
  await finalizePaymentState({
    transaction: resolvedTransaction,
    success,
    providerTransactionId: payload.transId ? String(payload.transId) : null,
    callbackPayload: payload,
  });

  return { idempotent: false, transactionRef, status: success ? 'SUCCESS' : 'FAILED' };
};

export const handleVnpayIpn = async (query: Record<string, string | undefined>) => {
  const isSignatureValid = verifyVnpaySignature(query);
  if (!isSignatureValid) {
    rejectInvalidIpn('VNPAY IPN signature không hợp lệ', 400);
  }

  const transactionRef = query.vnp_TxnRef || '';
  if (!transactionRef) rejectInvalidIpn('Thiếu vnp_TxnRef trong IPN VNPAY', 400);

  const transaction = await getPaymentTransactionByRef(transactionRef);
  if (!transaction || transaction.provider !== PaymentProvider.VNPAY) {
    rejectInvalidIpn('Không tìm thấy transaction VNPAY tương ứng', 404);
  }
  const resolvedTransaction = transaction as IPaymentTransaction;

  const order = await Order.findById(resolvedTransaction.orderId);
  if (!order) rejectInvalidIpn('Không tìm thấy order của transaction VNPAY', 404);
  const resolvedOrder = order as NonNullable<typeof order>;

  const providerAmount = Math.round((Number(query.vnp_Amount || 0) || 0) / 100);
  const txAmount = toNumber(resolvedTransaction.amount);
  const orderAmount = toNumber(resolvedOrder.totalAmount);
  if (providerAmount !== txAmount || providerAmount !== orderAmount) {
    rejectInvalidIpn('VNPAY IPN amount không khớp', 400);
  }

  if (resolvedTransaction.status === PaymentTransactionStatus.SUCCESS) {
    return { idempotent: true, transactionRef, status: 'SUCCESS' };
  }
  await appendTransactionCallbackPayload(transactionRef, query as Record<string, unknown>);

  const success = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
  await finalizePaymentState({
    transaction: resolvedTransaction,
    success,
    providerTransactionId: query.vnp_TransactionNo || null,
    callbackPayload: query as Record<string, unknown>,
  });

  return { idempotent: false, transactionRef, status: success ? 'SUCCESS' : 'FAILED' };
};

export const getOrderPaymentStatus = async (orderId: string, user: UserContext) => {
  const order = await getOrderOwnedByUser(orderId, user);
  const latestTx = await getLatestPaymentTransactionByOrder(orderId);
  return {
    orderId: String(order._id),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    latestTransaction: latestTx
      ? {
          transactionRef: latestTx.transactionRef,
          provider: latestTx.provider,
          status: latestTx.status,
          providerTransactionId: latestTx.providerTransactionId,
          updatedAt: latestTx.updatedAt,
        }
      : null,
  };
};

export const getPaymentStatusByTransactionRef = async (transactionRef: string, user: UserContext) => {
  const transaction = await getPaymentTransactionByRef(transactionRef);
  if (!transaction) {
    throw new AppError('Không tìm thấy transaction', 404);
  }

  const order = await getOrderOwnedByUser(String(transaction.orderId), user);
  return {
    orderId: String(order._id),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    latestTransaction: {
      transactionRef: transaction.transactionRef,
      provider: transaction.provider,
      status: transaction.status,
      providerTransactionId: transaction.providerTransactionId,
      updatedAt: transaction.updatedAt,
    },
  };
};
