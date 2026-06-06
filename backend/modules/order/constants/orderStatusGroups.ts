import OrderStatus from '../../../shared/enums/OrderStatus.js';

/** UI filter groups — maps to existing OrderStatus values only */
export const ORDER_STATUS_GROUP_MAP: Record<string, OrderStatus[]> = {
  pending: [OrderStatus.PENDING],
  confirmed: [OrderStatus.CONFIRMED],
  ready: [OrderStatus.READY],
  shipping: [OrderStatus.DELIVERING],
  completed: [OrderStatus.COMPLETED],
  cancelled: [OrderStatus.CANCELLED],
};

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERING],
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const isValidOrderStatusTransition = (
  current: OrderStatus,
  next: OrderStatus
): boolean => ALLOWED_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
