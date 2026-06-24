import OrderStatus from '../../../shared/enums/OrderStatus.js';

/** UI filter groups — maps to existing OrderStatus values only */
export const ORDER_STATUS_GROUP_MAP: Record<string, OrderStatus[]> = {
  pending: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.READY],
  shipping: [OrderStatus.DELIVERING],
  completed: [OrderStatus.COMPLETED],
  cancelled: [OrderStatus.CANCELLED],
};

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED], 
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED, OrderStatus.DELIVERY_FAILED],
  
  // Khách bấm nhận hàng -> COMPLETED. Từ COMPLETED khách bấm Trả hàng -> RETURNED
  [OrderStatus.COMPLETED]: [OrderStatus.RETURNED], 
  
  // Shipper đi giao lại lần 2, hoặc kho nhập lại hàng 
  [OrderStatus.DELIVERY_FAILED]: [OrderStatus.DELIVERING, OrderStatus.RETURNED],
  
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [], 
};

export const isValidOrderStatusTransition = (
  current: OrderStatus,
  next: OrderStatus
): boolean => ALLOWED_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
