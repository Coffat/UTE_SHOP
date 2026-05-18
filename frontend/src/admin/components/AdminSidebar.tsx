import { useLocation, NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { NavItem, AdminRole } from "../types/admin.types";

// ── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    icon: "",
    path: "/admin/dashboard",
    allowedRoles: ["admin", "staff"],
  },
  {
    key: "orders",
    label: "Đơn hàng",
    icon: "",
    path: "/admin/orders",
    allowedRoles: ["admin", "staff"],
    badge: 8,
  },
  {
    key: "products",
    label: "Sản phẩm",
    icon: "",
    path: "/admin/products",
    allowedRoles: ["admin", "staff"],
  },
  {
    key: "customers",
    label: "Khách hàng",
    icon: "",
    path: "/admin/customers",
    allowedRoles: ["admin"],
  },
  {
    key: "staff",
    label: "Nhân viên",
    icon: "",
    path: "/admin/staff",
    allowedRoles: ["admin"],
  },
  {
    key: "reports",
    label: "Báo cáo",
    icon: "",
    path: "/admin/reports",
    allowedRoles: ["admin"],
  },
  {
    key: "settings",
    label: "Cài đặt",
    icon: "",
    path: "/admin/settings",
    allowedRoles: ["admin"],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    key: "profile",
    label: "Hồ sơ",
    icon: "",
    path: "/admin/profile",
    allowedRoles: ["admin", "staff"],
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: "",
    path: "/login",
    allowedRoles: ["admin", "staff"],
  },
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconOrders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  );
}
function IconProducts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
function IconCustomers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconStaff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
function IconReports() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <path d="M2 20h20" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconCollapse({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const ICONS: Record<string, React.FC> = {
  dashboard: IconDashboard,
  orders:    IconOrders,
  products:  IconProducts,
  customers: IconCustomers,
  staff:     IconStaff,
  reports:   IconReports,
  settings:  IconSettings,
  profile:   IconProfile,
  logout:    IconLogout,
};

function getIcon(key: string) {
  const Comp = ICONS[key];
  return Comp ? <Comp /> : null;
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const { user, role, isAdmin, switchRole } = useAdminAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(role as AdminRole)
  );

  return (
    <aside
      className="admin-sidebar"
      style={{ width: collapsed ? "72px" : "240px" }}
    >
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        {!collapsed && (
          <div className="admin-sidebar-logo-text">
            <span className="admin-logo-brand">UTE</span>
            <span className="admin-logo-sub">SHOP</span>
          </div>
        )}
      </div>

      {/* Role switcher (demo) */}
      {!collapsed && (
        <div className="admin-role-switcher">
          <button
            className={`admin-role-btn ${isAdmin ? "active" : ""}`}
            onClick={() => switchRole("admin")}
          >
            Admin
          </button>
          <button
            className={`admin-role-btn ${!isAdmin ? "active" : ""}`}
            onClick={() => switchRole("staff")}
          >
            Staff
          </button>
        </div>
      )}

      {/* Nav section label */}
      {!collapsed && (
        <p className="admin-nav-section-label">MENU CHÍNH</p>
      )}

      {/* Navigation */}
      <nav className="admin-nav">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="admin-nav-icon">{getIcon(item.key)}</span>
              {!collapsed && (
                <>
                  <span className="admin-nav-label">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="admin-nav-badge">{item.badge}</span>
                  ) : null}
                </>
              )}
              {collapsed && item.badge && item.badge > 0 ? (
                <span className="admin-nav-badge-dot" />
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom items */}
      {!collapsed && <p className="admin-nav-section-label">TÀI KHOẢN</p>}
      <nav className="admin-nav admin-nav-bottom">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="admin-nav-icon">{getIcon(item.key)}</span>
              {!collapsed && <span className="admin-nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">
            {user.fullName.charAt(0)}
          </div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-user-name">{user.fullName}</p>
            <p className="admin-sidebar-user-role">
              {role === "admin" ? "Quản trị viên" : "Nhân viên"} · {user.department}
            </p>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button className="admin-sidebar-collapse-btn" onClick={onToggle} title="Thu gọn sidebar">
        <IconCollapse collapsed={collapsed} />
      </button>
    </aside>
  );
}
