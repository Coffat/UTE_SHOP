import { api } from "../../lib/api";
import type { ActivityItem, OrderItem, StatCard } from "../types/admin.types";

export type DashboardPeriod = "7d" | "30d";

export interface DashboardLowStock {
  id: string;
  name: string;
  stock: number;
}

export interface DashboardData {
  period: DashboardPeriod;
  periodLabel: string;
  stats: StatCard[];
  revenueChart: { month: string; revenue: number; orders: number }[];
  orderStatusBreakdown: { name: string; value: number; fill: string; percentage: string }[];
  recentOrders: OrderItem[];
  lowStock: DashboardLowStock[];
  activityFeed: ActivityItem[];
  staffStats: StatCard[];
  pendingOrdersCount: number;
}

interface BackendRecentOrder {
  id: string;
  orderCode: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderItem["status"];
  date: string;
}

interface BackendDashboardPayload {
  period: DashboardPeriod;
  periodLabel: string;
  stats: StatCard[];
  revenueChart: DashboardData["revenueChart"];
  orderStatusBreakdown: DashboardData["orderStatusBreakdown"];
  recentOrders: BackendRecentOrder[];
  lowStock: DashboardLowStock[];
  activityFeed: ActivityItem[];
  staffStats: StatCard[];
  pendingOrdersCount: number;
}

export async function fetchAdminDashboard(
  period: DashboardPeriod = "30d"
): Promise<DashboardData> {
  const response = await api.get("/api/v1/admin/dashboard", { params: { period } });
  const raw = response.data.data as BackendDashboardPayload;

  return {
    ...raw,
    recentOrders: raw.recentOrders.map((order) => ({
      id: order.orderCode || order.id,
      customer: order.customer,
      product: order.product,
      amount: order.amount,
      status: order.status,
      date: order.date,
    })),
  };
}
