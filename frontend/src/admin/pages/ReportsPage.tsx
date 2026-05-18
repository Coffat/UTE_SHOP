import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { REVENUE_DATA, ORDER_STATUS_DATA } from "../data/mockData";

const chartTooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

const TOP_PRODUCTS = [
  { name: "Bó hoa hồng đỏ Premium", sales: 312, revenue: 390000000 },
  { name: "Hoa tulip Hà Lan",       sales: 256, revenue: 115200000 },
  { name: "Giỏ hoa sinh nhật",      sales: 203, revenue: 180670000 },
  { name: "Bình hoa cúc vàng",      sales: 203, revenue: 64960000  },
  { name: "Hoa hướng dương bó",     sales: 175, revenue: 66500000  },
];

function formatVND(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}Tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M ₫`;
  return v.toLocaleString("vi-VN") + " ₫";
}

export function ReportsPage() {
  return (
    <div className="admin-page">
      {/* KPI row */}
      <div className="admin-reports-kpi-row">
        {[
          { label: "Tổng doanh thu năm", val: "724.5M ₫", sub: "+18.4% so năm ngoái", color: "#6366f1" },
          { label: "Tổng đơn hàng năm",  val: "13,820",   sub: "+12.2% so năm ngoái", color: "#10b981" },
          { label: "Khách hàng mới",      val: "2,847",    sub: "+9.7% so năm ngoái",  color: "#f59e0b" },
          { label: "Giá trị đơn TB",      val: "52,400 ₫", sub: "+5.1% so năm ngoái",  color: "#f43f5e" },
        ].map((k, i) => (
          <div key={i} className="admin-reports-kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <p className="admin-reports-kpi-lbl">{k.label}</p>
            <p className="admin-reports-kpi-val" style={{ color: k.color }}>{k.val}</p>
            <p className="admin-reports-kpi-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue area chart */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Biểu đồ doanh thu theo tháng</h3>
            <p className="admin-card-subtitle">Năm 2026</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="admin-btn admin-btn-outline" style={{ fontSize: "12px", padding: "6px 12px" }}>Xuất PDF</button>
            <button className="admin-btn admin-btn-outline" style={{ fontSize: "12px", padding: "6px 12px" }}>Xuất Excel</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1_000_000}M`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [formatVND(v), "Doanh thu"] as any} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rG)" dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-grid-2col">
        {/* Top products bar chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Top sản phẩm bán chạy</h3>
              <p className="admin-card-subtitle">Theo số lượng đã bán</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="sales" fill="#6366f1" radius={[0, 4, 4, 0]} name="Đã bán" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Phân bố doanh thu</h3>
              <p className="admin-card-subtitle">Theo danh mục sản phẩm</p>
            </div>
          </div>
          <div className="admin-category-list">
            {ORDER_STATUS_DATA.map((c: any) => (
              <div key={c.name} className="admin-category-row">
                <span className="admin-category-name">{c.name}</span>
                <div className="admin-category-bar-wrap">
                  <div
                    className="admin-category-bar-fill"
                    style={{ width: `${c.value}%`, background: c.fill }}
                  />
                </div>
                <span className="admin-category-pct" style={{ color: c.fill }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
