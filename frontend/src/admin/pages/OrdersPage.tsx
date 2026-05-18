import { useState } from "react";

interface CustomOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  payment: "paid" | "cod";
  amount: number;
  status: "pending" | "shipping" | "completed" | "cancelled";
}

const ORDER_DATASETS: CustomOrder[] = [
  { id: "#ORD-1082", customerName: "Nguyễn Minh Anh", customerPhone: "0901 234 567", date: "25/05/2024 09:43", payment: "paid", amount: 1250000, status: "pending" },
  { id: "#ORD-1081", customerName: "Trần Quốc Bảo",    customerPhone: "0902 345 678", date: "25/05/2024 08:15", payment: "cod",  amount: 850000,  status: "shipping" },
  { id: "#ORD-1080", customerName: "Lê Thị Thanh Mai", customerPhone: "0903 456 789", date: "24/05/2024 22:10", payment: "paid", amount: 2190000, status: "completed" },
  { id: "#ORD-1079", customerName: "Phạm Hoàng Nam",   customerPhone: "0904 567 890", date: "24/05/2024 19:32", payment: "cod",  amount: 640000,  status: "cancelled" },
  { id: "#ORD-1078", customerName: "Đỗ Quỳnh Trang",   customerPhone: "0905 678 901", date: "24/05/2024 17:05", payment: "paid", amount: 1450000, status: "completed" },
  { id: "#ORD-1077", customerName: "Võ Thành Đạt",     customerPhone: "0906 789 012", date: "24/05/2024 15:21", payment: "cod",  amount: 980000,  status: "shipping" },
  { id: "#ORD-1076", customerName: "Nguyễn Thu Hà",    customerPhone: "0907 890 123", date: "24/05/2024 13:08", payment: "paid", amount: 320000,  status: "pending" },
];

function getStatusStyle(status: CustomOrder["status"]) {
  switch (status) {
    case "pending":
      return { background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)" };
    case "shipping":
      return { background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)" };
    case "completed":
      return { background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" };
    case "cancelled":
      return { background: "rgba(244, 63, 94, 0.12)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.25)" };
  }
}

function getStatusLabel(status: CustomOrder["status"]) {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "shipping":
      return "Đang giao";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
  }
}

