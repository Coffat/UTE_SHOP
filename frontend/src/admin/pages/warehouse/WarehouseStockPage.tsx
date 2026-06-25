import { useEffect, useState, useMemo } from "react";
import { fetchStockLevels, type StockLevelItem } from "../../services/warehouse.api";

type TabType = "all" | "material" | "variant";
type StatusFilter = "all" | "ok" | "low" | "out";

function getStockStatus(qty: number, min: number) {
  if (qty <= 0) return "out";
  if (min > 0 && qty <= min) return "low";
  return "ok";
}

function formatQty(n: any): string {
  if (n === null || n === undefined) return "0";
  // Handle MongoDB Decimal128 format from JSON
  if (typeof n === "object" && n.$numberDecimal !== undefined) {
    const num = Number(n.$numberDecimal);
    return Number.isNaN(num) ? "0" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
  }
  const num = typeof n === "object" ? Number(n.toString()) : Number(n);
  return Number.isNaN(num) ? "0" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
}

function formatCurrency(n: any): string {
  const num = typeof n === "object" && n !== null && n.$numberDecimal ? Number(n.$numberDecimal) : Number(n);
  if (Number.isNaN(num) || num === 0) return "—";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

function formatDate(isoStr?: string) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = { ok: "Còn hàng", low: "Sắp hết", out: "Hết hàng" };
const STATUS_STYLES: Record<string, { bg: string, color: string }> = { 
  ok: { bg: "rgba(16,185,129,0.1)", color: "#34d399" }, 
  low: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24" }, 
  out: { bg: "rgba(239,68,68,0.1)", color: "#f87171" } 
};

export function WarehouseStockPage() {
  const [items, setItems] = useState<StockLevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = (type: TabType) => {
    setLoading(true);
    const param = type === "all" ? undefined : (type as "material" | "variant");
    fetchStockLevels(param)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(tab); }, [tab]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, statusFilter, search]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, statusFilter, search]);

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-page" style={{ padding: "24px", background: "var(--adm-bg)", color: "var(--adm-text)" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", color: "#fff" }}>Danh sách Tồn kho</h2>
          <p style={{ fontSize: "14px", color: "var(--adm-text-dim)", margin: 0 }}>Quản lý chi tiết số lượng và giá trị hàng hóa trong kho</p>
        </div>
      </div>

      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        
        {/* Top Controls Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "16px" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "6px" }}>
            {TAB_ITEMS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 16px", borderRadius: "4px", border: "none", cursor: "pointer", 
                  fontSize: "13px", fontWeight: 500, transition: "all 0.2s",
                  background: tab === t.key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === t.key ? "#fff" : "var(--adm-text-dim)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            {/* Quick Stats inline */}
            <div style={{ display: "flex", gap: "12px", marginRight: "auto", marginLeft: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}><strong style={{ color: "#34d399" }}>{statusCounts.ok}</strong> Bình thường</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}><strong style={{ color: "#fbbf24" }}>{statusCounts.low}</strong> Sắp hết</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}><strong style={{ color: "#f87171" }}>{statusCounts.out}</strong> Hết hàng</span>
            </div>

            {/* Search */}
            <div style={{ position: "relative", width: "240px" }}>
              <svg style={{ position: "absolute", left: "10px", top: "10px", opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text" placeholder="Tìm SKU, tên sản phẩm..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "8px 12px 8px 32px", color: "#fff", fontSize: "13px" }}
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{ width: "160px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ok">Còn hàng</option>
              <option value="low">Sắp hết</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--adm-text-dim)", fontSize: "14px" }}>Đang tải dữ liệu kho...</div>
        ) : (
          <div style={{ overflowX: "auto", flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)" }}>Mặt hàng</th>
                  <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)" }}>Tồn kho / Ngưỡng</th>
                  <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)" }}>Giá nhập</th>
                  <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)" }}>Tổng giá trị</th>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)" }}>Lần cập nhật cuối</th>
                  <th style={{ padding: "12px 20px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-dim)", width: "100px" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "60px", color: "var(--adm-text-dim)" }}>Không có dữ liệu phù hợp.</td></tr>
                ) : paginatedItems.map((item) => {
                  const qtyNum = Number(formatQty(item.quantity));
                  const minNum = Number(formatQty(item.minThreshold));
                  const status = getStockStatus(qtyNum, minNum);
                  
                  const isMaterial = !!item.material;
                  const name = item.material?.name || item.productVariant?.sizeName || item.productVariant?.sku || "—";
                  const sku = isMaterial ? `MAT-${item.material?._id?.substring(0,4).toUpperCase()}` : item.productVariant?.sku || "—";
                  const unit = item.material?.unit || "cái";
                  
                  // Calculate values based on import cost ONLY
                  let costPerUnit: number | null = null;
                  if (isMaterial && item.material?.costPerUnit) {
                    costPerUnit = typeof item.material.costPerUnit === "object" ? Number((item.material.costPerUnit as any).$numberDecimal) : Number(item.material.costPerUnit);
                  }
                  
                  const totalValue = costPerUnit !== null ? costPerUnit * qtyNum : null;

                  return (
                    <tr key={item._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#e2e8f0" }}>{name}</span>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "var(--adm-text-dim)" }}>{sku}</span>
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "var(--adm-text-dim)" }}>
                              {isMaterial ? "Nguyên liệu" : "Thành phẩm"}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: "12px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                          <span style={{ fontSize: "14px", fontFamily: "var(--adm-mono)", fontWeight: 600, color: status === "out" ? "#f87171" : "#e2e8f0" }}>
                            {formatQty(item.quantity)} <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--adm-text-dim)" }}>{unit}</span>
                          </span>
                          <span style={{ fontSize: "11px", fontFamily: "var(--adm-mono)", color: "var(--adm-text-dim)" }}>/ {formatQty(item.minThreshold)} (min)</span>
                        </div>
                      </td>

                      <td style={{ padding: "12px 20px", textAlign: "right", fontSize: "13px", fontFamily: "var(--adm-mono)", color: "#94a3b8" }}>
                        {costPerUnit !== null ? formatCurrency(costPerUnit) : "—"}
                      </td>

                      <td style={{ padding: "12px 20px", textAlign: "right", fontSize: "14px", fontFamily: "var(--adm-mono)", fontWeight: 500, color: "#e2e8f0" }}>
                        {totalValue !== null ? formatCurrency(totalValue) : "—"}
                      </td>

                      <td style={{ padding: "12px 20px", textAlign: "left", fontSize: "13px", color: "var(--adm-text-dim)" }}>
                        {formatDate(item.updatedAt)}
                      </td>

                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "4px 8px", borderRadius: "4px",
                          fontSize: "11px", fontWeight: 500,
                          background: STATUS_STYLES[status].bg, color: STATUS_STYLES[status].color,
                        }}>
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

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}>
              Đang hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> trên <strong>{filtered.length}</strong> kết quả
            </div>
            
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "4px", color: currentPage === 1 ? "rgba(255,255,255,0.2)" : "#e2e8f0", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}
              >Trước</button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                if (p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1) {
                  return (
                    <button 
                      key={p} onClick={() => setCurrentPage(p)}
                      style={{ 
                        width: "32px", height: "32px", 
                        background: currentPage === p ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", 
                        border: "none", borderRadius: "4px", 
                        color: currentPage === p ? "#818cf8" : "#e2e8f0", 
                        cursor: "pointer", fontSize: "13px", fontWeight: currentPage === p ? 600 : 400
                      }}
                    >{p}</button>
                  );
                } else if (Math.abs(currentPage - p) === 2 && (p > 1 && p < totalPages)) {
                  return <span key={p} style={{ padding: "4px", color: "var(--adm-text-dim)" }}>...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "4px", color: currentPage === totalPages ? "rgba(255,255,255,0.2)" : "#e2e8f0", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
