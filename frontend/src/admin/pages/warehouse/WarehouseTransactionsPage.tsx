import { useEffect, useState, useCallback } from "react";
import { fetchTransactions, type TransactionItem, type TransactionsParams } from "../../services/warehouse.api";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

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

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  IMPORT: { label: "Nhập kho", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  EXPORT: { label: "Xuất kho", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  ADJUSTMENT: { label: "Điều chỉnh", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
};

export function WarehouseTransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async (params: TransactionsParams) => {
    setLoading(true);
    try {
      const result = await fetchTransactions(params);
      setItems(result.items);
      setMeta(result.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params: TransactionsParams = { page, limit: 20 };
    if (typeFilter) params.type = typeFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (search.trim()) params.search = search.trim();
    loadData(params);
  }, [page, typeFilter, dateFrom, dateTo, search, loadData]);

  const handleFilterChange = () => setPage(1);

  return (
    <div className="admin-page" style={{ paddingBottom: "40px" }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Lịch sử giao dịch</h2>
          <p className="admin-page-subtitle">Toàn bộ phiếu nhập/xuất kho theo thời gian</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", borderRadius: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--adm-text-dim)" }}>Tổng:</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{meta.total}</span>
          <span style={{ fontSize: "12px", color: "var(--adm-text-dim)" }}>giao dịch</span>
        </div>
      </div>

      <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div className="admin-search-box" style={{ flex: 1, minWidth: "200px", background: "rgba(255,255,255,0.03)" }}>
            <span className="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text" placeholder="Tìm theo tên hàng, người thực hiện..." className="admin-search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              style={{ width: "100%", background: "transparent" }}
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
            className="admin-form-select"
            style={{ width: "150px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer" }}
          >
            <option value="" style={{ background: "#0d1526" }}>Tất cả loại</option>
            <option value="IMPORT" style={{ background: "#0d1526" }}>Nhập kho</option>
            <option value="EXPORT" style={{ background: "#0d1526" }}>Xuất kho</option>
            <option value="ADJUSTMENT" style={{ background: "#0d1526" }}>Điều chỉnh</option>
          </select>

          {/* Date from */}
          <input
            type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer", outline: "none" }}
          />
          <span style={{ color: "var(--adm-text-dim)", fontSize: "13px" }}>→</span>
          <input
            type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer", outline: "none" }}
          />

          {/* Reset */}
          {(typeFilter || dateFrom || dateTo || search) && (
            <button
              onClick={() => { setTypeFilter(""); setDateFrom(""); setDateTo(""); setSearch(""); setPage(1); }}
              style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "transparent", color: "var(--adm-text-dim)", fontSize: "12px", cursor: "pointer" }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px", color: "var(--adm-text-dim)" }}>Đang tải...</div>
        ) : (
          <>
            <div className="admin-table-wrap" style={{ borderRadius: "8px", border: "1px solid var(--adm-border)", overflowX: "auto", flex: 1, overflowY: "auto" }}>
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)", whiteSpace: "nowrap" }}>Thời gian</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Loại GD</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tên hàng</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Số lượng</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Lý do</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "64px", color: "var(--adm-text-dim)", fontSize: "14px" }}>Không có giao dịch nào</td></tr>
                  ) : items.map((t) => {
                    const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.ADJUSTMENT;
                    const sl = t.stockLevel || {} as any;
                    const pName = sl?.productVariant?.product?.name;
                    const variantDetails = sl?.productVariant?.sizeName ? ` (${sl.productVariant.sizeName})` : (sl?.productVariant?.sku ? ` (${sl.productVariant.sku})` : '');
                    const itemName = sl?.material?.name || (pName ? `${pName}${variantDetails}` : sl?.productVariant?.sku || "—");
                    const unit = sl?.material?.unit || "cái";
                    const qty = formatQty(t.quantity);
                    return (
                      <tr key={t._id} className="admin-table-row" style={{ borderBottom: "1px solid var(--adm-border)" }}>
                        <td style={{ padding: "12px 16px", fontSize: "12.5px", color: "var(--adm-text-dim)", whiteSpace: "nowrap" }}>{formatTime(t.timestamp)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#fff", fontSize: "13.5px", fontWeight: 500 }}>{itemName}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: cfg.color }}>
                          {t.type === "IMPORT" ? "+" : "−"}{qty} <span style={{ fontSize: "11px", color: "var(--adm-text-dim)", fontWeight: 400 }}>{unit}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--adm-text-dim)", maxWidth: "200px" }}>
                          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {t.reason || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--adm-text-dim)" }}>
                          {(t.performedBy as any)?.fullName || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "transparent", color: page <= 1 ? "var(--adm-text-dim)" : "#e2e8f0", fontSize: "13px", cursor: page <= 1 ? "not-allowed" : "pointer" }}
                >
                  ← Trước
                </button>
                {Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p} onClick={() => setPage(p)}
                      style={{ padding: "7px 12px", borderRadius: "6px", border: `1px solid ${page === p ? "rgba(99,102,241,0.4)" : "var(--adm-border)"}`, background: page === p ? "rgba(99,102,241,0.15)" : "transparent", color: page === p ? "#818cf8" : "var(--adm-text-dim)", fontSize: "13px", cursor: "pointer", fontWeight: page === p ? 600 : 400 }}
                    >{p}</button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages}
                  style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "transparent", color: page >= meta.pages ? "var(--adm-text-dim)" : "#e2e8f0", fontSize: "13px", cursor: page >= meta.pages ? "not-allowed" : "pointer" }}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
