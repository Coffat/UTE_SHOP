import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAdminAuth();

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
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Đang xác thực quyền truy cập...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