// Inline SVGs for sidebar status items
function IconPending() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconShipping() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconCompleted() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconCancelled() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function OrdersPage() {
  const [search, setSearch] = useState("");

  const filteredOrders = ORDER_DATASETS.filter((order) => {
    return (
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search)
    );
  });

  return (
    <div className="admin-page">
      {/* Header Block */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Đơn hàng</h2>
          <p className="admin-page-subtitle">Quản lý và theo dõi tất cả đơn hàng trong hệ thống</p>
        </div>
        <button className="admin-btn" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#6366f1",
          border: "none",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "8px",
          fontWeight: 500,
          cursor: "pointer"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo đơn hàng
        </button>
      </div>

      {/* Filters Row */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* Date Filter */}
        <div className="admin-filter-select-wrapper">
          <span style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span style={{ fontSize: "13.5px", color: "#e2e8f0", fontWeight: 500 }}>19/05/2024 - 25/05/2024</span>
          <span style={{ marginLeft: "auto", color: "#64748b", display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Status Filter */}
        <div className="admin-filter-select-wrapper">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Trạng thái</span>
            <span style={{ fontSize: "13.5px", color: "#e2e8f0", marginTop: "2px", fontWeight: 500 }}>Tất cả</span>
          </div>
          <span style={{ marginLeft: "auto", color: "#64748b", display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Payment Filter */}
        <div className="admin-filter-select-wrapper">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Thanh toán</span>
            <span style={{ fontSize: "13.5px", color: "#e2e8f0", marginTop: "2px", fontWeight: 500 }}>Tất cả</span>
          </div>
          <span style={{ marginLeft: "auto", color: "#64748b", display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Search Filter */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: "14px", color: "#64748b", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, SĐT..."
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius)",
              padding: "12px 16px 12px 40px",
              fontSize: "13px",
              color: "#fff",
              outline: "none",
              transition: "all 0.2s"
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* Card 1: Tổng đơn */}
        <div className="admin-stat-card" style={{ gap: "16px" }}>
          {/* Top row: Icon + Text block and Sparkline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            
            {/* Left group: Icon + Info/Value */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Icon Container */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.22)",
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>

              {/* Text: Label + Value */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>Tổng đơn</span>
                  <span style={{ color: "#64748b", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }} title="Tổng số lượng đơn hàng">ⓘ</span>
                </div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0, fontFamily: "var(--adm-mono)" }}>1,248</p>
              </div>
            </div>

            {/* Sparkline chart */}
            <div style={{ flexShrink: 0 }}>
              <svg width="78" height="32" viewBox="0 0 78 32" fill="none">
                <path d="M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4V32H2Z" fill="url(#sparkline-grad-1)" opacity="0.08" />
                <defs>
                  <linearGradient id="sparkline-grad-1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
          </div>

          {/* Bottom row: Trend metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", marginTop: "auto" }}>
            <span style={{ color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              12.6%
            </span>
            <span style={{ color: "#64748b" }}>so với 12/05 - 18/05</span>
          </div>

        </div>

        {/* Card 2: Chờ xử lý */}
        <div className="admin-stat-card" style={{ gap: "16px" }}>
          {/* Top row: Icon + Text block and Sparkline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            
            {/* Left group: Icon + Info/Value */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Icon Container */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.22)",
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              {/* Text: Label + Value */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>Chờ xử lý</span>
                  <span style={{ color: "#64748b", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }} title="Đơn hàng đang chờ duyệt">ⓘ</span>
                </div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0, fontFamily: "var(--adm-mono)" }}>312</p>
              </div>
            </div>

            {/* Sparkline chart */}
            <div style={{ flexShrink: 0 }}>
              <svg width="78" height="32" viewBox="0 0 78 32" fill="none">
                <path d="M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16V32H2Z" fill="url(#sparkline-grad-2)" opacity="0.08" />
                <defs>
                  <linearGradient id="sparkline-grad-2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
          </div>

          {/* Bottom row: Trend metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", marginTop: "auto" }}>
            <span style={{ color: "#f59e0b", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              8.3%
            </span>
            <span style={{ color: "#64748b" }}>so với 12/05 - 18/05</span>
          </div>

        </div>

        {/* Card 3: Đang giao */}
        <div className="admin-stat-card" style={{ gap: "16px" }}>
          {/* Top row: Icon + Text block and Sparkline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            
            {/* Left group: Icon + Info/Value */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Icon Container */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(6, 182, 212, 0.12)",
                border: "1px solid rgba(6, 182, 212, 0.22)",
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>

              {/* Text: Label + Value */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>Đang giao</span>
                  <span style={{ color: "#64748b", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }} title="Đơn hàng đang vận chuyển">ⓘ</span>
                </div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0, fontFamily: "var(--adm-mono)" }}>518</p>
              </div>
            </div>

            {/* Sparkline chart */}
            <div style={{ flexShrink: 0 }}>
              <svg width="78" height="32" viewBox="0 0 78 32" fill="none">
                <path d="M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8V32H2Z" fill="url(#sparkline-grad-3)" opacity="0.08" />
                <defs>
                  <linearGradient id="sparkline-grad-3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
          </div>

          {/* Bottom row: Trend metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", marginTop: "auto" }}>
            <span style={{ color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              15.7%
            </span>
            <span style={{ color: "#64748b" }}>so với 12/05 - 18/05</span>
          </div>

        </div>

        {/* Card 4: Hoàn tất */}
        <div className="admin-stat-card" style={{ gap: "16px" }}>
          {/* Top row: Icon + Text block and Sparkline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            
            {/* Left group: Icon + Info/Value */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Icon Container */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.22)",
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 11 11 13 15 9" />
                </svg>
              </div>

              {/* Text: Label + Value */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>Hoàn tất</span>
                  <span style={{ color: "#64748b", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }} title="Đơn hàng giao thành công">ⓘ</span>
                </div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0, fontFamily: "var(--adm-mono)" }}>892</p>
              </div>
            </div>

            {/* Sparkline chart */}
            <div style={{ flexShrink: 0 }}>
              <svg width="78" height="32" viewBox="0 0 78 32" fill="none">
                <path d="M2 22L12 26L22 14L32 18L44 8L56 24L68 12L76 16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 22L12 26L22 14L32 18L44 8L56 24L68 12L76 16V32H2Z" fill="url(#sparkline-grad-4)" opacity="0.08" />
                <defs>
                  <linearGradient id="sparkline-grad-4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
          </div>

          {/* Bottom row: Trend metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", marginTop: "auto" }}>
            <span style={{ color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              9.8%
            </span>
            <span style={{ color: "#64748b" }}>so với 12/05 - 18/05</span>
          </div>

        </div>
      </div>

      {/* Main Grid: List + Widgets */}
      <div className="admin-grid-2col" style={{ gridTemplateColumns: "3fr 1.3fr" }}>
        {/* Left Column: Orders List Card */}
        <div className="admin-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          {/* List Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--adm-border)"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: 0 }}>Danh sách đơn hàng</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--adm-border)",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s"
              }} className="admin-action-glass-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Lọc
              </button>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--adm-border)",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s"
              }} className="admin-action-glass-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Xuất Excel
              </button>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "10px", color: "#64748b", display: "flex", alignItems: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng..."
                  style={{
                    background: "rgba(13, 21, 38, 0.3)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "6px",
                    padding: "6px 10px 6px 30px",
                    fontSize: "13px",
                    color: "#fff",
                    width: "180px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>Mã đơn</th>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>Khách hàng</th>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Ngày tạo <span style={{ color: "#64748b", fontSize: "11px" }}>↕</span>
                    </div>
                  </th>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>Thanh toán</th>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>Tổng tiền</th>
                  <th style={{ textAlign: "left", padding: "14px 20px" }}>Trạng thái</th>
                  <th style={{ textAlign: "center", padding: "14px 20px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="admin-table-row">
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "var(--adm-mono)", color: "#fff", fontWeight: 600 }}>{order.id}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#fff", fontWeight: 500, fontSize: "14px" }}>{order.customerName}</span>
                        <span style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{order.customerPhone}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#e2e8f0", fontSize: "13px" }}>{order.date}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: order.payment === "paid" ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                        color: order.payment === "paid" ? "#10b981" : "#94a3b8"
                      }}>
                        {order.payment === "paid" ? "Đã thanh toán" : "COD"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: "13.5px" }}>{order.amount.toLocaleString("vi-VN")} đ</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        ...getStatusStyle(order.status)
                      }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#94a3b8",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title="Xem chi tiết" className="admin-action-glass-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#94a3b8",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title="Thao tác khác" className="admin-action-glass-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <circle cx="12" cy="5" r="1.2" />
                            <circle cx="12" cy="12" r="1.2" />
                            <circle cx="12" cy="19" r="1.2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* List Footer */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderTop: "1px solid var(--adm-border)",
            marginTop: "auto"
          }}>
            <span style={{ color: "#64748b", fontSize: "13px" }}>Hiển thị 1 đến 7 trong tổng số 1,248 đơn</span>
            <div className="admin-pagination-btns" style={{ display: "flex", gap: "6px" }}>
              <button className="admin-pagination-btn" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#64748b", cursor: "not-allowed" }} disabled>
                &lt;
              </button>
              <button className="admin-pagination-btn active" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                1
              </button>
              <button className="admin-pagination-btn" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#94a3b8", cursor: "pointer" }}>
                2
              </button>
              <button className="admin-pagination-btn" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#94a3b8", cursor: "pointer" }}>
                3
              </button>
              <span style={{ color: "#64748b", alignSelf: "center", padding: "0 4px" }}>...</span>
              <button className="admin-pagination-btn" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#94a3b8", cursor: "pointer" }}>
                178
              </button>
              <button className="admin-pagination-btn" style={{ minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#94a3b8", cursor: "pointer" }}>
                &gt;
              </button>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(13, 21, 38, 0.3)",
              border: "1px solid var(--adm-border)",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer"
            }}>
              <span style={{ fontSize: "13px", color: "#e2e8f0" }}>10 / trang</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Widget 1: Tiến độ đơn hàng hôm nay */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Tiến độ đơn hàng hôm nay</h4>
              <span style={{ color: "#64748b", fontSize: "12px", cursor: "pointer" }} title="Tình hình xử lý đơn hàng hôm nay">ⓘ</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Item 1 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#f59e0b", display: "flex", alignItems: "center" }}><IconPending /></span>
                    <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500 }}>Chờ xử lý</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                    312 <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 400 }}>(25.0%)</span>
                  </span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "25%", background: "#f59e0b", borderRadius: "3px" }} />
                </div>
              </div>

              {/* Item 2 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#3b82f6", display: "flex", alignItems: "center" }}><IconShipping /></span>
                    <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500 }}>Đang giao</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                    518 <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 400 }}>(41.5%)</span>
                  </span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "41.5%", background: "#3b82f6", borderRadius: "3px" }} />
                </div>
              </div>

              {/* Item 3 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#10b981", display: "flex", alignItems: "center" }}><IconCompleted /></span>
                    <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500 }}>Hoàn tất</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                    356 <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 400 }}>(28.5%)</span>
                  </span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "28.5%", background: "#10b981", borderRadius: "3px" }} />
                </div>
              </div>

              {/* Item 4 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#f43f5e", display: "flex", alignItems: "center" }}><IconCancelled /></span>
                    <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500 }}>Đã hủy</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                    62 <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 400 }}>(5.0%)</span>
                  </span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "5%", background: "#f43f5e", borderRadius: "3px" }} />
                </div>
              </div>

              {/* Summary */}
              <div style={{
                borderTop: "1px solid var(--adm-border)",
                paddingTop: "14px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Tổng cộng</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>1,248 đơn</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Đơn cần chú ý */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Đơn cần chú ý</h4>
              <a href="/admin/orders?attention=true" style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none", fontWeight: 500 }}>Xem tất cả</a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Attention Item 1 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "12px 14px",
                gap: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>#ORD-1079</span>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>Phạm Hoàng Nam</span>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#f43f5e" }}>Đã hủy</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>24/05/2024 19:32</span>
                </div>
              </div>

              {/* Attention Item 2 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "12px 14px",
                gap: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>#ORD-1065</span>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>Lê Văn Hùng</span>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#f59e0b" }}>Quá hạn giao</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>22/05/2024 11:20</span>
                </div>
              </div>

              {/* Attention Item 3 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "12px 14px",
                gap: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>#ORD-1057</span>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>Trần Thị Kim Oanh</span>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#f59e0b" }}>Quá hạn giao</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>21/05/2024 09:15</span>
                </div>
              </div>

              {/* Alert Footer */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#f43f5e",
                fontSize: "12.5px",
                marginTop: "6px",
                fontWeight: 500
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Tổng cộng 8 đơn cần chú ý</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
