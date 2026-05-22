import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { api } from "../../lib/api";
import { clearAuthSessionFlag, hasAuthSessionFlag } from "@/lib/authSession";
import type { AdminUser } from "../types/admin.types";

interface AdminAuthContextValue {
  user: AdminUser | null;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  switchRole: (role: string) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      if (!hasAuthSessionFlag()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/api/v1/users/profile");
        if (!active) return;

        if (data.success && data.data) {
          const dbUser = data.data;

          const userRole = dbUser.role?.toUpperCase();
          const isAllowedRole = ["ADMIN", "SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(
            userRole || ""
          );

          if (!isAllowedRole || dbUser.isActive === false || dbUser.status === "SUSPENDED") {
            setUser(null);
          } else {
            setUser({
              id: dbUser._id || dbUser.id,
              fullName: dbUser.fullName || "Nhân viên UTE SHOP",
              email: dbUser.email ?? "",
              role: userRole ?? "",
              department:
                dbUser.role === "ADMIN"
                  ? "Ban quản lý"
                  : dbUser.role === "WAREHOUSE_STAFF"
                    ? "Kho vận"
                    : "Bán hàng",
              isActive: dbUser.isActive !== false,
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        if (active) {
          if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
            clearAuthSessionFlag();
          }
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkAuth();
    return () => {
      active = false;
    };
  }, []);

  const switchRole = (newRole: string) => {
    console.warn("switchRole to", newRole, "is disabled in production integration mode.");
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050a14",
          color: "#e2e8f0",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          className="admin-loading-spinner"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid rgba(99,102,241,0.1)",
            borderTopColor: "#6366f1",
            animation: "spin 1s linear infinite",
            marginBottom: "16px",
          }}
        />
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Đang xác thực thông tin Admin...</p>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `,
          }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "ADMIN";
  const isStaff = ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(user.role);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role: user.role,
        isAdmin,
        isStaff,
        isAuthenticated: true,
        loading: false,
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
