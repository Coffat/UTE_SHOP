import type { BackendPaymentStatus } from "../services/mappers/order.mapper";

export type OrderTypeFilter = "" | "ONLINE" | "AT_STORE";

export interface OrderAdvancedFilters {
  dateFrom: string;
  dateTo: string;
  orderType: OrderTypeFilter;
  paymentStatus: "" | BackendPaymentStatus;
}

export const EMPTY_ORDER_FILTERS: OrderAdvancedFilters = {
  dateFrom: "",
  dateTo: "",
  orderType: "",
  paymentStatus: "",
};

export function countActiveOrderFilters(filters: OrderAdvancedFilters): number {
  let count = 0;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  if (filters.orderType) count += 1;
  if (filters.paymentStatus) count += 1;
  return count;
}
