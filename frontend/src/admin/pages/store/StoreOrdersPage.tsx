import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchStoreOrders,
  changeStoreOrderStatus,
  cancelStoreOrder,
  confirmStorePayment,
} from "../../services/storeOrders.api";
import {
  getNextBackendStatus,
  uiStatusToStatusGroup,
  type AdminOrderRow,
  type UiOrderStatus,
} from "../../services/mappers/order.mapper";
import { OrderDetailModal } from "../../components/OrderDetailModal";

function getStatusStyle(status: UiOrderStatus) {
  switch (status) {
    case "pending": return { background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)" };
    case "confirmed": return { background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", border: "1px solid rgba(14, 165, 233, 0.25)" };
    case "ready": return { background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.25)" };
    case "shipping": return { background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)" };
    case "completed": return { background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" };
    case "cancelled": return { background: "rgba(244, 63, 94, 0.12)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.25)" };
  }
}

function getStatusLabel(status: UiOrderStatus) {
  switch (status) {
    case "pending": return "Chờ xử lý";
    case "confirmed": return "Đã xác nhận";
    case "ready": return "Chờ lấy hàng";
    case "shipping": return "Đang giao";
    case "completed": return "Hoàn tất";
    case "cancelled": return "Đã hủy";
  }
}

const getPaymentMethodLabel = (method?: string) => {
  const value = (method || "").toUpperCase();
  if (value === "CASH") return "Tiền mặt";
  if (value === "MOMO") return "MoMo";
  if (value === "VNPAY") return "VNPay";
  if (value === "COD") return "COD";
  return "—";
};

export function StoreOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenedOrderRef = useRef<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UiOrderStatus>("all");
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortMode, setSortMode] = useState<"newest" | "oldest" | "amountDesc" | "amountAsc">("newest");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [detailModalOrderId, setDetailModalOrderId] = useState<string | null>(null);

  useEffect(() => {
    const group = searchParams.get("statusGroup");
    const mapGroupToFilter: Record<string, UiOrderStatus> = {
      pending: "pending",
      confirmed: "confirmed",
      ready: "ready",
      shipping: "shipping",
      completed: "completed",
      cancelled: "cancelled",
    };
    const nextFilter = group ? mapGroupToFilter[group] : undefined;
    setStatusFilter(nextFilter ?? "all");
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    const focusOrderId = searchParams.get("focusOrderId");
    if (!focusOrderId) return;
    if (autoOpenedOrderRef.current === focusOrderId) return;

    autoOpenedOrderRef.current = focusOrderId;
    setDetailModalOrderId(focusOrderId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focusOrderId");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadOrders = useCallback(async (signal?: AbortSignal, silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchStoreOrders({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        statusGroup: statusFilter !== "all" ? uiStatusToStatusGroup(statusFilter) : undefined,
      });
      if (signal?.aborted) return;
      setOrders(result.items);
      setTotalPages(result.meta.pages);
      setTotalCount(result.meta.total);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Failed to fetch orders:", err);
      setError("Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    const abortController = new AbortController();
    const timer = setTimeout(() => { loadOrders(abortController.signal); }, search ? 300 : 0);
    return () => { clearTimeout(timer); abortController.abort(); };
  }, [loadOrders, search]);

  const handleAdvanceStatus = async (order: AdminOrderRow) => {
    const next = getNextBackendStatus(order.backendStatus);
    if (!next) return;
    setStatusUpdatingId(order.id);
    try {
      await changeStoreOrderStatus(order.id, next);
      await loadOrders(undefined, true);
    } catch (err) {
      console.error("Failed to advance status:", err);
      setError("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      await cancelStoreOrder(orderId, "Hủy bởi nhân viên cửa hàng");
      await loadOrders(undefined, true);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      setError("Không thể hủy đơn hàng.");
    }
  };

  const handleConfirmPayment = async (orderId: string, paymentMethod?: string) => {
    if (!window.confirm("Xác nhận đã nhận tiền thanh toán cho đơn hàng này?")) return;
    try {
      const normalizedMethod = (paymentMethod || "").toUpperCase();
      const manualMethod = normalizedMethod === "MOMO" ? "MOMO" : "CASH";
      await confirmStorePayment(orderId, manualMethod, "Thu tiền tại cửa hàng");
      await loadOrders(undefined, true);
    } catch (err) {
      console.error("Failed to confirm payment:", err);
      setError("Không thể xác nhận thanh toán.");
    }
  };

  const sortedOrders = useMemo(() => {
    const items = [...orders];
    if (sortMode === "newest") {
      return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    if (sortMode === "oldest") {
      return items.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }
    if (sortMode === "amountDesc") {
      return items.sort((a, b) => b.totalAmount - a.totalAmount);
    }
    return items.sort((a, b) => a.totalAmount - b.totalAmount);
  }, [orders, sortMode]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Quản lý Đơn hàng</h2>
          <p className="admin-page-subtitle">Xem, cập nhật và xử lý tất cả đơn hàng</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "16px", padding: "20px 24px", borderBottom: "1px solid var(--adm-border)", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Tìm mã đơn, tên, sđt khách..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ padding: "8px 12px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", width: "240px", outline: "none" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              const nextValue = e.target.value as "all" | UiOrderStatus;
              setStatusFilter(nextValue);
              setCurrentPage(1);
              const nextParams = new URLSearchParams(searchParams);
              if (nextValue === "all") {
                nextParams.delete("statusGroup");
              } else {
                nextParams.set("statusGroup", uiStatusToStatusGroup(nextValue));
              }
              setSearchParams(nextParams, { replace: true });
            }}
            style={{ padding: "8px 12px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="ready">Chờ lấy hàng</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            style={{ padding: "8px 12px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="amountDesc">Giá trị cao → thấp</option>
            <option value="amountAsc">Giá trị thấp → cao</option>
          </select>
        </div>

        {/* Table */}
        <div className="admin-table-wrap" style={{ overflowX: "auto", flex: 1 }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Mã đơn</th>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Khách hàng</th>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Ngày tạo</th>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Thanh toán</th>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Loại đơn</th>
                <th style={{ textAlign: "left", padding: "14px 24px" }}>Trạng thái</th>
                <th style={{ textAlign: "center", padding: "14px 24px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Đang tải...</td></tr>}
              {!loading && error && <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#f43f5e" }}>{error}</td></tr>}
              {!loading && !error && orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Không tìm thấy đơn hàng nào.</td></tr>}
              {!loading && sortedOrders.map(o => (
                <tr key={o.id} className="admin-table-row">
                  <td style={{ padding: "14px 24px", fontFamily: "var(--adm-mono)", fontWeight: 600 }}>{o.orderCode}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <div style={{ fontWeight: 500 }}>{o.customerName}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2 }}>{o.customerPhone}</div>
                  </td>
                  <td style={{ padding: "14px 24px", fontSize: "13px", color: "#e2e8f0" }}>{o.date}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "4px", background: o.payment === "paid" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: o.payment === "paid" ? "#10b981" : "#94a3b8", fontWeight: 500 }}>
                      {getPaymentMethodLabel(o.paymentMethod)} • {o.payment === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                    {o.payment !== "paid" && o.status !== "cancelled" && (o.paymentMethod || "").toUpperCase() !== "VNPAY" && (
                       <button onClick={() => handleConfirmPayment(o.id, o.paymentMethod)} style={{ display: "block", marginTop: "6px", background: "none", border: "1px solid #10b981", color: "#10b981", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", cursor: "pointer" }}>
                         Nhận tiền
                       </button>
                    )}
                  </td>
                  <td style={{ padding: "14px 24px", fontSize: "13px" }}>
                    {o.orderType === "AT_STORE" ? <span style={{ color: "#fb923c" }}>Tại quầy</span> : <span style={{ color: "#818cf8" }}>Online</span>}
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, ...getStatusStyle(o.status) }}>
                      {getStatusLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button className="admin-action-glass-btn" onClick={() => setDetailModalOrderId(o.id)} title="Xem chi tiết" style={{ padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", cursor: "pointer", color: "#e2e8f0" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="admin-action-glass-btn" disabled={statusUpdatingId === o.id || !getNextBackendStatus(o.backendStatus)} onClick={() => handleAdvanceStatus(o)} title="Chuyển trạng thái tiếp theo" style={{ padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", cursor: "pointer", color: "#60a5fa" }}>
                        {statusUpdatingId === o.id ? (
                          "..."
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </button>
                      {(o.backendStatus === "PENDING" || o.backendStatus === "CONFIRMED") && (
                        <button className="admin-action-glass-btn" onClick={() => handleCancel(o.id)} title="Hủy đơn" style={{ padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", cursor: "pointer", color: "#ef4444" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--adm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontSize: "13px" }}>Tổng {totalCount} đơn</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#fff", cursor: "pointer" }}>Trang trước</button>
            <span style={{ padding: "4px 12px", fontSize: "13px", color: "#94a3b8" }}>{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid var(--adm-border)", background: "rgba(255,255,255,0.02)", color: "#fff", cursor: "pointer" }}>Trang sau</button>
          </div>
        </div>
      </div>

      <OrderDetailModal
        isOpen={Boolean(detailModalOrderId)}
        orderId={detailModalOrderId}
        onClose={() => setDetailModalOrderId(null)}
      />
    </div>
  );
}
