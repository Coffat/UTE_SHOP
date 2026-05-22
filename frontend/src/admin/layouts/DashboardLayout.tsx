import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { AdminTopbar } from "../components/AdminTopbar";
import "../admin.css";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-root">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="admin-content-area">
        <AdminTopbar />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
