import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";



function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}

const NOTIFICATIONS = [
  { id: 1, text: "Đơn hàng ORD-2415 cần xác nhận", time: "2 phút trước", unread: true, type: "order" },
  { id: 2, text: "Sản phẩm SP-004 hết hàng tồn kho", time: "1 giờ trước",  unread: true, type: "product" },
  { id: 3, text: "Báo cáo tháng 5 đã được tạo",     time: "3 giờ trước",  unread: false, type: "system" },
  { id: 4, text: "Nhân viên mới đã đăng ký tài khoản", time: "5 giờ trước", unread: false, type: "user" },
];

export function AdminTopbar() {
  const { user, role } = useAdminAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = 3; // Fixed to 3 based on image design

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    navigate("/login");
  }

  return (
    <header className="admin-topbar">
      {/* Left: Search box */}
      <div className="admin-topbar-left" style={{ flex: 1 }}>
        <div className="admin-search-box" style={{ width: "400px", maxWidth: "100%" }}>
          <span className="admin-search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng, sản phẩm, khách hàng..."
            className="admin-search-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <kbd className="admin-search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Right: actions */}
      <div className="admin-topbar-right">
        {/* Notifications */}
        <div className="admin-topbar-action-wrap" ref={notifsRef}>
          <button
            className="admin-icon-btn"
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="admin-notif-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div className="admin-dropdown admin-notif-dropdown">
              <div className="admin-dropdown-header">
                <span>Thông báo</span>
                <span className="admin-dropdown-header-badge">{unreadCount} mới</span>
              </div>
              <div className="admin-notif-list">
                {NOTIFICATIONS.map((n) => (
                  <div key={n.id} className={`admin-notif-item ${n.unread ? "unread" : ""}`}>
                    <div className={`admin-notif-dot ${n.type}`} />
                    <div className="admin-notif-body">
                      <p className="admin-notif-text">{n.text}</p>
                      <p className="admin-notif-time">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-dropdown-footer">
                <button className="admin-dropdown-footer-btn">Xem tất cả thông báo</button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action (Lightning) */}
        <div className="admin-topbar-action-wrap">
          <button className="admin-icon-btn">
            <LightningIcon />
          </button>
        </div>
        
        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "var(--adm-border)", margin: "0 8px" }} />

        {/* Profile */}
        <div className="admin-topbar-action-wrap" ref={profileRef}>
          <button
            className="admin-profile-btn"
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <div className="admin-topbar-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontWeight: 600 }}>
              {user?.fullName.charAt(0) ?? "A"}
            </div>
            <div className="admin-topbar-user-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
              <span className="admin-topbar-user-name" style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--adm-text)" }}>{user?.fullName ?? "Admin"}</span>
              <span className="admin-role-badge" style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                {role === "admin" ? "Quản trị viên" : "Nhân viên"}
              </span>
            </div>
            <span style={{ color: "var(--adm-text-muted)", marginLeft: "4px" }}><ChevronDown /></span>
          </button>

          {showProfile && (
            <div className="admin-dropdown admin-profile-dropdown" style={{ right: 0 }}>
              <div className="admin-dropdown-header">
                <span>{user?.email}</span>
              </div>
              <div className="admin-dropdown-menu">
                <button className="admin-dropdown-item" onClick={() => navigate("/admin/profile")}>
                  Hồ sơ cá nhân
                </button>
                {role === "admin" && (
                  <button className="admin-dropdown-item" onClick={() => navigate("/admin/settings")}>
                    Cài đặt hệ thống
                  </button>
                )}
                <hr className="admin-dropdown-divider" />
                <button className="admin-dropdown-item danger" onClick={handleLogout}>
                  <LogoutIcon />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
