import { useAdminAuth } from "../context/AdminAuthContext";
import { StatGrid } from "../components/StatCard";
import { OrdersTable } from "../components/OrdersTable";
import { ActivityFeed } from "../components/ActivityFeed";
import { LowStockList } from "../components/LowStockList";
import { ADMIN_STATS, STAFF_STATS, RECENT_ORDERS, ACTIVITY_FEED, REVENUE_DATA, ORDER_STATUS_DATA, WEEKLY_TASKS, LOW_STOCK_PRODUCTS } from "../data/mockData";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Tooltip formatter ─────────────────────────────────────────────────────────
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

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tổng quan</h2>
          <p className="admin-page-subtitle">Theo dõi tình hình vận hành UTESHOP hôm nay</p>
        </div>
        <div className="admin-topbar-right">
          <div className="admin-date-picker" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(13, 21, 38, 0.4)", borderRadius: "8px", padding: "8px 16px", color: "#e2e8f0" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span style={{ fontSize: "13.5px", fontWeight: 500 }}>19/05/2024 - 25/05/2024</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <button className="admin-btn admin-btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatGrid cards={ADMIN_STATS} />

      {/* Charts row */}
      <div className="admin-grid-2col">
        {/* Revenue chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Doanh thu & Đơn hàng</h3>
              <p className="admin-card-subtitle">Tổng quan 12 tháng qua</p>
            </div>
            <select className="admin-card-select">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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

        {/* Category pie */}
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
                data={ORDER_STATUS_DATA}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {ORDER_STATUS_DATA.map((entry: any, idx: number) => (
                  <Cell key={idx} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`${v}%`, "Tỷ lệ"] as any} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders + Activity */}
      <div className="admin-grid-3col">
        {/* Recent orders (spans 2 cols) */}
        <div className="admin-card admin-col-2">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Đơn hàng gần đây</h3>
              <p className="admin-card-subtitle">5 đơn hàng mới nhất</p>
            </div>
            <a href="/admin/orders" className="admin-card-link" style={{ color: "#6366f1", fontSize: "13.5px", textDecoration: "none" }}>Xem tất cả →</a>
          </div>
          <OrdersTable orders={RECENT_ORDERS.slice(0, 5)} compact />
        </div>

        {/* Low Stock and Activity feed (spans 1 col) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Low Stock */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="admin-card-title">Tồn kho thấp</h3>
                <p className="admin-card-subtitle">Sản phẩm cần nhập thêm</p>
              </div>
            </div>
            <LowStockList items={LOW_STOCK_PRODUCTS} />
          </div>

          {/* Activity feed */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="admin-card-title">Hoạt động gần đây</h3>
                <p className="admin-card-subtitle">Nhật ký hệ thống</p>
              </div>
            </div>
            <ActivityFeed items={ACTIVITY_FEED} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff Dashboard ───────────────────────────────────────────────────────────
function StaffDashboard() {
  return (
    <div className="admin-dashboard">
      {/* Stats */}
      <StatGrid cards={STAFF_STATS} />

      {/* Tasks + Orders */}
      <div className="admin-grid-2col">
        {/* Weekly task bar chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Nhiệm vụ tuần này</h3>
              <p className="admin-card-subtitle">Hoàn thành vs còn lại</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY_TASKS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hoàn thành" />
              <Bar dataKey="pending"   fill="#f59e0b" radius={[4, 4, 0, 0]} name="Còn lại" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Đơn cần xử lý</h3>
              <p className="admin-card-subtitle">Được phân công cho bạn</p>
            </div>
          </div>
          <OrdersTable
            orders={RECENT_ORDERS.filter(
              (o) => o.status === "pending" || o.status === "processing"
            )}
            compact
          />
        </div>
      </div>

      {/* Activity */}
      <div className="admin-card" style={{ maxWidth: "640px" }}>
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Hoạt động của tôi</h3>
            <p className="admin-card-subtitle">Lịch sử thao tác gần đây</p>
          </div>
        </div>
        <ActivityFeed items={ACTIVITY_FEED.filter((_, i) => i < 4)} />
      </div>
    </div>
  );
}

// ── Entry Component ───────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { isAdmin } = useAdminAuth();
  return isAdmin ? <AdminDashboard /> : <StaffDashboard />;
}
