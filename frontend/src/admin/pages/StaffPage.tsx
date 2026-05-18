import { useState } from "react";
import { STAFF_MEMBERS } from "../data/mockData";
import { useConfirm, Slideover, FormField, FormInput, FormSelect } from "../components/AdminUI";
import type { StaffMember } from "../types/admin.types";

export function StaffPage() {
  const [search, setSearch] = useState("");
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const { confirm, ModalEl } = useConfirm();

  const filtered = STAFF_MEMBERS.filter(
    (s) =>
      search === "" ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Tìm nhân viên..."
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { setEditStaff(null); setSlideoverOpen(true); }}
        >
          + Thêm nhân viên
        </button>
      </div>

      {/* Stats row */}
      <div className="admin-staff-stats">
        <div className="admin-staff-stat-card">
          <p className="admin-staff-stat-val">{STAFF_MEMBERS.length}</p>
          <p className="admin-staff-stat-lbl">Tổng nhân viên</p>
        </div>
        <div className="admin-staff-stat-card">
          <p className="admin-staff-stat-val" style={{ color: "#10b981" }}>
            {STAFF_MEMBERS.filter((s) => s.isActive).length}
          </p>
          <p className="admin-staff-stat-lbl">Đang hoạt động</p>
        </div>
        <div className="admin-staff-stat-card">
          <p className="admin-staff-stat-val" style={{ color: "#f59e0b" }}>
            {Array.from(new Set(STAFF_MEMBERS.map((s) => s.department))).length}
          </p>
          <p className="admin-staff-stat-lbl">Phòng ban</p>
        </div>
        <div className="admin-staff-stat-card">
          <p className="admin-staff-stat-val" style={{ color: "#6366f1" }}>
            {Math.round(STAFF_MEMBERS.reduce((acc, s) => acc + s.tasksCompleted, 0) / STAFF_MEMBERS.length)}
          </p>
          <p className="admin-staff-stat-lbl">Nhiệm vụ TB/người</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Email</th>
                <th>Phòng ban</th>
                <th>Nhiệm vụ hoàn thành</th>
                <th>Hoạt động cuối</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="admin-table-row">
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-table-avatar" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: "#e2e8f0" }}>{s.fullName}</p>
                        <p className="admin-table-muted">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: "13px", color: "#94a3b8" }}>{s.email}</span></td>
                  <td><span className="admin-category-tag">{s.department}</span></td>
                  <td>
                    <div className="admin-task-progress">
                      <span className="admin-table-mono">{s.tasksCompleted}</span>
                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${Math.min(100, (s.tasksCompleted / 350) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td><span className="admin-table-muted">{s.lastActive}</span></td>
                  <td>
                    <span
                      className="admin-status-badge"
                      style={s.isActive
                        ? { color: "#10b981", background: "rgba(16,185,129,0.12)", borderColor: "#10b98140" }
                        : { color: "#64748b", background: "rgba(100,116,139,0.12)", borderColor: "#64748b40" }
                      }
                    >
                      <span className="admin-status-dot" style={{ background: s.isActive ? "#10b981" : "#64748b" }} />
                      {s.isActive ? "Đang làm việc" : "Tạm nghỉ"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-btn view">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="admin-action-btn edit" onClick={() => { setEditStaff(s); setSlideoverOpen(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        className="admin-action-btn delete"
                        onClick={async () => {
                          await confirm({ title: "Xóa nhân viên", message: `Xóa nhân viên "${s.fullName}"?`, variant: "danger", confirmLabel: "Xóa" });
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
        </div>
      </div>

      {/* Slideover */}
      <Slideover
        isOpen={slideoverOpen}
        title={editStaff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        onClose={() => setSlideoverOpen(false)}
      >
        <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setSlideoverOpen(false); }}>
          <FormField label="Họ và tên" required>
            <FormInput placeholder="Nhập tên nhân viên..." defaultValue={editStaff?.fullName} />
          </FormField>
          <FormField label="Email" required>
            <FormInput type="email" placeholder="example@uteshop.vn" defaultValue={editStaff?.email} />
          </FormField>
          <FormField label="Phòng ban" required>
            <FormSelect defaultValue={editStaff?.department}>
              <option value="">-- Chọn phòng ban --</option>
              <option>Kho vận</option>
              <option>Chăm sóc KH</option>
              <option>Marketing</option>
              <option>Kỹ thuật</option>
            </FormSelect>
          </FormField>
          <FormField label="Vai trò" required>
            <FormSelect defaultValue={editStaff?.role ?? "staff"}>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </FormSelect>
          </FormField>
          {!editStaff && (
            <FormField label="Mật khẩu tạm thời" required>
              <FormInput type="password" placeholder="Nhập mật khẩu tạm..." />
            </FormField>
          )}
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSlideoverOpen(false)}>Hủy</button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editStaff ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </Slideover>
    </div>
  );
}
