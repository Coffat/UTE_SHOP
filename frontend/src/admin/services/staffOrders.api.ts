import { api } from "../../lib/api";
import {
  mapBackendOrderToRow,
  type AdminOrderRow,
  type BackendOrderListItem,
  type BackendOrderStatus,
} from "./mappers/order.mapper";

export interface OrdersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BackendOrderStatus;
  statusGroup?: string;
  orderType?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrdersListResult {
  items: AdminOrderRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function fetchStaffOrders(
  params: OrdersListParams = {}
): Promise<OrdersListResult> {
  const response = await api.get("/api/v1/staff/orders", { params });

  const { items, meta } = response.data.data as {
    items: BackendOrderListItem[];
    meta: OrdersListResult["meta"];
  };

  return {
    items: items.map(mapBackendOrderToRow),
    meta,
  };
}

export async function fetchStaffOrderById(orderId: string) {
  const response = await api.get(`/api/v1/staff/orders/${orderId}`);
  return response.data.data;
}

export async function changeStaffOrderStatus(
  orderId: string,
  status: BackendOrderStatus,
  note?: string
) {
  const response = await api.patch(`/api/v1/staff/orders/${orderId}/status`, {
    status,
    note: note ?? "",
  });
  return response.data.data;
}
