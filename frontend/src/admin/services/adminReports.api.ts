import { api } from "../../lib/api";

export type ReportsPeriod = "7d" | "30d" | "month";

export interface ReportsStatCard {
  id: string;
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  color: "indigo" | "purple" | "cyan" | "amber";
  tooltip: string;
}

export interface ReportsOrderSource {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ReportsTopProduct {
  id: string;
  name: string;
  sku: string;
  mainImageUrl?: string;
  sold: number;
  revenue: string;
  growth: string;
  isUp: boolean;
}

export interface ReportsChannelPerformance {
  name: string;
  revenue: string;
  ratio: string;
  progress: number;
  color: string;
  bg: string;
}

export interface ReportsData {
  period: ReportsPeriod;
  periodLabel: string;
  stats: ReportsStatCard[];
  revenueGrowth: { month: string; value: number; label: string }[];
  categoryRevenue: { category: string; value: number; label: string }[];
  orderSources: ReportsOrderSource[];
  totalOrdersInPeriod: number;
  topProducts: ReportsTopProduct[];
  channelPerformance: ReportsChannelPerformance[];
  monthlyGoal: {
    target: string;
    achievedPercent: number;
  };
}

export async function fetchAdminReports(
  period: ReportsPeriod = "30d",
  limit = 5
): Promise<ReportsData> {
  const response = await api.get("/api/v1/admin/reports", {
    params: { period, limit },
  });
  return response.data.data as ReportsData;
}
