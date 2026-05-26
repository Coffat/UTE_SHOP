// ─────────────────────────────────────────────
// Admin Template – Core Types & Role Definitions
// ─────────────────────────────────────────────

export type AdminRole = string;

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  lastActive?: string;
  isActive: boolean;
}

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  /** Roles that can see this nav item */
  allowedRoles: AdminRole[];
  badge?: number;
  children?: NavItem[];
}

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  change: number; // percent
  changeLabel: string;
  icon: string;
  color: "indigo" | "emerald" | "amber" | "rose" | "purple";
}

export interface OrderItem {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  image?: string;
  sales: number;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  department: string;
  isActive: boolean;
  lastActive: string;
  tasksCompleted: number;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  isActive: boolean;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "order" | "product" | "user" | "system";
}

export const STAFF_ROLES = ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const ADMIN_PERMISSIONS = [
  "dashboard.full",
  "users.view", "users.create", "users.edit", "users.delete",
  "staff.view", "staff.create", "staff.edit", "staff.delete",
  "products.view", "products.create", "products.edit", "products.delete",
  "orders.view", "orders.edit", "orders.delete",
  "reports.view",
  "settings.view", "settings.edit",
  "profile.view", "profile.edit",
] as const;

const STAFF_PERMISSIONS = [
  "dashboard.limited",
  "products.view", "products.edit",
  "orders.view", "orders.edit",
  "profile.view", "profile.edit",
] as const;

// Permission matrix per real DB role
export const PERMISSIONS: Record<string, readonly string[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  SALES: STAFF_PERMISSIONS,
  STORE_STAFF: STAFF_PERMISSIONS,
  WAREHOUSE_STAFF: STAFF_PERMISSIONS,
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const normalized = role?.toUpperCase();
  return PERMISSIONS[normalized]?.includes(permission) ?? false;
}
