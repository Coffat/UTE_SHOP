import type { OrderItem } from "../types/admin.types";
import { useAdminAuth } from "../context/AdminAuthContext";

const STATUS_CONFIG = {
  pending:    { label: "Chờ xử lý",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  processing: { label: "Đang xử lý",  color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  shipped:    { label: "Đang giao",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  delivered:  { label: "Đã giao",      color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  cancelled:  { label: "Đã hủy",       color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
};

function StatusBadge({ status }: { status: OrderItem["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="admin-status-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
    >
      <span className="admin-status-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function formatAmount(n: number) {
  return n.toLocaleString("vi-VN") + " ₫";
}

interface OrdersTableProps {
  orders: OrderItem[];
  compact?: boolean;
}

export function OrdersTable({ orders, compact = false }: OrdersTableProps) {
  const { isAdmin } = useAdminAuth();

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            {!compact && <th>Sản phẩm</th>}
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Ngày đặt</th>
            {!compact && <th>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="admin-table-row">
              <td>
                <span className="admin-table-mono">{order.id}</span>
              </td>
              <td>
                <div className="admin-table-user">
                  <div className="admin-table-avatar">
                    {order.customer.charAt(0)}
                  </div>
                  <span>{order.customer}</span>
                </div>
              </td>
              {!compact && (
                <td>
                  <span className="admin-table-truncate">{order.product}</span>
                </td>
              )}
              <td>
                <span className="admin-table-amount">{formatAmount(order.amount)}</span>
              </td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td>
                <span className="admin-table-muted">{order.date}</span>
              </td>
              {!compact && (
                <td>
                  <div className="admin-table-actions">
                    <button className="admin-action-btn view" title="Xem chi tiết">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="admin-action-btn edit" title="Cập nhật trạng thái">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {isAdmin && order.status !== "cancelled" && (
                      <button className="admin-action-btn delete" title="Hủy đơn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
