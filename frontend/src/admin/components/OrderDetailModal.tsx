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
    <div className={`admin-crud-modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose} role="presentation" style={{ zIndex: 1000 }}>
      <div className="admin-crud-modal admin-crud-modal--lg" onClick={(e) => e.stopPropagation()} role="dialog" style={{ width: "640px", maxWidth: "90vw" }}>
        <div className="admin-crud-modal-header">
          <h2 className="admin-crud-modal-title">
            {order ? `Chi tiết đơn hàng #${order.orderCode}` : "Chi tiết đơn hàng"}
          </h2>
          <button type="button" className="admin-crud-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="admin-crud-modal-body" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto", padding: "0" }}>
      {loading && (
        <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
          Đang tải chi tiết đơn hàng...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "32px", textAlign: "center", color: "#f43f5e" }}>
          {error}
        </div>
      )}

      {!loading && !error && !order && (
        <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
          Không tìm thấy đơn hàng.
        </div>
      )}

      {!loading && !error && order && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#e2e8f0" }}>
          {/* Status & Payment info */}
          <div style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Trạng thái</p>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>{order.status}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Thanh toán</p>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>{order.paymentMethod} - {order.paymentStatus}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Ngày đặt</p>
              <p style={{ fontWeight: 500, fontSize: "14px" }}>
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div>
            <h4 style={{ fontSize: "15px", color: "#fff", marginBottom: "12px", borderBottom: "1px solid var(--adm-border)", paddingBottom: "8px" }}>Thông tin giao hàng</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "#94a3b8" }}>Người nhận: </span>
                <span style={{ fontWeight: 500 }}>{order.recipient?.fullName}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Điện thoại: </span>
                <span style={{ fontWeight: 500 }}>{order.recipient?.phone}</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#94a3b8" }}>Ghi chú giao hàng: </span>
                <span>{order.recipient?.deliveryNote || "Không có"}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 style={{ fontSize: "15px", color: "#fff", marginBottom: "12px", borderBottom: "1px solid var(--adm-border)", paddingBottom: "8px" }}>Sản phẩm ({order.items?.length || 0})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 500, color: "#fff" }}>{item.snapshotName}</span>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                      {getNumber(item.unitPrice).toLocaleString("vi-VN")} đ x {item.quantity}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: "#10b981" }}>
                    {getNumber(item.subtotal).toLocaleString("vi-VN")} đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 style={{ fontSize: "15px", color: "#fff", marginBottom: "12px", borderBottom: "1px solid var(--adm-border)", paddingBottom: "8px" }}>Tổng kết</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", width: "100%", maxWidth: "300px", marginLeft: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Tạm tính:</span>
                <span>{getNumber(order.subtotal).toLocaleString("vi-VN")} đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Phí ship:</span>
                <span>{getNumber(order.shippingFee).toLocaleString("vi-VN")} đ</span>
              </div>
              {getNumber(order.discountAmount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
                  <span>Giảm giá (Voucher):</span>
                  <span>-{getNumber(order.discountAmount).toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {getNumber(order.pointsDiscount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
                  <span>Giảm giá (Điểm):</span>
                  <span>-{getNumber(order.pointsDiscount).toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ fontWeight: 600, color: "#fff" }}>Thành tiền:</span>
                <span style={{ fontWeight: 700, color: "#6366f1", fontSize: "16px" }}>
                  {getNumber(order.finalTotal).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </div>
          
          {/* Note */}
          {order.note && (
            <div style={{ marginTop: "8px", padding: "12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "6px", color: "#fcd34d", fontSize: "13px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>Ghi chú của khách hàng:</strong>
              {order.note}
            </div>
          )}

        </div>
      )}
        </div>
      </div>
    </div>
  );
}
