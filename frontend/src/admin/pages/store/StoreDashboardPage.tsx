import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchStoreSummary, type StoreSummary } from "../../services/storeOrders.api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Chờ xử lý", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  CONFIRMED: { label: "Đã xác nhận", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
  READY: { label: "Chờ lấy hàng", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  DELIVERING: { label: "Đang giao", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  COMPLETED: { label: "Hoàn tất", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

type CardColor = "indigo" | "amber" | "emerald" | "blue";

interface StatCard {
  label: string;
  value: number;
  color: CardColor;
  icon: React.ReactNode;
  tip: string;
  link: string;
  linkLabel: string;
}

const COLOR_MAP: Record<CardColor, { bg: string; border: string; text: string; glow: string }> = {
  indigo: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.22)", text: "#818cf8", glow: "rgba(99,102,241,0.3)" },
  amber:  { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)", text: "#fbbf24", glow: "rgba(245,158,11,0.3)" },
  emerald:{ bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.22)", text: "#34d399", glow: "rgba(16,185,129,0.3)" },
  blue:   { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.22)",  text: "#60a5fa", glow: "rgba(59,130,246,0.3)" },
};

export function StoreDashboardPage() {
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchStoreSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards: StatCard[] = [
    {
      label: "Cần xử lý",
      value: summary?.needActionCount ?? 0,
      color: "amber",
      tip: "Đơn đã xác nhận, chờ chuẩn bị hàng",
      link: "/store/orders?statusGroup=confirmed",
      linkLabel: "Xem ngay →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: "Đang giao",
      value: summary?.readyCount ?? 0,
      color: "blue",
      tip: "Đơn đã sẵn sàng hoặc đang trên đường giao",
      link: "/store/orders?statusGroup=shipping",
      linkLabel: "Theo dõi →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
    {
      label: "Hoàn tất hôm nay",
      value: summary?.completedToday ?? 0,
      color: "emerald",
      tip: "Đơn giao thành công trong ngày hôm nay",
      link: "/store/orders?statusGroup=completed",
      linkLabel: "Xem tất cả →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: "Tổng đơn hôm nay",
      value: summary?.todayTotal ?? 0,
      color: "indigo",
      tip: "Tất cả đơn hàng được tạo trong hôm nay",
      link: "/store/orders",
      linkLabel: "Xem danh sách →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tổng quan Cửa hàng</h2>
          <p className="admin-page-subtitle">Theo dõi đơn hàng và hoạt động cửa hàng hôm nay</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={load}
            style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "var(--adm-text-dim)", fontSize: "13px", cursor: "pointer" }}
          >
            ↻ Làm mới
          </button>
          <Link to="/store/create-order">
            <button style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 600, fontSize: "13.5px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
              + Tạo đơn tại quầy
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "20px", marginBottom: "24px" }}>
        {statCards.map((card) => {
          const c = COLOR_MAP[card.color];
          return (
            <div key={card.label} style={{ padding: "22px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "12px", background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--adm-text-dim)", margin: 0, fontWeight: 500 }}>{card.label}</p>
                    <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--adm-mono)", lineHeight: 1.2 }}>
                      {loading ? "—" : card.value.toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: "10px", color: "var(--adm-text-dim)", cursor: "help" }} title={card.tip}>ⓘ</span>
              </div>
              <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "12px" }}>
                <Link to={card.link} style={{ fontSize: "12px", color: c.text, textDecoration: "none", fontWeight: 500 }}>{card.linkLabel}</Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Urgent Orders */}
      <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>⚡ Đơn cần xử lý ngay</h3>
            <p style={{ fontSize: "12px", color: "var(--adm-text-dim)", margin: "4px 0 0 0" }}>Đơn đã xác nhận, chưa chuẩn bị hàng</p>
          </div>
          <Link to="/store/orders" style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none" }}>Xem tất cả đơn →</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--adm-text-dim)", fontSize: "14px" }}>Đang tải...</div>
        ) : !summary?.urgentOrders?.length ? (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
            <p style={{ color: "#10b981", fontSize: "15px", fontWeight: 600, margin: 0 }}>Không có đơn nào cần xử lý!</p>
            <p style={{ color: "var(--adm-text-dim)", fontSize: "13px", marginTop: "4px" }}>Tất cả đơn hàng đều đã được xử lý.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {summary.urgentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={order.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "rgba(255,255,255,0.025)", borderRadius: "10px", border: "1px solid var(--adm-border)", transition: "background 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Pulse indicator */}
                    <div style={{ position: "relative", width: 10, height: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 0 0 ${cfg.glow || cfg.color}`, animation: "pulse 1.5s infinite" }} />
                    </div>
                    <div>
                      <span style={{ fontFamily: "var(--adm-mono)", fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>{order.orderCode}</span>
                      <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "var(--adm-text-dim)" }}>{order.customerName} · {formatTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: order.orderType === "AT_STORE" ? "rgba(249,115,22,0.08)" : "rgba(99,102,241,0.08)", color: order.orderType === "AT_STORE" ? "#fb923c" : "#818cf8", border: `1px solid ${order.orderType === "AT_STORE" ? "rgba(249,115,22,0.2)" : "rgba(99,102,241,0.2)"}`, fontWeight: 600 }}>
                      {order.orderType === "AT_STORE" ? "Tại quầy" : "Online"}
                    </span>
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                    <Link to={`/store/orders`} style={{ padding: "6px 12px", borderRadius: "6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: "12px", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}>
                      Xử lý
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>
    </div>
  );
}
