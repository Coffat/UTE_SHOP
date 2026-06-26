import { api } from "../../lib/api";
import {
  mapBackendOrderToRow,
  type AdminOrderRow,
  type BackendOrderListItem,
  type BackendOrderStatus,
} from "./mappers/order.mapper";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoreOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  statusGroup?: string;
  orderType?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface StoreOrdersResult {
  items: AdminOrderRow[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface StoreSummary {
  needActionCount: number;
  readyCount: number;
  todayTotal: number;
  completedToday: number;
  urgentOrders: Array<{
    id: string;
    orderCode: string;
    customerName: string;
    status: string;
    orderType: string;
    createdAt: string;
  }>;
}

export interface StoreCreateOrderPayload {
  customerId?: string | null;
  items: Array<{ variantId: string; quantity: number }>;
  recipientInfo: { fullName: string; phone: string; deliveryNote?: string };
  paymentMethod?: "CASH" | "MOMO" | "VNPAY";
  note?: string;
  voucherCode?: string;
}

export interface StoreCustomerLookupResult {
  items: Array<{
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
  }>;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function fetchStoreSummary(): Promise<StoreSummary> {
  const res = await api.get("/api/v1/store/summary");
  return res.data.data as StoreSummary;
}

export async function fetchStoreOrders(params: StoreOrdersParams = {}): Promise<StoreOrdersResult> {
  const res = await api.get("/api/v1/store/orders", { params });
  const { items, meta } = res.data.data as { items: BackendOrderListItem[]; meta: StoreOrdersResult["meta"] };
  return { items: items.map(mapBackendOrderToRow), meta };
}

export async function fetchStoreOrderById(orderId: string, signal?: AbortSignal) {
  const res = await api.get(`/api/v1/store/orders/${orderId}`, { signal });
  return res.data.data;
}

export async function changeStoreOrderStatus(orderId: string, status: BackendOrderStatus, note?: string) {
  const res = await api.patch(`/api/v1/store/orders/${orderId}/status`, { status, note: note ?? "" });
  return res.data.data;
}

export async function cancelStoreOrder(orderId: string, reason: string) {
  const res = await api.post(`/api/v1/store/orders/${orderId}/cancel`, { reason });
  return res.data.data;
}

export async function confirmStorePayment(orderId: string, paymentMethod?: string, note?: string) {
  const res = await api.post(`/api/v1/store/orders/${orderId}/confirm-payment`, { paymentMethod, note });
  return res.data.data;
}

export async function createStoreOrder(payload: StoreCreateOrderPayload) {
  const res = await api.post("/api/v1/store/orders", payload);
  return res.data.data as { id: string; orderCode: string };
}

export async function createStoreVnpayPayment(orderId: string) {
  const res = await api.post("/api/v1/payments/vnpay/create", { orderId });
  return res.data.data as { paymentUrl?: string; payUrl?: string };
}

export async function fetchStoreCustomers(search: string, limit = 5): Promise<StoreCustomerLookupResult> {
  const res = await api.get("/api/v1/store/customers", {
    params: {
      search,
      limit,
    },
  });
  return res.data.data as StoreCustomerLookupResult;
}
