import { useState, useEffect } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { fetchAdminOrderById } from "../services/adminOrders.api";
import { fetchStaffOrderById } from "../services/staffOrders.api";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const getNumber = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'object' && val.$numberDecimal) {
    return Number(val.$numberDecimal);
  }
  return Number(val);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return { label: "Chờ xử lý", bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.25)" };
    case "CONFIRMED":
      return { label: "Đã xác nhận", bg: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", border: "rgba(14, 165, 233, 0.25)" };
    case "READY":
      return { label: "Chờ lấy hàng", bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.25)" };
    case "DELIVERING":
      return { label: "Đang giao", bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.25)" };
    case "COMPLETED":
      return { label: "Hoàn tất", bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.25)" };
    case "CANCELLED":
    case "RETURNED":
      return { label: status === "CANCELLED" ? "Đã hủy" : "Đã trả hàng", bg: "rgba(244, 63, 94, 0.12)", color: "#f43f5e", border: "rgba(244, 63, 94, 0.25)" };
    default:
      return { label: status, bg: "rgba(255, 255, 255, 0.1)", color: "#cbd5e1", border: "rgba(255, 255, 255, 0.2)" };
  }
};

const getPaymentStatusBadge = (status: string) => {
  if (status === "PAID") return { label: "Đã thanh toán", color: "#10b981" };
  if (status === "UNPAID") return { label: "Chưa thanh toán", color: "#f59e0b" };
  if (status === "REFUNDED") return { label: "Đã hoàn tiền", color: "#8b5cf6" };
  return { label: status || "Chưa rõ", color: "#94a3b8" };
};

export function OrderDetailModal({ isOpen, onClose, orderId }: OrderDetailModalProps) {
  const { role } = useAdminAuth();
  const isAdmin = role === "ADMIN";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (isAdmin) {
          data = await fetchAdminOrderById(orderId, abortController.signal);
        } else {
          data = await fetchStaffOrderById(orderId, abortController.signal);
        }
        if (!abortController.signal.aborted) {
          setOrder(data);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch order details", err);
          setError("Không thể tải chi tiết đơn hàng.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      abortController.abort();
    };
  }, [isOpen, orderId, isAdmin]);

  if (!isOpen) return null;

  return (
    <div className={`admin-crud-modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose} role="presentation" style={{ zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div className="admin-crud-modal admin-crud-modal--lg" onClick={(e) => e.stopPropagation()} role="dialog" style={{ width: "700px", maxWidth: "95vw", background: "var(--adm-bg)", border: "1px solid var(--adm-border)", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)" }}>
        <div className="admin-crud-modal-header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--adm-border)" }}>
          <div>
            <h2 className="admin-crud-modal-title" style={{ fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: "12px" }}>
              Chi tiết đơn hàng 
              {order && <span style={{ color: "var(--adm-accent)" }}>#{order.orderCode}</span>}
            </h2>
          </div>
          <button type="button" className="admin-crud-modal-close" onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "6px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-crud-modal-body" style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div className="spinner" style={{ width: "24px", height: "24px", border: "2px solid #334155", borderTopColor: "var(--adm-accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              Đang tải dữ liệu...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "32px", textAlign: "center", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "8px", color: "#f43f5e" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {!loading && !error && order && (() => {
            const statusBadge = getStatusBadge(order.status);
            const paymentStatusBadge = getPaymentStatusBadge(order.paymentStatus);
            // Handle finalTotal logic considering legacy DBs without finalTotal field
            const finalTotal = getNumber(order.finalTotal) || getNumber(order.totalAmount);
            const subtotal = getNumber(order.subtotal);
            const shippingFee = getNumber(order.shippingFee);
            const discountAmount = getNumber(order.discountAmount);
            const pointsDiscount = getNumber(order.pointsDiscount);

            return (
              <>
                {/* Status Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", border: "1px solid var(--adm-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      Trạng thái đơn
                    </div>
                    <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}>
                      {statusBadge.label}
                    </span>
                  </div>
                  
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", border: "1px solid var(--adm-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      Thanh toán
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: "14px" }}>{order.paymentMethod || "COD"}</span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>•</span>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: paymentStatusBadge.color }}>{paymentStatusBadge.label}</span>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", border: "1px solid var(--adm-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Ngày đặt
                    </div>
                    <div style={{ fontWeight: 500, color: "#f8fafc", fontSize: "14px" }}>
                      {new Date(order.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "medium" })}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--adm-border)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)", fontSize: "14px", fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Thông tin giao hàng
                  </div>
                  <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>Người nhận</div>
                      <div style={{ color: "#f8fafc", fontWeight: 500 }}>{order.recipient?.fullName || "Không có tên"}</div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>Điện thoại</div>
                      <div style={{ color: "#f8fafc", fontWeight: 500 }}>{order.recipient?.phone || "Không có SĐT"}</div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>Địa chỉ giao hàng</div>
                      <div style={{ color: "#f8fafc", lineHeight: 1.5 }}>{order.recipient?.deliveryNote || "Nhận tại cửa hàng"}</div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {order.note && (
                  <div style={{ display: "flex", gap: "12px", background: "rgba(245, 158, 11, 0.05)", padding: "16px", borderRadius: "8px", border: "1px dashed rgba(245, 158, 11, 0.3)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <div>
                      <div style={{ color: "#f59e0b", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Ghi chú của khách hàng</div>
                      <div style={{ color: "#fcd34d", fontSize: "14px", lineHeight: 1.5 }}>{order.note}</div>
                    </div>
                  </div>
                )}

                {/* Products List */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--adm-border)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)", fontSize: "14px", fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Sản phẩm
                    </div>
                    <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                      {order.items?.length || 0} mặt hàng
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "16px",
                        borderBottom: idx < order.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontWeight: 500, color: "#f8fafc", fontSize: "14px" }}>{item.snapshotName}</span>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                              {getNumber(item.unitPrice).toLocaleString("vi-VN")} đ <span style={{ margin: "0 4px" }}>×</span> <strong style={{ color: "#94a3b8" }}>{item.quantity}</strong>
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "15px" }}>
                          {getNumber(item.subtotal).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Table */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--adm-border)", overflow: "hidden" }}>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                      <span>Tạm tính ({order.items?.length || 0} sản phẩm)</span>
                      <span style={{ fontWeight: 500 }}>{subtotal.toLocaleString("vi-VN")} đ</span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                      <span>Phí vận chuyển</span>
                      <span style={{ fontWeight: 500 }}>{shippingFee.toLocaleString("vi-VN")} đ</span>
                    </div>

                    {discountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          Giảm giá (Voucher)
                        </span>
                        <span style={{ fontWeight: 500 }}>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                      </div>
                    )}

                    {pointsDiscount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                          Dùng điểm ({order.pointsUsed} điểm)
                        </span>
                        <span style={{ fontWeight: 500 }}>-{pointsDiscount.toLocaleString("vi-VN")} đ</span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(255,255,255,0.15)", margin: "4px 0", paddingTop: "16px", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "#f8fafc", fontSize: "15px" }}>Tổng thanh toán</span>
                      <span style={{ fontWeight: 700, color: "var(--adm-accent, #6366f1)", fontSize: "20px" }}>
                        {finalTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                </div>

              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
