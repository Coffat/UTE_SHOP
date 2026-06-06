import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { StatGrid } from "../components/StatCard";
import { OrdersTable } from "../components/OrdersTable";
import { ActivityFeed } from "../components/ActivityFeed";
import { LowStockList } from "../components/LowStockList";
import type { StatCard, OrderItem, ActivityItem } from "../types/admin.types";
import {
  fetchAdminDashboard,
  type DashboardData,
  type DashboardPeriod,
} from "../services/adminDashboard.api";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

function formatVND(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  return value.toLocaleString("vi-VN") + " ₫";
}

const chartTooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

function AdminDashboard({ data, period, setPeriod }: { data: DashboardData, period: DashboardPeriod, setPeriod: (p: DashboardPeriod) => void }) {
  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tổng quan</h2>
          <p className="admin-page-subtitle">Theo dõi tình hình vận hành UTESHOP hôm nay</p>
        </div>
        <div className="admin-topbar-right">
          <div className="admin-date-picker" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(13, 21, 38, 0.4)", borderRadius: "8px", padding: "8px 16px", color: "#e2e8f0" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: "13.5px", fontWeight: 500, outline: "none", cursor: "pointer", appearance: "none", paddingRight: "16px" }}
            >
              <option value="7d" style={{ color: "#000" }}>7 ngày qua</option>
              <option value="30d" style={{ color: "#000" }}>30 ngày qua</option>
            </select>
            <svg style={{ position: "absolute", right: "12px", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <button className="admin-btn admin-btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Xuất báo cáo
          </button>
        </div>
      </div>

      <StatGrid cards={data.stats} />

      <div className="admin-grid-2col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Doanh thu & Đơn hàng</h3>
              <p className="admin-card-subtitle">Tổng quan 12 tháng qua</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1_000_000}M`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any, name: any) => [
                name === "revenue" ? formatVND(v) : v.toLocaleString("vi-VN"),
                name === "revenue" ? "Doanh thu" : "Đơn hàng",
              ] as any} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#ordersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Trạng thái đơn hàng</h3>
              <p className="admin-card-subtitle">Phân bổ hiện tại</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.orderStatusBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.orderStatusBreakdown.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`${v}`, "Số đơn"] as any} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-grid-3col">
        <div className="admin-card admin-col-2">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Đơn hàng gần đây</h3>
              <p className="admin-card-subtitle">5 đơn hàng mới nhất</p>
            </div>
            <a href="/admin/orders" className="admin-card-link" style={{ color: "#6366f1", fontSize: "13.5px", textDecoration: "none" }}>Xem tất cả →</a>
          </div>
          <OrdersTable orders={data.recentOrders} compact />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="admin-card-title">Tồn kho thấp</h3>
                <p className="admin-card-subtitle">Sản phẩm cần nhập thêm</p>
              </div>
            </div>
            <LowStockList items={data.lowStock} />
          </div>

          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="admin-card-title">Hoạt động gần đây</h3>
                <p className="admin-card-subtitle">Nhật ký hệ thống</p>
              </div>
            </div>
            <ActivityFeed items={data.activityFeed} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Removed StaffDashboard component

const FALLBACK_ADMIN_STATS: StatCard[] = [
  { id: "revenue", label: "Doanh thu", value: "—", change: 0, changeLabel: "Không tải được dữ liệu", icon: "revenue", color: "indigo" },
  { id: "orders", label: "Đơn hàng", value: "—", change: 0, changeLabel: "Không tải được dữ liệu", icon: "orders", color: "purple" },
  { id: "users", label: "Khách hàng mới", value: 0, change: 0, changeLabel: "Không tải được dữ liệu", icon: "users", color: "emerald" },
  { id: "rate", label: "Tỷ lệ hoàn thành đơn", value: "—", change: 0, changeLabel: "Không tải được dữ liệu", icon: "rate", color: "amber" },
];

const FALLBACK_STAFF_STATS: StatCard[] = [
  { id: "tasks", label: "Nhiệm vụ hôm nay", value: 0, change: 0, changeLabel: "—", icon: "tasks", color: "indigo" },
  { id: "orders", label: "Đơn cần xử lý", value: 0, change: 0, changeLabel: "—", icon: "orders", color: "emerald" },
  { id: "products", label: "Sản phẩm cập nhật", value: 0, change: 0, changeLabel: "—", icon: "products", color: "amber" },
  { id: "completed", label: "Hoàn thành hôm nay", value: "—", change: 0, changeLabel: "—", icon: "completed", color: "rose" },
];

function buildFallbackDashboard(): DashboardData {
  return {
    period: "30d",
    periodLabel: "Không tải được dữ liệu",
    stats: FALLBACK_ADMIN_STATS,
    revenueChart: [],
    orderStatusBreakdown: [],
    recentOrders: [] as OrderItem[],
    lowStock: [],
    activityFeed: [] as ActivityItem[],
    staffStats: FALLBACK_STAFF_STATS,
    pendingOrdersCount: 0,
  };
}

export function AdminDashboardPage() {
  const { isAdmin } = useAdminAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminDashboard(period)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard:", err);
        if (!cancelled) setData(buildFallbackDashboard());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (loading || !data) {
    return (
      <div className="admin-page" style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
        Đang tải dashboard...
      </div>
    );
  }

  return isAdmin ? <AdminDashboard data={data} period={period} setPeriod={setPeriod} /> : <div className="admin-page" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Vui lòng dùng tài khoản Admin để xem Tổng quan.</div>;
}
