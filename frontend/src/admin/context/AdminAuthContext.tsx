import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { AdminRole, AdminUser } from "../types/admin.types";

interface AdminAuthContextValue {
  user: AdminUser | null;
  role: AdminRole;
  isAdmin: boolean;
  isStaff: boolean;
  switchRole: (role: AdminRole) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const { data } = await api.get("/api/v1/users/profile");
        if (!active) return;
        
        if (data.success && data.data) {
          const dbUser = data.data;
          
          // Map backend roles to frontend admin roles
          let mappedRole: AdminRole | null = null;
          if (dbUser.role === "ADMIN") {
            mappedRole = "admin";
          } else if (["SALES", "WAREHOUSE_STAFF", "STORE_STAFF"].includes(dbUser.role)) {
            mappedRole = "staff";
          }

          // If the user does not have permission, or is suspended/inactive
          if (!mappedRole || dbUser.isActive === false || dbUser.status === "SUSPENDED") {
            setUser(null);
          } else {
            setUser({
              id: dbUser._id || dbUser.id,
              fullName: dbUser.fullName || "Nhân viên UTE SHOP",
              email: dbUser.email,
              role: mappedRole,
              department: dbUser.role === "ADMIN" ? "Ban quản lý" : (dbUser.role === "WAREHOUSE_STAFF" ? "Kho vận" : "Bán hàng"),
              isActive: dbUser.isActive !== false,
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  const switchRole = (newRole: AdminRole) => {
    // switchRole is kept as a dummy or no-op so that it doesn't break any references
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
          fontFamily: "'DM Sans', sans-serif"
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
            marginBottom: "16px"
          }}
        />
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Đang xác thực thông tin Admin...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // If not authenticated or mapped as not allowed, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

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

