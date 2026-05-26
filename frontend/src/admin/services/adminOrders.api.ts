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
  includeSummary?: boolean;
}

export interface AttentionOrder {
  id: string;
  orderCode: string;
  customerName: string;
  createdAt: string;
  attentionLabel: string;
}

export interface OrdersSummary {
  total: number;
  pending: number;
  shipping: number;
  completed: number;
  cancelled: number;
  attentionCount: number;
  attentionOrders: AttentionOrder[];
}

export interface OrdersListResult {
  items: AdminOrderRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    summary?: OrdersSummary;
  };
}

export async function fetchAdminOrders(
  params: OrdersListParams = {}
): Promise<OrdersListResult> {
  const response = await api.get("/api/v1/orders", {
    params: {
      ...params,
      includeSummary: params.includeSummary ? "true" : undefined,
    },
  });

  const { items, meta } = response.data.data as {
    items: BackendOrderListItem[];
    meta: OrdersListResult["meta"];
  };

  return {
    items: items.map(mapBackendOrderToRow),
    meta,
  };
}

export async function fetchAdminOrderById(orderId: string) {
  const response = await api.get(`/api/v1/orders/${orderId}`);
  return response.data.data;
}

export async function changeOrderStatus(
  orderId: string,
  status: BackendOrderStatus,
  note?: string
) {
  const response = await api.patch(`/api/v1/orders/${orderId}/status`, {
    status,
    note: note ?? "",
  });
  return response.data.data;
}

export async function cancelAdminOrder(orderId: string, reason: string) {
  const response = await api.post(`/api/v1/orders/${orderId}/cancel`, { reason });
  return response.data.data;
}
