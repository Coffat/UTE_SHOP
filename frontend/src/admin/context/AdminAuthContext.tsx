import { createContext, useContext, useState, type ReactNode } from "react";
import type { AdminRole, AdminUser } from "../types/admin.types";

interface AdminAuthContextValue {
  user: AdminUser | null;
  role: AdminRole;
  isAdmin: boolean;
  isStaff: boolean;
  switchRole: (role: AdminRole) => void; // demo only
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Demo users – replace with real API call
const DEMO_ADMIN: AdminUser = {
  id: "u-admin-001",
  fullName: "Nguyễn Văn Thành",
  email: "admin@uteshop.vn",
  role: "admin",
  department: "Ban quản lý",
  lastActive: "Vừa xong",
  isActive: true,
};

const DEMO_STAFF: AdminUser = {
  id: "u-staff-001",
  fullName: "Trần Thị Bích",
  email: "bich.tran@uteshop.vn",
  role: "staff",
  department: "Kho vận",
  lastActive: "5 phút trước",
  isActive: true,
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser>(DEMO_ADMIN);

  const switchRole = (role: AdminRole) => {
    setUser(role === "admin" ? DEMO_ADMIN : DEMO_STAFF);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role: user.role,
        isAdmin: user.role === "admin",
        isStaff: user.role === "staff",
        switchRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
