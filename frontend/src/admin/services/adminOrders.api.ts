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
  confirmed: number;
  ready: number;
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

/** Số đơn cần xử lý (chờ duyệt / xác nhận / sẵn sàng giao). */
export async function fetchPendingOrdersCount(signal?: AbortSignal): Promise<number> {
  const response = await api.get("/api/v1/orders", {
    params: { page: 1, limit: 1, includeSummary: "true" },
    signal,
  });

  const { meta } = response.data.data as { meta: OrdersListResult["meta"] };
  return meta.summary?.pending ?? 0;
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

export async function fetchAdminOrderById(orderId: string, signal?: AbortSignal) {
  const response = await api.get(`/api/v1/orders/${orderId}`, { signal });
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

const EXPORT_PAGE_LIMIT = 100;
const EXPORT_MAX_ROWS = 2000;

export interface FetchAllOrdersResult {
  items: AdminOrderRow[];
  truncated: boolean;
  total: number;
}

export async function fetchAllAdminOrdersForExport(
  params: OrdersListParams = {}
): Promise<FetchAllOrdersResult> {
  const allItems: AdminOrderRow[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;

  while (allItems.length < EXPORT_MAX_ROWS) {
    const result = await fetchAdminOrders({
      ...params,
      page,
      limit: EXPORT_PAGE_LIMIT,
      includeSummary: false,
    });

    total = result.meta.total;
    allItems.push(...result.items);

    if (result.items.length === 0 || page >= result.meta.pages) {
      break;
    }

    if (allItems.length >= EXPORT_MAX_ROWS) {
      truncated = total > EXPORT_MAX_ROWS;
      break;
    }

    page += 1;
  }

  return {
    items: allItems.slice(0, EXPORT_MAX_ROWS),
    truncated,
    total,
  };
}

export interface AdminOrderLineItem {
  variantId: string;
  quantity: number;
}

export interface AdminOrderRecipient {
  fullName: string;
  phone: string;
  deliveryNote?: string;
}

export interface AdminOrderPreviewPayload {
  customerId: string;
  items: AdminOrderLineItem[];
  voucherCode?: string;
  pointsToUse?: number;
}

export interface AdminOrderPreviewResult {
  subTotal: number;
  shippingFee: number;
  voucherDiscount: number;
  pointsDiscount: number;
  finalTotal: number;
  pointsUsed: number;
}

export interface AdminCreateOrderPayload extends AdminOrderPreviewPayload {
  recipientInfo: AdminOrderRecipient;
  deliveryAddressId?: string;
  orderType?: "ONLINE" | "AT_STORE";
  paymentMethod: "MOMO" | "COD" | "CASH" | "VNPAY";
  note?: string;
}

export async function previewAdminOrder(
  payload: AdminOrderPreviewPayload,
  signal?: AbortSignal
): Promise<AdminOrderPreviewResult> {
  const response = await api.post("/api/v1/admin/orders/preview", payload, { signal });
  return response.data.data as AdminOrderPreviewResult;
}

export async function createAdminOrder(payload: AdminCreateOrderPayload) {
  const response = await api.post("/api/v1/admin/orders", payload);
  return response.data.data as { _id?: string; id?: string };
}
