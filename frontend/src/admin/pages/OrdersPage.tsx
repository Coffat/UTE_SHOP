import { useState } from "react";
import { RECENT_ORDERS } from "../data/mockData";
import { OrdersTable } from "../components/OrdersTable";

const ALL_ORDERS = RECENT_ORDERS;

const TABS = [
  { key: "all",        label: "Tất cả" },
  { key: "pending",    label: "Chờ xử lý" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipped",    label: "Đang giao" },
  { key: "delivered",  label: "Đã giao" },
  { key: "cancelled",  label: "Đã hủy" },
];

export function OrdersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = ALL_ORDERS.filter((o) => {
    const matchTab = tab === "all" || o.status === tab;
    const matchSearch =
      search === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="admin-page">      {/* Page toolbar */}
      <div className="admin-page-toolbar">
        <div className="admin-search-box">
          <span className="admin-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách..."
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="admin-btn admin-btn-outline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Xuất Excel
        </button>
      </div>

      {/* Status tabs */}
      <div className="admin-tabs">
        {TABS.map((t) => {
          const count = t.key === "all" ? ALL_ORDERS.length : ALL_ORDERS.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="admin-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        <OrdersTable orders={filtered} />
        {filtered.length === 0 && (
          <div className="admin-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '16px' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <p>Không tìm thấy đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="admin-pagination">
        <span className="admin-pagination-info">Hiển thị {filtered.length} / {ALL_ORDERS.length} đơn hàng</span>
        <div className="admin-pagination-btns">
          <button className="admin-pagination-btn" disabled>← Trước</button>
          <button className="admin-pagination-btn active">1</button>
          <button className="admin-pagination-btn">2</button>
          <button className="admin-pagination-btn">3</button>
          <button className="admin-pagination-btn">Tiếp →</button>
        </div>
      </div>
    </div>
  );
}
