import { useState } from "react";
import { FormField, FormInput, FormSelect, FormTextarea } from "../components/AdminUI";

const SETTING_SECTIONS = [
  { key: "general",   label: "Thông tin chung",      icon: "🏪" },
  { key: "payment",   label: "Thanh toán",            icon: "💳" },
  { key: "shipping",  label: "Vận chuyển",            icon: "🚚" },
  { key: "email",     label: "Email & Thông báo",     icon: "📧" },
  { key: "security",  label: "Bảo mật",               icon: "🔒" },
  { key: "backup",    label: "Sao lưu & Khôi phục",  icon: "🗄️" },
];

function GeneralSettings() {
  return (
    <div className="admin-settings-section">
      <div className="admin-settings-section-header">
        <h3>Thông tin cửa hàng</h3>
        <p>Cấu hình thông tin cơ bản của UTESHOP</p>
      </div>
      <div className="admin-form admin-settings-form">
        <FormField label="Tên cửa hàng" required>
          <FormInput defaultValue="UTESHOP - Shop Hoa Tươi" />
        </FormField>
        <FormField label="Mô tả ngắn">
          <FormTextarea defaultValue="Cửa hàng hoa tươi cao cấp – giao hàng nhanh toàn TP.HCM" />
        </FormField>
        <div className="admin-form-row">
          <FormField label="Số điện thoại">
            <FormInput defaultValue="028 1234 5678" />
          </FormField>
          <FormField label="Email liên hệ">
            <FormInput type="email" defaultValue="contact@uteshop.vn" />
          </FormField>
        </div>
        <FormField label="Địa chỉ">
          <FormInput defaultValue="123 Đường ABC, Quận 1, TP.HCM" />
        </FormField>
        <FormField label="Múi giờ">
          <FormSelect defaultValue="Asia/Ho_Chi_Minh">
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
            <option value="UTC">UTC</option>
          </FormSelect>
        </FormField>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-primary">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="admin-settings-section">
      <div className="admin-settings-section-header">
        <h3>Bảo mật hệ thống</h3>
        <p>Cấu hình xác thực và chính sách mật khẩu</p>
      </div>
      <div className="admin-form admin-settings-form">
        <div className="admin-settings-toggle-row">
          <div>
            <p className="admin-settings-toggle-label">Xác thực 2 yếu tố (2FA)</p>
            <p className="admin-settings-toggle-desc">Yêu cầu OTP khi đăng nhập Admin</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" defaultChecked />
            <span className="admin-toggle-slider" />
          </label>
        </div>
        <div className="admin-settings-toggle-row">
          <div>
            <p className="admin-settings-toggle-label">Khóa tài khoản sau 5 lần nhập sai</p>
            <p className="admin-settings-toggle-desc">Tự động khóa nếu đăng nhập thất bại liên tiếp</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" defaultChecked />
            <span className="admin-toggle-slider" />
          </label>
        </div>
        <div className="admin-settings-toggle-row">
          <div>
            <p className="admin-settings-toggle-label">Phiên đăng nhập tự động hết hạn</p>
            <p className="admin-settings-toggle-desc">Đăng xuất sau 8 giờ không hoạt động</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" />
            <span className="admin-toggle-slider" />
          </label>
        </div>
        <FormField label="Độ dài mật khẩu tối thiểu">
          <FormInput type="number" defaultValue={8} min={6} max={32} />
        </FormField>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-primary">Lưu cài đặt bảo mật</button>
        </div>
      </div>
    </div>
  );
}

const SECTION_COMPONENTS: Record<string, React.FC> = {
  general:  GeneralSettings,
  security: SecuritySettings,
};

function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="admin-settings-section">
      <div className="admin-settings-section-header">
        <h3>{label}</h3>
        <p>Cấu hình {label.toLowerCase()} của hệ thống</p>
      </div>
      <div className="admin-settings-placeholder">
        <span style={{ fontSize: "48px" }}>🚧</span>
        <p>Tính năng đang được phát triển</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const section = SETTING_SECTIONS.find((s) => s.key === activeSection);
  const SectionComp = SECTION_COMPONENTS[activeSection];

  return (
    <div className="admin-settings-layout">
      {/* Sidebar nav */}
      <nav className="admin-settings-nav">
        {SETTING_SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`admin-settings-nav-item ${activeSection === s.key ? "active" : ""}`}
            onClick={() => setActiveSection(s.key)}
          >
            <span className="admin-settings-nav-icon">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="admin-settings-content">
        {SectionComp ? (
          <SectionComp />
        ) : (
          <PlaceholderSection label={section?.label ?? ""} />
        )}
      </div>
    </div>
  );
}
