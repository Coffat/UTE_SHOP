/** Backend OrderStatus — must match backend/shared/enums/OrderStatus.ts */
export type BackendOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

/** Backend PaymentStatus */
export type BackendPaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

export type UiOrderStatus = "pending" | "shipping" | "completed" | "cancelled";
export type UiPaymentDisplay = "paid" | "cod";

export interface BackendOrderListItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  totalAmount: number;
  status: BackendOrderStatus;
  orderType: string;
  payment: {
    method: string;
    status: BackendPaymentStatus;
  } | null;
}

export interface AdminOrderRow {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  date: string;
  payment: UiPaymentDisplay;
  paymentMethod: string;
  paymentStatus: BackendPaymentStatus | null;
  amount: number;
  status: UiOrderStatus;
  backendStatus: BackendOrderStatus;
}

const STATUS_TO_UI: Record<BackendOrderStatus, UiOrderStatus> = {
  PENDING: "pending",
  CONFIRMED: "pending",
  READY: "pending",
  DELIVERING: "shipping",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const UI_TO_STATUS_GROUP: Record<UiOrderStatus, string> = {
  pending: "pending",
  shipping: "shipping",
  completed: "completed",
  cancelled: "cancelled",
};

export const uiStatusToStatusGroup = (status: UiOrderStatus): string =>
  UI_TO_STATUS_GROUP[status];

export const mapPaymentToUi = (
  payment: BackendOrderListItem["payment"]
): UiPaymentDisplay => {
  if (!payment) return "cod";
  if (payment.status === "SUCCESS") return "paid";
  if (payment.method === "COD") return "cod";
  return "cod";
};

export const mapBackendOrderToRow = (item: BackendOrderListItem): AdminOrderRow => ({
  id: item.id,
  orderCode: item.orderCode,
  customerName: item.customerName,
  customerPhone: item.customerPhone || "—",
  date: new Date(item.createdAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  payment: mapPaymentToUi(item.payment),
  paymentMethod: item.payment?.method ?? "",
  paymentStatus: item.payment?.status ?? null,
  amount: item.totalAmount,
  status: STATUS_TO_UI[item.status] ?? "pending",
  backendStatus: item.status,
});

/** Next status in workflow for quick admin action */
export const getNextBackendStatus = (
  current: BackendOrderStatus
): BackendOrderStatus | null => {
  const flow: Partial<Record<BackendOrderStatus, BackendOrderStatus>> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "READY",
    READY: "DELIVERING",
    DELIVERING: "COMPLETED",
  };
  return flow[current] ?? null;
};
