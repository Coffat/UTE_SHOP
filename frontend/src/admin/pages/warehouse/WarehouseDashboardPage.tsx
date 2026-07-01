import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatCardWidget } from "../../components/StatCard";
import { fetchWarehouseSummary, type WarehouseSummary } from "../../services/warehouse.api";

function formatQty(n: any): string {
  if (n === null || n === undefined) return "0";
  // Handle MongoDB Decimal128 format from JSON
  if (typeof n === "object" && n.$numberDecimal !== undefined) {
    const num = Math.abs(Number(n.$numberDecimal));
    return Number.isNaN(num) ? "0" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
  }
  const num = typeof n === "object" ? Math.abs(Number(n.toString())) : Math.abs(Number(n));
  return Number.isNaN(num) ? "0" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function WarehouseDashboardPage() {
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouseSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      id: "wh-total-sku",
      label: "Tổng mặt hàng",
      value: summary?.totalSkus ?? "—",
      change: 0,
      changeLabel: "",
      icon: "products",
      color: "indigo" as const,
      tooltip: "Tổng số SKU đang quản lý trong kho",
      sparklinePoints: "M2 20L12 14L22 18L32 8L44 14L56 4L68 12L76 8",
    },
    {
      id: "wh-low-stock",
      label: "Sắp hết hàng",
      value: summary?.lowStockCount ?? "—",
      change: 0,
      changeLabel: "",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Mặt hàng dưới ngưỡng tồn kho tối thiểu",
      sparklinePoints: "M2 12L12 20L22 10L32 18L44 6L56 16L68 8L76 14",
    },
    {
      id: "wh-out-of-stock",
      label: "Hết hàng",
      value: summary?.outOfStockCount ?? "—",
      change: 0,
      changeLabel: "",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      color: "emerald" as const,
      tooltip: "Mặt hàng đã hết, cần nhập ngay",
      sparklinePoints: "M2 18L12 10L22 16L32 6L44 20L56 8L68 14L76 4",
    },
    {
      id: "wh-today-import",
      label: "Nhập hôm nay",
      value: summary ? formatQty(summary.todayImports) : "—",
      change: 0,
      changeLabel: "",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Tổng số lượng đã nhập trong ngày hôm nay",
      sparklinePoints: "M2 22L12 16L22 20L32 10L44 18L56 6L68 16L76 10",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tổng quan Kho</h2>
          <p className="admin-page-subtitle">Theo dõi tồn kho và hoạt động nhập hàng</p>
        </div>
        <Link to="/warehouse/import">
          <button className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 600, fontSize: "13.5px", color: "#fff", cursor: "pointer" }}>
            + Nhập kho
          </button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "20px", marginBottom: "24px" }}>
        {statCards.map((card) => <StatCardWidget key={card.id} card={card} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0, paddingBottom: "40px" }}>
        {/* Bảng cảnh báo tồn kho thấp */}
        <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>⚠️ Cảnh báo tồn kho</h3>
            <Link to="/warehouse/stock" style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none" }}>Xem tất cả →</Link>
          </div>

          {loading ? (
            <div style={{ color: "var(--adm-text-dim)", fontSize: "14px", padding: "24px 0", textAlign: "center" }}>Đang tải...</div>
          ) : !summary?.lowStockItems?.length ? (
            <div style={{ color: "#10b981", fontSize: "14px", padding: "24px 0", textAlign: "center" }}>
              ✅ Tất cả mặt hàng đang ở mức an toàn
            </div>
          ) : (
            <div className="admin-table-wrap" style={{ borderRadius: "8px", border: "1px solid var(--adm-border)", flex: 1, overflowY: "auto" }}>
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tên hàng</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tồn kho</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Ngưỡng tối thiểu</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lowStockItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--adm-border)" }}>
                      <td style={{ padding: "10px 14px", color: "#fff", fontSize: "13.5px" }}>{item.name}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: "13px", color: item.quantity <= 0 ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>
                        {formatQty(item.quantity)} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: "13px", color: "var(--adm-text-dim)" }}>
                        {formatQty(item.minThreshold)} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px",
                          background: item.status === "OUT_OF_STOCK" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                          color: item.status === "OUT_OF_STOCK" ? "#ef4444" : "#f59e0b",
                          border: `1px solid ${item.status === "OUT_OF_STOCK" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                        }}>
                          {item.status === "OUT_OF_STOCK" ? "Hết hàng" : "Sắp hết"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Giao dịch gần nhất */}
        <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Giao dịch gần nhất</h3>
            <Link to="/warehouse/transactions" style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none" }}>Xem tất cả →</Link>
          </div>
          {loading ? (
            <div style={{ color: "var(--adm-text-dim)", fontSize: "14px", padding: "24px 0", textAlign: "center" }}>Đang tải...</div>
          ) : !summary?.recentTransactions?.length ? (
            <div style={{ color: "var(--adm-text-dim)", fontSize: "14px", padding: "24px 0", textAlign: "center" }}>Chưa có giao dịch nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
              {(summary.recentTransactions as any[]).map((t: any) => {
                const sl = t.stockLevel || {} as any;
                const pName = sl?.productVariant?.product?.name;
                const variantDetails = sl?.productVariant?.sizeName ? ` (${sl.productVariant.sizeName})` : (sl?.productVariant?.sku ? ` (${sl.productVariant.sku})` : '');
                const itemName = sl?.material?.name || (pName ? `${pName}${variantDetails}` : sl?.productVariant?.sku || "—");
                const unit = sl?.material?.unit || "cái";
                return (
                  <div key={t._id} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13.5px", color: "#fff", fontWeight: 500 }}>{itemName}</span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
                        background: t.type === "IMPORT" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: t.type === "IMPORT" ? "#10b981" : "#ef4444",
                        border: `1px solid ${t.type === "IMPORT" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        {t.type === "IMPORT" ? "Nhập" : "Xuất"} {formatQty(t.quantity)} {unit}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-dim)" }}>{(t.performedBy as any)?.fullName || "—"}</span>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-dim)" }}>{formatTime(t.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
