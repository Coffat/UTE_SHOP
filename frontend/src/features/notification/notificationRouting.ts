import type { UserNotification } from "./notificationSlice";

export const getDashboardBasePath = (role?: string | null): string => {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return "/admin";
    case "STORE_STAFF":
      return "/store";
    case "WAREHOUSE_STAFF":
      return "/warehouse";
    default:
      return "/staff";
  }
};

export const getDashboardProfilePath = (role?: string | null): string =>
  `${getDashboardBasePath(role)}/profile`;

export const getDashboardNotificationsPath = (role?: string | null): string =>
  `${getDashboardBasePath(role)}/notifications`;

export const getDashboardOrdersPath = (role?: string | null): string => {
  const normalizedRole = (role || "").toUpperCase();
  if (normalizedRole === "ADMIN") return "/admin/orders";
  if (normalizedRole === "STORE_STAFF") return "/store/orders";
  if (normalizedRole === "WAREHOUSE_STAFF") return "/warehouse/dashboard";
  return "/staff/orders";
};

export const getDashboardChatPath = (role?: string | null): string =>
  (role || "").toUpperCase() === "ADMIN" ? "/admin/chat" : "/staff/chat";

const getOrderIdFromActionUrl = (actionUrl: string): string | null => {
  if (!actionUrl.startsWith("/orders/")) return null;
  const rawOrderId = actionUrl.slice("/orders/".length).split("?")[0]?.trim();
  if (!rawOrderId) return null;
  return rawOrderId;
};

const buildOrdersPathWithFocus = (role: string | null | undefined, orderId: string | null): string => {
  const ordersPath = getDashboardOrdersPath(role);
  if (!orderId) return ordersPath;
  return `${ordersPath}?focusOrderId=${encodeURIComponent(orderId)}`;
};

export const resolveDashboardNotificationLink = (
  item: UserNotification,
  role?: string | null
): string => {
  const actionUrl = item.notification?.actionUrl || "";
  const type = (item.notification?.type || "").toUpperCase();
  const orderIdFromActionUrl = getOrderIdFromActionUrl(actionUrl);
  const orderIdFromData =
    typeof item.notification?.data === "object" &&
    item.notification?.data !== null &&
    "orderId" in item.notification.data
      ? String((item.notification.data as { orderId?: string }).orderId || "")
      : "";
  const fallbackOrderId = item.notification?.referenceId || orderIdFromData || null;

  if (actionUrl.startsWith("/admin") || actionUrl.startsWith("/staff") || actionUrl.startsWith("/store") || actionUrl.startsWith("/warehouse")) {
    return actionUrl;
  }

  if (actionUrl.startsWith("/user/profile/orders")) {
    return buildOrdersPathWithFocus(role, fallbackOrderId);
  }

  if (actionUrl.startsWith("/orders")) {
    return buildOrdersPathWithFocus(role, orderIdFromActionUrl || fallbackOrderId);
  }

  if (actionUrl.includes("/chat")) {
    return getDashboardChatPath(role);
  }

  if (type.includes("ORDER") || type.includes("PAYMENT")) {
    return buildOrdersPathWithFocus(role, fallbackOrderId);
  }

  if (type.includes("CHAT") || type === "INFO") {
    return getDashboardChatPath(role);
  }

  return getDashboardNotificationsPath(role);
};

