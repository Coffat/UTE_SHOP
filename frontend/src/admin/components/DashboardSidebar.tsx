import { useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { getAvatarInitial, getDisplayName } from "@/lib/userDisplay";
import type { NavItem } from "../types/admin.types";

// ── Nav configs ──────────────────────────────────────────────────────────────
const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    icon: "",
    path: "/admin/dashboard",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "orders",
    label: "Đơn hàng",
    icon: "",
    path: "/admin/orders",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "chat",
    label: "CSKH Chat",
    icon: "",
    path: "/admin/chat",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "products",
    label: "Sản phẩm",
    icon: "",
    path: "/admin/products",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "categories",
    label: "Danh mục",
    icon: "",
    path: "/admin/categories",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "customers",
    label: "Khách hàng",
    icon: "",
    path: "/admin/customers",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "staff",
    label: "Nhân viên",
    icon: "",
    path: "/admin/staff",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "blogs",
    label: "Tin tức",
    icon: "",
    path: "/admin/blogs",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "reviews",
    label: "Đánh giá",
    icon: "",
    path: "/admin/reviews",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "",
    path: "/admin/marketing",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "reports",
    label: "Báo cáo",
    icon: "",
    path: "/admin/reports",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "settings",
    label: "Cài đặt",
    icon: "",
    path: "/admin/settings",
    allowedRoles: ["ADMIN"],
  },
];

const WAREHOUSE_NAV_ITEMS: NavItem[] = [
  {
    key: "wh-dashboard",
    label: "Tổng quan kho",
    icon: "",
    path: "/warehouse/dashboard",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "wh-stock",
    label: "Tồn kho",
    icon: "",
    path: "/warehouse/stock",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "wh-import",
    label: "Nhập kho",
    icon: "",
    path: "/warehouse/import",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "wh-recipes",
    label: "Công thức (BOM)",
    icon: "",
    path: "/warehouse/recipes",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "wh-transactions",
    label: "Lịch sử GD",
    icon: "",
    path: "/warehouse/transactions",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
];

const WAREHOUSE_BOTTOM_ITEMS: NavItem[] = [
  {
    key: "profile",
    label: "Hồ sơ",
    icon: "",
    path: "/warehouse/profile",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: "",
    path: "/login",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
];

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    key: "orders",
    label: "Đơn hàng",
    icon: "",
    path: "/staff/orders",
    allowedRoles: ["SALES", "STORE_STAFF"],
  },
  {
    key: "chat",
    label: "CSKH Chat",
    icon: "",
    path: "/staff/chat",
    allowedRoles: ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"],
  },
  {
    key: "products",
    label: "Sản phẩm",
    icon: "",
    path: "/staff/products",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "categories",
    label: "Danh mục",
    icon: "",
    path: "/staff/categories",
    allowedRoles: ["WAREHOUSE_STAFF"],
  },
  {
    key: "blogs",
    label: "Tin tức",
    icon: "",
    path: "/staff/blogs",
    allowedRoles: ["SALES"],
  },
  {
    key: "reviews",
    label: "Đánh giá",
    icon: "",
    path: "/staff/reviews",
    allowedRoles: ["SALES"],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "",
    path: "/staff/marketing",
    allowedRoles: ["SALES"],
  },
];

const ADMIN_BOTTOM_ITEMS: NavItem[] = [
  {
    key: "profile",
    label: "Hồ sơ",
    icon: "",
    path: "/admin/profile",
    allowedRoles: ["ADMIN"],
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: "",
    path: "/login",
    allowedRoles: ["ADMIN"],
  },
];

const STAFF_BOTTOM_ITEMS: NavItem[] = [
  {
    key: "profile",
    label: "Hồ sơ",
    icon: "",
    path: "/staff/profile",
    allowedRoles: ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"],
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: "",
    path: "/login",
    allowedRoles: ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"],
  },
];

const STORE_STAFF_NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    icon: "",
    path: "/store/dashboard",
    allowedRoles: ["STORE_STAFF"],
  },
  {
    key: "orders",
    label: "Đơn hàng",
    icon: "",
    path: "/store/orders",
    allowedRoles: ["STORE_STAFF"],
  },
  {
    key: "create-order",
    label: "Tạo đơn",
    icon: "",
    path: "/store/orders/create",
    allowedRoles: ["STORE_STAFF"],
  },
];

const STORE_STAFF_BOTTOM_ITEMS: NavItem[] = [
  {
    key: "profile",
    label: "Hồ sơ",
    icon: "",
    path: "/store/profile",
    allowedRoles: ["STORE_STAFF"],
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: "",
    path: "/login",
    allowedRoles: ["STORE_STAFF"],
  },
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconWarehouse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/>
      <path d="M6 18h12M6 14h12"/>
      <rect x="9" y="18" width="6" height="4"/>
    </svg>
  );
}
function IconImport() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}
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
function IconCategories() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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
function IconBlogs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M16 8h2M16 12h2M16 16h2M6 8h6v8H6z" />
    </svg>
  );
}
function IconReviews() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7l1.09 2.26 2.49.36-1.8 1.76.42 2.48-2.2-1.16-2.2 1.16.42-2.48-1.8-1.76 2.49-.36L12 7z" />
    </svg>
  );
}
function IconMarketing() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

const ICONS: Record<string, React.FC<any>> = {
  dashboard: IconDashboard,
  orders:    IconOrders,
  products:  IconProducts,
  categories: IconCategories,
  customers: IconCustomers,
  staff:     IconStaff,
  reports:   IconReports,
  settings:  IconSettings,
  profile:   IconProfile,
  logout:    IconLogout,
  blogs:     IconBlogs,
  reviews:   IconReviews,
  marketing: IconMarketing,
  chat:      IconChat,
  "create-order": IconOrders,
  "wh-dashboard":    IconWarehouse,
  "wh-stock":        IconProducts,
  "wh-import":       IconImport,
  "wh-transactions": IconHistory,
  "wh-recipes":      IconCategories, // Just use Categories icon for now (or another suitable one)
};

function getIcon(key: string) {
  const Comp = ICONS[key];
  return Comp ? <Comp /> : null;
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const { user, role } = useAdminAuth();
  const location = useLocation();

  const isWarehouse = role === "WAREHOUSE_STAFF";
  const isStore = role === "STORE_STAFF";
  const navItems = role === "ADMIN" ? ADMIN_NAV_ITEMS : isWarehouse ? WAREHOUSE_NAV_ITEMS : isStore ? STORE_STAFF_NAV_ITEMS : STAFF_NAV_ITEMS;
  const bottomItems = role === "ADMIN" ? ADMIN_BOTTOM_ITEMS : isWarehouse ? WAREHOUSE_BOTTOM_ITEMS : isStore ? STORE_STAFF_BOTTOM_ITEMS : STAFF_BOTTOM_ITEMS;

  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(role));

  const visibleBottomItems = bottomItems.filter((item) =>
    item.allowedRoles.includes(role)
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

      {/* Nav section label */}
      {!collapsed && (
        <p className="admin-nav-section-label">MENU CHÍNH</p>
      )}

      {/* Navigation */}
      <nav className="admin-nav">
        {visibleItems.map((item) => {
          // Direct comparison or startsWith logic to determine active item
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
        {visibleBottomItems.map((item) => {
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
            {getAvatarInitial(getDisplayName(user))}
          </div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-user-name">{user.fullName}</p>
            <p className="admin-sidebar-user-role">
              {role === "ADMIN" ? "Quản trị viên" : "Nhân viên"} · {user.department}
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
