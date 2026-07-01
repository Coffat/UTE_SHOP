import { useEffect, useState } from "react";
import {
  CrudModal,
  FormField,
  FormTextarea,
  Modal,
} from "../components/AdminUI";
import { AdminPagination } from "../components/AdminPagination";
import {
  getStaffSupportTickets,
  updateStaffSupportTicketStatus,
  replyStaffSupportTicket,
  SupportTicketItem,
} from "../services/staffSupport.api";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await getStaffSupportTickets({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: debouncedSearch || undefined,
      });
      if (res.success && res.data) {
        setTickets(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Lỗi khi tải yêu cầu hỗ trợ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [currentPage, statusFilter, categoryFilter, debouncedSearch]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await updateStaffSupportTicketStatus(ticketId, newStatus);
      if (res.success) {
        setTickets(prev => prev.map(t => (t._id === ticketId ? res.data : t)));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(res.data);
        }
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái", err);
    }
  };

  const handleOpenReply = (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.replyMessage || "");
    setIsReplyOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await replyStaffSupportTicket(selectedTicket._id, replyText);
      if (res.success) {
        setTickets(prev => prev.map(t => (t._id === selectedTicket._id ? res.data : t)));
        setIsReplyOpen(false);
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi", err);
    } finally {
      setReplyLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          background: "rgba(245, 158, 11, 0.12)",
          color: "#f59e0b",
          border: "1px solid rgba(245, 158, 11, 0.25)",
        };
      case "IN_PROGRESS":
        return {
          background: "rgba(59, 130, 246, 0.12)",
          color: "#3b82f6",
          border: "1px solid rgba(59, 130, 246, 0.25)",
        };
      case "RESOLVED":
        return {
          background: "rgba(16, 185, 129, 0.12)",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        };
      default:
        return {};
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "ORDER":
        return "Đơn hàng";
      case "PAYMENT":
        return "Thanh toán";
      case "PRODUCT":
        return "Sản phẩm";
      case "OTHER":
        return "Yêu cầu khác";
      default:
        return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Chưa xử lý";
      case "IN_PROGRESS":
        return "Đang xử lý";
      case "RESOLVED":
        return "Đã giải quyết";
      default:
        return status;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Hỗ trợ khách hàng</h2>
          <p className="admin-page-subtitle">Quản lý và phản hồi các yêu cầu từ trang hỗ trợ</p>
        </div>
      </div>

      {/* Filter panel */}
      <div style={{
        background: "var(--adm-card-bg)",
        border: "1px solid var(--adm-border)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px"
      }}>
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tên, email, số điện thoại..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Trạng thái</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none"
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Chưa xử lý (OPEN)</option>
            <option value="IN_PROGRESS">Đang xử lý (IN PROGRESS)</option>
            <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Danh mục</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none"
            }}
          >
            <option value="">Tất cả danh mục</option>
            <option value="ORDER">Đơn hàng</option>
            <option value="PAYMENT">Thanh toán</option>
            <option value="PRODUCT">Sản phẩm</option>
            <option value="OTHER">Yêu cầu khác</option>
          </select>
        </div>
      </div>

      {/* Tickets table */}
      <div className="admin-card" style={{ padding: "20px", flex: 1 }}>
        {loading && tickets.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải yêu cầu hỗ trợ...</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Không tìm thấy yêu cầu hỗ trợ nào</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Danh mục</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td style={{ fontWeight: 600 }}>{ticket.fullName}</td>
                    <td>
                      <div>{ticket.email}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{ticket.phone}</div>
                    </td>
                    <td>
                      <span className="admin-category-tag" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.subject}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        ...getStatusStyle(ticket.status)
                      }}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#3b82f6",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleOpenReply(ticket)}
                          style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            color: "#10b981",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {ticket.replyMessage ? "Sửa phản hồi" : "Phản hồi"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalItems}
          onPageChange={setCurrentPage}
          loading={loading}
          itemLabel="yêu cầu"
        />
      </div>

      {/* Ticket Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        title="Chi tiết Yêu cầu Hỗ trợ"
        onClose={() => setIsDetailOpen(false)}
        size="lg"
      >
        {selectedTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748b" }}>Khách hàng</p>
                <p style={{ margin: 0, fontWeight: 600, color: "#fff" }}>{selectedTicket.fullName}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{selectedTicket.email}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{selectedTicket.phone}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748b" }}>Thông tin yêu cầu</p>
                <p style={{ margin: 0, color: "#fff" }}>Danh mục: <strong>{getCategoryLabel(selectedTicket.category)}</strong></p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>Ngày tạo: {new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            </div>

            <div>
              <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#64748b" }}>Trạng thái xử lý</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {["OPEN", "IN_PROGRESS", "RESOLVED"].map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedTicket._id, st)}
                    style={{
                      background: selectedTicket.status === st ? "#6366f1" : "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: selectedTicket.status === st ? "#fff" : "#94a3b8",
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: selectedTicket.status === st ? 600 : 400
                    }}
                  >
                    {getStatusLabel(st)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#64748b" }}>Nội dung yêu cầu</p>
              <div style={{ background: "rgba(255,255,255,0.01)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)", color: "#fff", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#6366f1" }}>Tiêu đề: {selectedTicket.subject}</p>
                {selectedTicket.message}
              </div>
            </div>

            {selectedTicket.replyMessage && (
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#64748b" }}>Phản hồi của nhân viên</p>
                <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", fontSize: "13px", color: "#a7f3d0", borderLeft: "3px solid #10b981", lineHeight: 1.6 }}>
                  <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>
                    Phản hồi bởi: {selectedTicket.repliedBy?.fullName || "Staff"} vào {selectedTicket.repliedAt ? new Date(selectedTicket.repliedAt).toLocaleString("vi-VN") : ""}
                  </div>
                  {selectedTicket.replyMessage}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--adm-border)", paddingTop: "16px", gap: "10px" }}>
              <button
                onClick={() => handleOpenReply(selectedTicket)}
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#10b981",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {selectedTicket.replyMessage ? "Sửa phản hồi" : "Gửi phản hồi"}
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <CrudModal
        isOpen={isReplyOpen}
        mode="edit"
        title={selectedTicket?.replyMessage ? "Chỉnh sửa phản hồi hỗ trợ" : "Gửi phản hồi hỗ trợ"}
        onClose={() => setIsReplyOpen(false)}
        onSubmit={handleSendReply}
        submitLabel={replyLoading ? "Đang gửi..." : "Gửi phản hồi"}
      >
        {selectedTicket && (
          <div style={{ marginBottom: "16px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8" }}>
              Yêu cầu từ <strong>{selectedTicket.fullName}</strong> ({getCategoryLabel(selectedTicket.category)})
            </p>
            <p style={{ margin: 0, fontStyle: "italic", fontSize: "12px", color: "#cbd5e1" }}>
              "{selectedTicket.subject}"
            </p>
          </div>
        )}

        <FormField label="Nội dung phản hồi" required>
          <FormTextarea
            required
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Nhập nội dung trả lời gửi đến khách hàng..."
            rows={6}
          />
        </FormField>
      </CrudModal>
    </div>
  );
}
