import { useState } from "react";
import { CUSTOMERS } from "../data/mockData";
import { useConfirm, Slideover, FormField, FormInput } from "../components/AdminUI";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const { confirm, ModalEl } = useConfirm();

  const filtered = CUSTOMERS.filter((c) =>
    search === "" ||
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="admin-page">
      {ModalEl}

      <div className="admin-page-toolbar">
        <div className="admin-search-box">
          <span className="admin-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="admin-btn admin-btn-outline">
          Lọc nâng cao
        </button>
        <button className="admin-btn admin-btn-primary" onClick={() => setSlideoverOpen(true)}>
          + Thêm khách hàng
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="admin-table-row">
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-table-avatar" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                        {c.fullName.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: "#e2e8f0" }}>{c.fullName}</p>
                        <p className="admin-table-muted">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p style={{ fontSize: "13px", color: "#cbd5e1" }}>{c.email}</p>
                      <p className="admin-table-muted">{c.phone}</p>
                    </div>
                  </td>
                  <td><span className="admin-table-mono">{c.totalOrders}</span></td>
                  <td><span className="admin-table-amount">{c.totalSpent.toLocaleString("vi-VN")} ₫</span></td>
                  <td><span className="admin-table-muted">{c.joinDate}</span></td>
                  <td>
                    <span
                      className="admin-status-badge"
                      style={c.isActive
                        ? { color: "#10b981", background: "rgba(16,185,129,0.12)", borderColor: "#10b98140" }
                        : { color: "#64748b", background: "rgba(100,116,139,0.12)", borderColor: "#64748b40" }
                      }
                    >
                      <span className="admin-status-dot" style={{ background: c.isActive ? "#10b981" : "#64748b" }} />
                      {c.isActive ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-btn view" title="Xem hồ sơ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="admin-action-btn edit" title="Chỉnh sửa">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        className="admin-action-btn delete"
                        title="Xóa"
                        onClick={async () => {
                          await confirm({ title: "Xóa khách hàng", message: `Xóa "${c.fullName}"?`, variant: "danger", confirmLabel: "Xóa" });
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>Không tìm thấy khách hàng nào</p>
            </div>
          )}
        </div>
      </div>

      <Slideover isOpen={slideoverOpen} title="Thêm khách hàng mới" onClose={() => setSlideoverOpen(false)}>
        <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setSlideoverOpen(false); }}>
          <FormField label="Họ và tên" required>
            <FormInput placeholder="Nhập họ và tên..." />
          </FormField>
          <FormField label="Email" required>
            <FormInput type="email" placeholder="example@email.com" />
          </FormField>
          <FormField label="Số điện thoại">
            <FormInput placeholder="0xxx xxx xxx" />
          </FormField>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSlideoverOpen(false)}>Hủy</button>
            <button type="submit" className="admin-btn admin-btn-primary">Lưu khách hàng</button>
          </div>
        </form>
      </Slideover>
    </div>
  );
}
