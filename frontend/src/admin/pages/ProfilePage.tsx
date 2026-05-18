import { useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { FormField, FormInput, FormTextarea } from "../components/AdminUI";

export function ProfilePage() {
  const { user, role } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "preferences">("profile");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!user) return null;

  return (
    <div className="admin-profile-layout">
      {/* Profile card */}
      <div className="admin-profile-card">
        <div className="admin-profile-avatar-wrap">
          <div className="admin-profile-avatar-lg">
            {user.fullName.charAt(0)}
          </div>
          <button className="admin-profile-avatar-change">Đổi ảnh</button>
        </div>
        <div className="admin-profile-info">
          <h2 className="admin-profile-name">{user.fullName}</h2>
          <p className="admin-profile-email">{user.email}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span className={`admin-role-badge ${role}`}>
              {role === "admin" ? "Quản trị viên" : "Nhân viên"}
            </span>
            {user.department && (
              <span className="admin-category-tag">{user.department}</span>
            )}
          </div>
        </div>
        <div className="admin-profile-meta">
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">6</p>
            <p className="admin-profile-meta-lbl">Tháng làm việc</p>
          </div>
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">147</p>
            <p className="admin-profile-meta-lbl">Đơn xử lý</p>
          </div>
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">98%</p>
            <p className="admin-profile-meta-lbl">Hiệu suất</p>
          </div>
        </div>
      </div>

      {/* Tabs + Form */}
      <div className="admin-card">
        <div className="admin-tabs" style={{ marginBottom: "24px" }}>
          <button className={`admin-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            Thông tin cá nhân
          </button>
          <button className={`admin-tab ${activeTab === "password" ? "active" : ""}`} onClick={() => setActiveTab("password")}>
            Đổi mật khẩu
          </button>
          <button className={`admin-tab ${activeTab === "preferences" ? "active" : ""}`} onClick={() => setActiveTab("preferences")}>
            Tùy chỉnh
          </button>
        </div>

        {/* Toast */}
        {saved && (
          <div className="admin-toast admin-toast-success">
            ✓ Đã lưu thay đổi thành công!
          </div>
        )}

        {activeTab === "profile" && (
          <form className="admin-form" onSubmit={handleSave}>
            <div className="admin-form-row">
              <FormField label="Họ và tên" required>
                <FormInput defaultValue={user.fullName} />
              </FormField>
              <FormField label="Email" required>
                <FormInput type="email" defaultValue={user.email} />
              </FormField>
            </div>
            <div className="admin-form-row">
              <FormField label="Số điện thoại">
                <FormInput defaultValue="0912 345 678" />
              </FormField>
              <FormField label="Phòng ban">
                <FormInput defaultValue={user.department} disabled={role === "staff"} />
              </FormField>
            </div>
            <FormField label="Giới thiệu bản thân">
              <FormTextarea placeholder="Nhập thông tin giới thiệu..." />
            </FormField>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">Lưu thay đổi</button>
            </div>
          </form>
        )}

        {activeTab === "password" && (
          <form className="admin-form" onSubmit={handleSave}>
            <FormField label="Mật khẩu hiện tại" required>
              <FormInput type="password" placeholder="••••••••" />
            </FormField>
            <FormField label="Mật khẩu mới" required>
              <FormInput type="password" placeholder="••••••••" />
            </FormField>
            <FormField label="Xác nhận mật khẩu mới" required>
              <FormInput type="password" placeholder="••••••••" />
            </FormField>
            <div className="admin-password-requirements">
              <p className="admin-password-req-title">Yêu cầu mật khẩu:</p>
              <ul>
                <li>✓ Tối thiểu 8 ký tự</li>
                <li>✓ Có ít nhất 1 chữ hoa</li>
                <li>✓ Có ít nhất 1 số</li>
                <li>✗ Có ký tự đặc biệt (!@#$%)</li>
              </ul>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">Cập nhật mật khẩu</button>
            </div>
          </form>
        )}

        {activeTab === "preferences" && (
          <div className="admin-form">
            <div className="admin-settings-toggle-row">
              <div>
                <p className="admin-settings-toggle-label">Nhận thông báo email</p>
                <p className="admin-settings-toggle-desc">Nhận email khi có đơn hàng mới</p>
              </div>
              <label className="admin-toggle">
                <input type="checkbox" defaultChecked />
                <span className="admin-toggle-slider" />
              </label>
            </div>
            <div className="admin-settings-toggle-row">
              <div>
                <p className="admin-settings-toggle-label">Thông báo trình duyệt</p>
                <p className="admin-settings-toggle-desc">Push notification trên trình duyệt</p>
              </div>
              <label className="admin-toggle">
                <input type="checkbox" />
                <span className="admin-toggle-slider" />
              </label>
            </div>
            <div className="admin-settings-toggle-row">
              <div>
                <p className="admin-settings-toggle-label">Sidebar tự động thu gọn</p>
                <p className="admin-settings-toggle-desc">Thu gọn sidebar khi màn hình nhỏ</p>
              </div>
              <label className="admin-toggle">
                <input type="checkbox" defaultChecked />
                <span className="admin-toggle-slider" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
