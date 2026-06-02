import OrderStatus from '../enums/OrderStatus.js';
import PaymentStatus from '../enums/PaymentStatus.js';

export interface AdminOrderPaymentDto {
  method: string;
  status: PaymentStatus;
}

export interface AttentionOrderDto {
  id: string;
  orderCode: string;
  customerName: string;
  createdAt: string;
  status: OrderStatus;
  attentionLabel: string;
}

export interface AdminOrderListItemDto {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  totalAmount: number;
  status: OrderStatus;
  orderType: string;
  payment: AdminOrderPaymentDto | null;
  items?: any[];
}

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in (value as object)) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};

export const mapOrderToAdminListItem = (
  order: Record<string, unknown>,
  payment?: Record<string, unknown> | null
): AdminOrderListItemDto => {
  const customer = order.customer as Record<string, unknown> | null | undefined;
  const recipient = order.recipient as Record<string, unknown> | undefined;

  return {
    id: String(order._id),
    orderCode: String(order.orderCode ?? ''),
    customerName: String(
      customer?.fullName ?? recipient?.fullName ?? 'Khách lẻ'
    ),
    customerPhone: String(
      customer?.phone ?? recipient?.phone ?? ''
    ),
    createdAt: order.createdAt
      ? new Date(order.createdAt as string | Date).toISOString()
      : new Date().toISOString(),
    totalAmount: decimalToNumber(order.totalAmount),
    status: order.status as OrderStatus,
    orderType: String(order.orderType ?? ''),
    payment: payment
      ? {
          method: String(payment.method ?? ''),
          status: payment.status as PaymentStatus,
        }
      : null,
    items: order.items as any[],
  };
};
