import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { getAvatarInitial, getDisplayName } from "@/lib/userDisplay";
import { FormField, FormInput, FormTextarea } from "../components/AdminUI";
import {
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
} from "../services/adminProfile.api";

export function ProfilePage() {
  const { user, role } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "preferences">("profile");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUserProfile()
      .then((profile) => {
        if (cancelled) return;
        setFullName(profile.fullName ?? user?.fullName ?? "");
        setEmail(profile.email ?? user?.email ?? "");
        setPhone(profile.phone ?? "");
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        if (!cancelled) {
          setFullName(user?.fullName ?? "");
          setEmail(user?.email ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.fullName]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Không thể lưu thông tin cá nhân.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSaving(true);
    try {
      await changeUserPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Không thể đổi mật khẩu.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const displayName = fullName || getDisplayName(user);

  return (
    <div className="admin-profile-layout">
      <div className="admin-profile-card">
        <div className="admin-profile-avatar-wrap">
          <div className="admin-profile-avatar-lg">
            {getAvatarInitial(displayName)}
          </div>
          <button type="button" className="admin-profile-avatar-change" disabled>
            Đổi ảnh
          </button>
        </div>
        <div className="admin-profile-info">
          <h2 className="admin-profile-name">{displayName}</h2>
          <p className="admin-profile-email">{email || user.email}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span className={`admin-role-badge ${role === "ADMIN" ? "admin" : "staff"}`}>
              {role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
            </span>
            {user.department && (
              <span className="admin-category-tag">{user.department}</span>
            )}
          </div>
        </div>
        <div className="admin-profile-meta">
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">—</p>
            <p className="admin-profile-meta-lbl">Thống kê</p>
          </div>
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">—</p>
            <p className="admin-profile-meta-lbl">Đơn xử lý</p>
          </div>
          <div className="admin-profile-meta-item">
            <p className="admin-profile-meta-val">—</p>
            <p className="admin-profile-meta-lbl">Hiệu suất</p>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-tabs" style={{ marginBottom: "24px" }}>
          <button
            type="button"
            className={`admin-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Đổi mật khẩu
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            Tùy chỉnh
          </button>
        </div>

        {saved && (
          <div className="admin-toast admin-toast-success">
            ✓ Đã lưu thay đổi thành công!
          </div>
        )}
        {error && (
          <div className="admin-toast" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}>
            {error}
          </div>
        )}

        {activeTab === "profile" && (
          <form className="admin-form" onSubmit={handleProfileSave}>
            {loading ? (
              <p style={{ color: "#94a3b8" }}>Đang tải thông tin...</p>
            ) : (
              <>
                <div className="admin-form-row">
                  <FormField label="Họ và tên" required>
                    <FormInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </FormField>
                  <FormField label="Email" required>
                    <FormInput type="email" value={email} disabled />
                  </FormField>
                </div>
                <div className="admin-form-row">
                  <FormField label="Số điện thoại">
                    <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </FormField>
                  <FormField label="Phòng ban">
                    <FormInput defaultValue={user.department} disabled={role !== "ADMIN"} />
                  </FormField>
                </div>
                <FormField label="Giới thiệu bản thân">
                  <FormTextarea placeholder="Nhập thông tin giới thiệu..." disabled />
                </FormField>
                <div className="admin-form-actions">
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {activeTab === "password" && (
          <form className="admin-form" onSubmit={handlePasswordSave}>
            <FormField label="Mật khẩu hiện tại" required>
              <FormInput
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="Mật khẩu mới" required>
              <FormInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="Xác nhận mật khẩu mới" required>
              <FormInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <div className="admin-password-requirements">
              <p className="admin-password-req-title">Yêu cầu mật khẩu:</p>
              <ul>
                <li>✓ Tối thiểu 8 ký tự</li>
                <li>✓ Có ít nhất 1 chữ hoa</li>
                <li>✓ Có ít nhất 1 số</li>
              </ul>
            </div>
            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving}
              >
                {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
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
