import { useEffect, useState } from "react";
import { fetchStockLevels, type StockLevelItem } from "../../services/warehouse.api";

type TabType = "all" | "material" | "variant";
type StatusFilter = "all" | "ok" | "low" | "out";

function getStockStatus(qty: number, min: number) {
  if (qty <= 0) return "out";
  if (min > 0 && qty <= min) return "low";
  return "ok";
}

function formatQty(n: any): string {
  const num = typeof n === "object" && n !== null ? Number(n.toString()) : Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

const STATUS_LABEL: Record<string, string> = { ok: "Còn hàng", low: "Sắp hết", out: "Hết hàng" };
const STATUS_COLOR: Record<string, string> = { ok: "#10b981", low: "#f59e0b", out: "#ef4444" };
const STATUS_BG: Record<string, string> = { ok: "rgba(16,185,129,0.08)", low: "rgba(245,158,11,0.08)", out: "rgba(239,68,68,0.08)" };
const STATUS_BORDER: Record<string, string> = { ok: "rgba(16,185,129,0.2)", low: "rgba(245,158,11,0.2)", out: "rgba(239,68,68,0.2)" };

export function WarehouseStockPage() {
  const [items, setItems] = useState<StockLevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const loadData = (type: TabType) => {
    setLoading(true);
    const param = type === "all" ? undefined : (type as "material" | "variant");
    fetchStockLevels(param)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(tab); }, [tab]);

  const filtered = items.filter((item) => {
    const qty = Number(formatQty(item.quantity));
    const min = Number(formatQty(item.minThreshold));
    const status = getStockStatus(qty, min);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = item.material?.name || item.productVariant?.sizeName || item.productVariant?.sku || "";
      if (!name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusCounts = { ok: 0, low: 0, out: 0 };
  items.forEach((item) => {
    const qty = Number(formatQty(item.quantity));
    const min = Number(formatQty(item.minThreshold));
    statusCounts[getStockStatus(qty, min) as keyof typeof statusCounts]++;
  });

  const TAB_ITEMS: { key: TabType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "material", label: "Nguyên liệu" },
    { key: "variant", label: "Thành phẩm" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tồn kho</h2>
          <p className="admin-page-subtitle">Theo dõi số lượng tồn kho theo thời gian thực</p>
        </div>
        {/* Summary badges */}
        <div style={{ display: "flex", gap: "10px" }}>
          {(["ok", "low", "out"] as const).map((s) => (
            <div key={s} style={{ padding: "6px 14px", background: STATUS_BG[s], border: `1px solid ${STATUS_BORDER[s]}`, borderRadius: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_COLOR[s] }}>{statusCounts[s]} {STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "4px", width: "fit-content" }}>
          {TAB_ITEMS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStatusFilter("all"); setSearch(""); }}
              style={{
                padding: "7px 18px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                background: tab === t.key ? "rgba(99,102,241,0.2)" : "transparent",
                color: tab === t.key ? "#818cf8" : "var(--adm-text-dim)",
                transition: "all 0.2s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div className="admin-search-box" style={{ flex: 1, minWidth: "220px", background: "rgba(255,255,255,0.03)" }}>
            <span className="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text" placeholder="Tìm kiếm tên hàng..." className="admin-search-input"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "transparent" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="admin-form-select"
            style={{ width: "160px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer" }}
          >
            <option value="all" style={{ background: "#0d1526" }}>Tất cả trạng thái</option>
            <option value="ok" style={{ background: "#0d1526" }}>Còn hàng</option>
            <option value="low" style={{ background: "#0d1526" }}>Sắp hết</option>
            <option value="out" style={{ background: "#0d1526" }}>Hết hàng</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--adm-text-dim)" }}>Đang tải...</div>
        ) : (
          <div className="admin-table-wrap" style={{ borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tên hàng</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Loại</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tồn kho</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Ngưỡng tối thiểu</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "var(--adm-text-dim)", fontSize: "14px" }}>Không tìm thấy dữ liệu</td></tr>
                ) : filtered.map((item) => {
                  const qty = Number(formatQty(item.quantity));
                  const min = Number(formatQty(item.minThreshold));
                  const status = getStockStatus(qty, min);
                  const isMaterial = !!item.material;
                  const name = item.material?.name || item.productVariant?.sizeName || item.productVariant?.sku || "—";
                  const unit = item.material?.unit || "cái";
                  return (
                    <tr key={item._id} className="admin-table-row" style={{ borderBottom: "1px solid var(--adm-border)" }}>
                      <td style={{ padding: "12px 16px", color: "#fff", fontSize: "13.5px", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px",
                          background: isMaterial ? "rgba(249,115,22,0.08)" : "rgba(99,102,241,0.08)",
                          color: isMaterial ? "#fb923c" : "#818cf8",
                          border: `1px solid ${isMaterial ? "rgba(249,115,22,0.2)" : "rgba(99,102,241,0.2)"}`,
                        }}>
                          {isMaterial ? "Nguyên liệu" : "Thành phẩm"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: STATUS_COLOR[status] }}>
                        {formatQty(item.quantity)} <span style={{ fontSize: "11px", color: "var(--adm-text-dim)", fontWeight: 400 }}>{unit}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "var(--adm-text-dim)" }}>
                        {formatQty(item.minThreshold)} {unit}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px",
                          background: STATUS_BG[status], color: STATUS_COLOR[status], border: `1px solid ${STATUS_BORDER[status]}`,
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_COLOR[status], boxShadow: `0 0 5px ${STATUS_COLOR[status]}` }} />
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
