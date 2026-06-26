import { useState, useEffect, useRef } from "react";
import { useConfirm, CrudModal, FormField, FormInput, FormSelect } from "../components/AdminUI";
import { StatCardWidget } from "../components/StatCard";
import {
  fetchStaffList,
  fetchShifts,
  fetchStaffActivities,
  createShift,
  updateShift,
  cancelShift,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "../services/adminStaff.api";

interface ExtendedStaffMember {
  id: string;
  fullName: string;
  role: string; // "Admin" | "Staff" | "Quản lý ca" | "Kho vận"
  email: string;
  phone: string;
  status: "Đang hoạt động" | "Nghỉ phép" | "Tạm nghỉ";
  performance: number; // 0-100
  avatarBg: string; // gradient string
  avatarText: string;
  avatarUrl?: string;
}

const mapBackendUserToStaff = (u: any): ExtendedStaffMember => {
  const roleMap: Record<string, string> = {
    ADMIN: "Admin",
    SALES: "Staff",
    STORE_STAFF: "Quản lý ca",
    WAREHOUSE_STAFF: "Kho vận",
  };
  const statusMap: Record<string, "Đang hoạt động" | "Nghỉ phép" | "Tạm nghỉ"> = {
    ACTIVE: "Đang hoạt động",
    ON_LEAVE: "Nghỉ phép",
    SUSPENDED: "Tạm nghỉ",
  };

  const initials = (u.fullName || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase() || "NV";

  const gradients = [
    "linear-gradient(135deg, #f59e0b, #d97706)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #10b981, #047857)",
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "linear-gradient(135deg, #6366f1, #4338ca)",
  ];
  const charSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarBg = gradients[charSum % gradients.length];

  return {
    id: u._id || u.id,
    fullName: u.fullName || "",
    email: u.email || "",
    phone: u.phone || "",
    role: roleMap[u.role] || "Staff",
    status: statusMap[u.status] || "Đang hoạt động",
    performance: u.performanceScore ?? 100,
    avatarBg,
    avatarText: initials,
    avatarUrl: u.avatar || "",
  };
};

const mapFrontendRoleToBackend = (r: string): string => {
  const map: Record<string, string> = {
    "Admin": "ADMIN",
    "Staff": "SALES",
    "Quản lý ca": "STORE_STAFF",
    "Kho vận": "WAREHOUSE_STAFF",
  };
  return map[r] || "SALES";
};

const mapFrontendStatusToBackend = (s: string): string => {
  const map: Record<string, string> = {
    "Đang hoạt động": "ACTIVE",
    "Nghỉ phép": "ON_LEAVE",
    "Tạm nghỉ": "SUSPENDED",
  };
  return map[s] || "ACTIVE";
};

const mapActivityActionLabel = (action: string, resourceType: string) => {
  if (action === "UPDATE_STATUS" && resourceType === "Order") return "Cập nhật trạng thái đơn";
  if (action === "CREATE") return "Tạo dữ liệu mới";
  if (action === "UPDATE") return "Cập nhật dữ liệu";
  if (action === "DELETE") return "Xóa dữ liệu";
  return action;
};

export function StaffPage() {
  const [staffList, setStaffList] = useState<ExtendedStaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(100);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<ExtendedStaffMember | null>(null);
  const { confirm, ModalEl } = useConfirm();

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("Staff");
  const [formStatus, setFormStatus] = useState<"Đang hoạt động" | "Nghỉ phép" | "Tạm nghỉ">("Đang hoạt động");
  const [formPerformance, setFormPerformance] = useState(85);
  const [formAvatar, setFormAvatar] = useState<File | null>(null);
  const [formPassword, setFormPassword] = useState("");

  const itemsPerPage = 6;
  const staffListRequestRef = useRef(0);
  const statsRequestRef = useRef(0);

  const STAFF_STATS_PAGE = 1;
  const STAFF_STATS_LIMIT = 100;

  // Load staff list dynamically
  const fetchStaffData = async () => {
    const requestId = ++staffListRequestRef.current;
    try {
      setLoading(true);
      const queryParams: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (search.trim()) {
        queryParams.search = search.trim();
      }
      if (roleFilter !== "All") {
        queryParams.role = mapFrontendRoleToBackend(roleFilter);
      }
      if (statusFilter !== "All") {
        queryParams.status = mapFrontendStatusToBackend(statusFilter);
      }

      const result = await fetchStaffList(queryParams);
      if (requestId !== staffListRequestRef.current) return;
      setStaffList((result.items as Parameters<typeof mapBackendUserToStaff>[0][]).map(mapBackendUserToStaff));
      setTotalPages(result.meta.pages);
    } catch (error) {
      if (requestId === staffListRequestRef.current) {
        console.error("Failed to load staff list:", error);
      }
    } finally {
      if (requestId === staffListRequestRef.current) {
        setLoading(false);
      }
    }
  };

  // Load stats and shifts dynamically (limit max 100 per backend validation)
  const fetchStatsAndShifts = async () => {
    const requestId = ++statsRequestRef.current;

    const results = await Promise.allSettled([
      fetchStaffList({
        page: STAFF_STATS_PAGE,
        limit: STAFF_STATS_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      fetchStaffList({ page: 1, limit: 1, status: "ACTIVE" }),
      fetchShifts(),
      fetchStaffActivities(8),
    ]);

    if (requestId !== statsRequestRef.current) return;

    const [staffSampleResult, staffActiveResult, shiftResult, activityResult] = results;

    if (staffSampleResult.status === "fulfilled") {
      const data = staffSampleResult.value;
      const items = (data.items ?? []) as { performanceScore?: number }[];
      const total = data.meta?.total ?? items.length;
      const avg =
        items.length > 0
          ? Math.round(
              (items.reduce((sum, s) => sum + (s.performanceScore ?? 100), 0) / items.length) * 10
            ) / 10
          : 0;
      setTotalCount(total);
      setAvgPerformance(avg);
    } else {
      console.error("Failed to load staff stats sample:", staffSampleResult.reason);
    }

    if (staffActiveResult.status === "fulfilled") {
      setActiveCount(staffActiveResult.value.meta?.total ?? 0);
    } else {
      console.error("Failed to load active staff count:", staffActiveResult.reason);
    }

    if (shiftResult.status === "fulfilled") {
      const shiftData = shiftResult.value;
      if (Array.isArray(shiftData)) {
        type ShiftRow = {
          _id?: string;
          id?: string;
          title?: string;
          startTime?: string;
          endTime?: string;
          color?: string;
          bg?: string;
          assignedStaff?: { fullName?: string }[];
        };
        const mappedShifts = (shiftData as ShiftRow[]).map((s) => {
          const shiftColor = s.color || "#10b981";
          const shiftBg = s.bg || "rgba(16,185,129,0.12)";
          const assigned = s.assignedStaff ?? [];

          return {
            id: s._id || s.id,
            title: s.title || "Ca trực",
            time: `${s.startTime} - ${s.endTime}`,
            count: assigned.length,
            color: shiftColor,
            bg: shiftBg,
            staff: assigned.map((staff) => staff.fullName).filter(Boolean).join(", ") || "Chưa phân công",
            subtext: assigned.length > 3 ? `... và ${assigned.length - 3} nhân viên khác` : "",
          };
        });
        setShifts(mappedShifts);
      }
    } else {
      console.error("Failed to load shifts:", shiftResult.reason);
    }

    if (activityResult.status === "fulfilled") {
      const roleMap: Record<string, string> = {
        ADMIN: "Admin",
        SALES: "Staff",
        STORE_STAFF: "Quản lý ca",
        WAREHOUSE_STAFF: "Kho vận",
      };
      const activityLogs = activityResult.value.map((activity) => {
        const initials = (activity.fullName || "NV")
          .split(" ")
          .map((n: string) => n[0])
          .slice(-2)
          .join("")
          .toUpperCase() || "NV";
        return {
          name: activity.fullName,
          role: roleMap[activity.role] || activity.role,
          action: mapActivityActionLabel(activity.action, activity.resourceType),
          device: activity.resourceType,
          time: new Date(activity.createdAt).toLocaleString("vi-VN"),
          active: activity.isActive,
          initials,
          avatarBg: "linear-gradient(135deg, #6366f1, #4f46e5)",
        };
      });
      setLoginLogs(activityLogs);
    } else {
      console.error("Failed to load staff activities:", activityResult.reason);
      setLoginLogs([]);
    }
  };

  useEffect(() => {
    void fetchStaffData();
    return () => {
      staffListRequestRef.current += 1;
    };
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    void fetchStatsAndShifts();
    return () => {
      statsRequestRef.current += 1;
    };
  }, []);

  // Set local dummy objects for backward compatible UI calculations without rewriting standard JSX
  const paginatedList = staffList;
  const filteredList = { length: totalCount };

  const roleDistribution = staffList.reduce((acc, curr) => {
    const r = curr.role;
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleOpenAdd = () => {
    setEditStaff(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("Staff");
    setFormStatus("Đang hoạt động");
    setFormPerformance(85);
    setFormAvatar(null);
    setFormPassword("");
    setSlideoverOpen(true);
  };

  const handleOpenEdit = (s: ExtendedStaffMember) => {
    setEditStaff(s);
    setFormName(s.fullName);
    setFormEmail(s.email);
    setFormPhone(s.phone);
    setFormRole(s.role);
    setFormStatus(s.status);
    setFormPerformance(s.performance);
    setFormAvatar(null);
    setFormPassword("");
    setSlideoverOpen(true);
  };

  const handleDelete = async (s: ExtendedStaffMember) => {
    const accepted = await confirm({
      title: "Xóa nhân viên",
      message: `Bạn có chắc chắn muốn xóa nhân viên "${s.fullName}" (Mã NV: ${s.id}) khỏi hệ thống? Hành động này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa nhân viên",
    });
    if (accepted) {
      try {
        await deleteStaffMember(s.id);
        fetchStaffData();
        fetchStatsAndShifts();
      } catch (error: any) {
        alert(error.response?.data?.message || "Không thể xóa nhân sự");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    if (!editStaff && !formPassword.trim()) {
      alert("Vui lòng nhập mật khẩu khởi tạo cho nhân viên.");
      return;
    }

    try {
      let payload: any;
      if (formAvatar) {
        payload = new FormData();
        payload.append("fullName", formName);
        payload.append("email", formEmail);
        if (formPhone) payload.append("phone", formPhone);
        payload.append("status", mapFrontendStatusToBackend(formStatus));
        payload.append("performanceScore", formPerformance.toString());
        payload.append("avatar", formAvatar);
        
        if (!editStaff) {
          payload.append("role", mapFrontendRoleToBackend(formRole));
          payload.append("password", formPassword);
        }
      } else {
        payload = {
          fullName: formName,
          email: formEmail,
          phone: formPhone || null,
          status: mapFrontendStatusToBackend(formStatus),
          performanceScore: Number(formPerformance),
        };
        if (!editStaff) {
          payload.role = mapFrontendRoleToBackend(formRole);
          payload.password = formPassword;
        }
      }

      if (editStaff) {
        await updateStaffMember(editStaff.id, payload);
      } else {
        await createStaffMember(payload);
      }
      setSlideoverOpen(false);
      fetchStaffData();
      fetchStatsAndShifts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
    }
  };

  const handleCreateShift = async () => {
    const title = window.prompt("Tên ca trực", "Ca sáng");
    if (!title) return;
    const date = window.prompt("Ngày (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!date) return;
    const startTime = window.prompt("Giờ bắt đầu (HH:mm)", "08:00");
    if (!startTime) return;
    const endTime = window.prompt("Giờ kết thúc (HH:mm)", "12:00");
    if (!endTime) return;
    const assignedStaff = staffList.slice(0, 1).map((staff) => staff.id);
    if (!assignedStaff.length) {
      alert("Chưa có nhân viên để phân ca.");
      return;
    }

    try {
      await createShift({
        title,
        date,
        startTime,
        endTime,
        assignedStaff,
      });
      await fetchStatsAndShifts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể tạo ca trực");
    }
  };

  const handleEditShift = async (shift: any) => {
    const title = window.prompt("Cập nhật tên ca", shift.title);
    if (!title) return;
    try {
      await updateShift(shift.id, { title });
      await fetchStatsAndShifts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể cập nhật ca trực");
    }
  };

  const handleCancelShift = async (shift: any) => {
    const accepted = await confirm({
      title: "Hủy ca trực",
      message: `Bạn có chắc muốn hủy ca "${shift.title}"?`,
      variant: "danger",
      confirmLabel: "Hủy ca",
    });
    if (!accepted) return;
    try {
      await cancelShift(shift.id);
      await fetchStatsAndShifts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể hủy ca trực");
    }
  };

  const statCards = [
    {
      id: "staff-total",
      label: "Tổng nhân viên",
      value: totalCount,
      change: 0,
      changeLabel: "dữ liệu realtime",
      icon: "users",
      color: "indigo" as const,
      tooltip: "Tổng số nhân sự trong hệ thống",
      sparklinePoints: "M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    },
    {
      id: "staff-active",
      label: "Đang hoạt động",
      value: activeCount,
      change: 0,
      changeLabel: "dữ liệu realtime",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M22 9l-3 3-2-2" />
        </svg>
      ),
      color: "emerald" as const,
      tooltip: "Nhân sự đang hoạt động bình thường",
      sparklinePoints: "M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16",
    },
    {
      id: "staff-shifts",
      label: "Ca hôm nay",
      value: shifts.length,
      change: 0,
      changeLabel: "dữ liệu realtime",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Tổng số ca trực trong ngày",
      sparklinePoints: "M2 20L12 10L22 24L32 12L44 26L56 16L68 22L76 8",
    },
    {
      id: "staff-perf",
      label: "Hiệu suất trung bình",
      value: `${avgPerformance}%`,
      change: 0,
      changeLabel: "dữ liệu realtime",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Hiệu suất đánh giá KPI trung bình của tất cả nhân viên",
      sparklinePoints: "M2 22L12 26L22 14L32 18L44 8L56 24L68 12L76 16",
    },
  ];

  return (
    <div className="admin-page">
      {ModalEl}

      {/* Top Header Bar */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Nhân viên</h2>
          <p className="admin-page-subtitle">
            Quản lý nhân sự, quyền hạn và hiệu suất làm việc
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleOpenAdd}
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "13.5px",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          + Thêm nhân viên
        </button>
      </div>

      {/* Standardized Stats Row */}
      <div
        className="admin-stats-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {statCards.map((card) => (
          <StatCardWidget key={card.id} card={card} />
        ))}
      </div>

      {/* Main Grid layout splits into 2 Columns: Table Widgets (70%) and Timelines/Schedule Widgets (30%) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Left Bento Column (Table + Log Widgets) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
          {/* Card 1: Danh sách nhân viên */}
          <div
            className="admin-card"
            style={{
              padding: "24px",
              background: "rgba(13, 21, 38, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--adm-border)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Danh sách nhân viên</h3>
            </div>

            {/* Toolbar Filters Row */}
            <div
              className="admin-page-toolbar"
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "20px",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              {/* Search box */}
              <div className="admin-search-box" style={{ flex: 1, minWidth: "220px", background: "rgba(255,255,255,0.03)" }}>
                <span className="admin-search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  className="admin-search-input"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", background: "transparent" }}
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-form-select"
                style={{
                  width: "140px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--adm-border)",
                  color: "#e2e8f0",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  height: "38px",
                  cursor: "pointer",
                }}
              >
                <option value="All" style={{ background: "#0d1526" }}>Tất cả vai trò</option>
                <option value="Admin" style={{ background: "#0d1526" }}>Admin</option>
                <option value="Staff" style={{ background: "#0d1526" }}>Staff</option>
                <option value="Quản lý ca" style={{ background: "#0d1526" }}>Quản lý ca</option>
                <option value="Kho vận" style={{ background: "#0d1526" }}>Kho vận</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-form-select"
                style={{
                  width: "150px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--adm-border)",
                  color: "#e2e8f0",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  height: "38px",
                  cursor: "pointer",
                }}
              >
                <option value="All" style={{ background: "#0d1526" }}>Tất cả trạng thái</option>
                <option value="Đang hoạt động" style={{ background: "#0d1526" }}>Đang hoạt động</option>
                <option value="Nghỉ phép" style={{ background: "#0d1526" }}>Nghỉ phép</option>
                <option value="Tạm nghỉ" style={{ background: "#0d1526" }}>Tạm nghỉ</option>
              </select>

              {/* Advanced Filter Button */}
              <button
                className="admin-btn admin-btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid var(--adm-border)",
                  padding: "8px 14px",
                  height: "38px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--adm-text-dim)",
                  background: "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Bộ lọc</span>
              </button>
            </div>

            {/* Main Table Structure */}
            <div className="admin-table-wrap" style={{ margin: 0, borderRadius: "8px", overflow: "hidden", border: "1px solid var(--adm-border)" }}>
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Nhân viên</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Mã NV</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Vai trò</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Email</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Số điện thoại</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Trạng thái</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Hiệu suất</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((item) => (
                    <tr
                      key={item.id}
                      className="admin-table-row"
                      style={{
                        borderBottom: "1px solid var(--adm-border)",
                        background: "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: item.avatarBg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: "600",
                              fontSize: "13px",
                              boxShadow: "0 0 10px rgba(255,255,255,0.05)",
                              flexShrink: 0,
                            }}
                            >
                              {item.avatarUrl ? (
                                <img src={`http://localhost:5000${item.avatarUrl}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                item.avatarText
                              )}
                            </div>
                          <span style={{ fontWeight: 500, color: "#fff", fontSize: "13.5px" }}>{item.fullName}</span>
                        </div>
                      </td>

                      {/* Code ID */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "var(--adm-mono)", fontSize: "13px", color: "var(--adm-text-dim)" }}>{item.id}</span>
                      </td>

                      {/* Custom Role Tag Badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: "550",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                            background:
                              item.role === "Admin"
                                ? "rgba(139,92,246,0.12)"
                                : item.role === "Staff"
                                ? "rgba(59,130,246,0.12)"
                                : item.role === "Quản lý ca"
                                ? "rgba(20,184,166,0.12)"
                                : "rgba(249,115,22,0.12)",
                            color:
                              item.role === "Admin"
                                ? "#a78bfa"
                                : item.role === "Staff"
                                ? "#60a5fa"
                                : item.role === "Quản lý ca"
                                ? "#2dd4bf"
                                : "#fb923c",
                            border: `1px solid ${
                              item.role === "Admin"
                                ? "rgba(139,92,246,0.2)"
                                : item.role === "Staff"
                                ? "rgba(59,130,246,0.2)"
                                : item.role === "Quản lý ca"
                                ? "rgba(20,184,166,0.2)"
                                : "rgba(249,115,22,0.2)"
                            }`,
                          }}
                        >
                          {item.role}
                        </span>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "13.5px", color: "var(--adm-text-dim)" }}>{item.email}</span>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "13.5px", color: "var(--adm-text-dim)" }}>{item.phone}</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          className="admin-status-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            border: `1px solid ${
                              item.status === "Đang hoạt động"
                                ? "rgba(16,185,129,0.2)"
                                : item.status === "Nghỉ phép"
                                ? "rgba(245,158,11,0.2)"
                                : "rgba(239,68,68,0.2)"
                            }`,
                            color:
                              item.status === "Đang hoạt động"
                                ? "#10b981"
                                : item.status === "Nghỉ phép"
                                ? "#f59e0b"
                                : "#ef4444",
                            background:
                              item.status === "Đang hoạt động"
                                ? "rgba(16,185,129,0.08)"
                                : item.status === "Nghỉ phép"
                                ? "rgba(245,158,11,0.08)"
                                : "rgba(239,68,68,0.08)",
                          }}
                        >
                          <span
                            className="admin-status-dot"
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                item.status === "Đang hoạt động"
                                  ? "#10b981"
                                  : item.status === "Nghỉ phép"
                                  ? "#f59e0b"
                                  : "#ef4444",
                              boxShadow: `0 0 6px ${
                                item.status === "Đang hoạt động"
                                  ? "#10b981"
                                  : item.status === "Nghỉ phép"
                                  ? "#f59e0b"
                                  : "#ef4444"
                              }`,
                            }}
                          />
                          {item.status}
                        </span>
                      </td>

                      {/* Performance percentage & bar */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{item.performance}%</span>
                          <div style={{ width: "70px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${item.performance}%`,
                                height: "100%",
                                background:
                                  item.performance >= 85
                                    ? "#10b981"
                                    : item.performance >= 75
                                    ? "#f59e0b"
                                    : "#ef4444",
                                boxShadow: `0 0 6px ${
                                  item.performance >= 85
                                    ? "#10b981"
                                    : item.performance >= 75
                                    ? "#f59e0b"
                                    : "#ef4444"
                                }`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div className="admin-table-actions" style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            className="admin-action-btn view"
                            onClick={() => handleOpenEdit(item)}
                            title="Xem chi tiết"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid var(--adm-border)",
                              color: "var(--adm-text-dim)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa thông tin"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid var(--adm-border)",
                              color: "#3b82f6",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(item)}
                            title="Xóa nhân viên"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid var(--adm-border)",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-dim)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }} />
                          </svg>
                          <span>Đang tải danh sách nhân viên...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--adm-text-muted)", fontSize: "14px" }}>
                        Không tìm thấy nhân viên nào phù hợp.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredList.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "20px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}>
                  Hiển thị{" "}
                  <strong>
                    {Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}
                  </strong>{" "}
                  đến{" "}
                  <strong>
                    {Math.min(filteredList.length, currentPage * itemsPerPage)}
                  </strong>{" "}
                  trong tổng số <strong>{filteredList.length}</strong> nhân viên
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="admin-btn admin-btn-ghost"
                    style={{ padding: "6px 12px", height: "32px", fontSize: "13px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        padding: "6px 12px",
                        height: "32px",
                        fontSize: "13px",
                        borderRadius: "4px",
                        border: "1px solid var(--adm-border)",
                        cursor: "pointer",
                        fontWeight: currentPage === i + 1 ? "600" : "400",
                        background: currentPage === i + 1 ? "var(--adm-accent)" : "rgba(255,255,255,0.02)",
                        color: currentPage === i + 1 ? "#fff" : "var(--adm-text-dim)",
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="admin-btn admin-btn-ghost"
                    style={{ padding: "6px 12px", height: "32px", fontSize: "13px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Hoạt động đăng nhập */}
          <div
            className="admin-card"
            style={{
              padding: "24px",
              background: "rgba(13, 21, 38, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--adm-border)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: "0 0 20px" }}>Hoạt động đăng nhập</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {loginLogs.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "13px", padding: "8px 0" }}>
                  Chưa có hoạt động gần đây.
                </p>
              ) : loginLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: idx === loginLogs.length - 1 ? 0 : "14px",
                    borderBottom: idx === loginLogs.length - 1 ? "none" : "1px solid var(--adm-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Circle Avatar initials */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: log.avatarBg,
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(255,255,255,0.05)",
                        flexShrink: 0,
                      }}
                    >
                      {log.initials}
                    </div>

                    <div>
                      {/* Name & Role tag */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>{log.name}</span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: log.role === "Admin" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
                            color: log.role === "Admin" ? "#a78bfa" : "#60a5fa",
                            border: `1px solid ${log.role === "Admin" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)"}`,
                          }}
                        >
                          {log.role}
                        </span>
                      </div>
                      {/* Sub message */}
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--adm-text-dim)" }}>
                        {log.action} • <span style={{ color: "var(--adm-text-muted)", fontSize: "12px" }}>{log.device}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right side: Time & Active status dot */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "right" }}>
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{log.time}</span>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: log.active ? "#10b981" : "#64748b",
                        boxShadow: log.active ? "0 0 8px #10b981" : "none",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* View all activity centered bottom link */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
              <a
                href="#all-activities"
                style={{
                  fontSize: "13px",
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: "600",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#818cf8")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#6366f1")}
              >
                Xem tất cả hoạt động &gt;
              </a>
            </div>
          </div>
        </div>

        {/* Right Columns Widgets (Donut Widget & Shifts Widget) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Donut Widget: Phân bổ theo vai trò */}
          <div
            className="admin-card"
            style={{
              padding: "24px",
              background: "rgba(13, 21, 38, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--adm-border)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", margin: "0 0 20px" }}>Phân bổ theo vai trò</h3>

            {/* Side-by-side Layout containing SVG Donut on the left, Legend items on the right */}
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {/* Donut Chart container */}
              <div style={{ flex: "1", maxWidth: "120px", position: "relative" }}>
                <svg width="120" height="120" viewBox="0 0 140 140">
                  {/* Outer dim background base track */}
                  <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />

                  {/* Staff Segment circle: Blue (#3b82f6), taking 71.4% (arc: 221.3) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray="221.3 314.16"
                    strokeDashoffset="0"
                    strokeLinecap="butt"
                    transform="rotate(-90 70 70)"
                    style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.3))" }}
                  />

                  {/* Admin Segment circle: Purple (#8b5cf6), taking 10.7% (arc: 30.6) starting after Staff */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    strokeDasharray="30.6 314.16"
                    strokeDashoffset="-224.3"
                    strokeLinecap="butt"
                    transform="rotate(-90 70 70)"
                    style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.3))" }}
                  />

                  {/* Quản lý ca Segment circle: Teal (#14b8a6), taking 10.7% (arc: 30.6) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    strokeDasharray="30.6 314.16"
                    strokeDashoffset="-257.9"
                    strokeLinecap="butt"
                    transform="rotate(-90 70 70)"
                    style={{ filter: "drop-shadow(0 0 4px rgba(20,184,166,0.3))" }}
                  />

                  {/* Kho vận Segment circle: Orange/Red (#f97316), taking 7.1% (arc: 19.3) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="12"
                    strokeDasharray="19.3 314.16"
                    strokeDashoffset="-291.5"
                    strokeLinecap="butt"
                    transform="rotate(-90 70 70)"
                    style={{ filter: "drop-shadow(0 0 4px rgba(249,115,22,0.3))" }}
                  />

                  {/* Centered sum text badges */}
                  <text x="70" y="68" textAnchor="middle" fill="#ffffff" style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--adm-font)" }}>
                    {totalCount}
                  </text>
                  <text x="70" y="84" textAnchor="middle" fill="var(--adm-text-dim)" style={{ fontSize: "10px", fontWeight: "500", fontFamily: "var(--adm-font)", letterSpacing: "0.05em" }}>
                    Tổng số
                  </text>
                </svg>
              </div>

              {/* Legends Column */}
              <div style={{ flex: "1.2", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 6px #8b5cf6", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "var(--adm-text-dim)" }}>Admin</span>
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--adm-mono)", fontWeight: "600", color: "#fff" }}>
                    {roleDistribution.Admin || 0}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px #3b82f6", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "var(--adm-text-dim)" }}>Staff</span>
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--adm-mono)", fontWeight: "600", color: "#fff" }}>
                    {roleDistribution.Staff || 0}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 6px #14b8a6", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "var(--adm-text-dim)" }}>Quản lý ca</span>
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--adm-mono)", fontWeight: "600", color: "#fff" }}>
                    {roleDistribution["Quản lý ca"] || 0}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", boxShadow: "0 0 6px #f97316", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "var(--adm-text-dim)" }}>Kho vận</span>
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--adm-mono)", fontWeight: "600", color: "#fff" }}>
                    {roleDistribution["Kho vận"] || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* View detail bottom centered text action */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
              <a
                href="#roles-report"
                style={{
                  fontSize: "13px",
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#818cf8")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#6366f1")}
              >
                Xem chi tiết &gt;
              </a>
            </div>
          </div>

          {/* Shifts Widget: Lịch làm việc hôm nay */}
          <div
            className="admin-card"
            style={{
              padding: "24px",
              background: "rgba(13, 21, 38, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--adm-border)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", margin: "0 0 20px" }}>Lịch làm việc hôm nay</h3>

            {/* Shift lists with left timelines lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingLeft: "4px" }}>
              {shifts.map((shift: any, idx: number) => (
                <div key={shift.id} style={{ display: "flex", gap: "16px", position: "relative" }}>
                  {/* Left line guide */}
                  {idx !== shifts.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "5px",
                        top: "16px",
                        bottom: "-24px",
                        width: "1.5px",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}

                  {/* Timeline bullet element */}
                  <span
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      background: shift.color,
                      border: `2px solid rgba(13, 21, 38, 0.9)`,
                      boxShadow: `0 0 6px ${shift.color}`,
                      zIndex: 1,
                      marginTop: "4px",
                      flexShrink: 0,
                    }}
                  />

                  {/* Shift details column */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>
                        {shift.title}{" "}
                        <span style={{ fontSize: "11px", fontWeight: "400", color: "var(--adm-text-dim)", marginLeft: "6px" }}>{shift.time}</span>
                      </span>

                      {/* scheduled count tag */}
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: "550",
                          color: shift.color,
                          background: shift.bg,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: `1px solid ${shift.color}25`,
                        }}
                      >
                        {shift.count} nhân viên
                      </span>
                    </div>

                    <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "var(--adm-text-dim)", lineHeight: "1.5" }}>
                      {shift.staff}
                    </p>
                    {shift.subtext && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        {shift.subtext}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleEditShift(shift)}
                        className="admin-btn admin-btn-ghost"
                        style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelShift(shift)}
                        className="admin-btn admin-btn-ghost"
                        style={{ height: "30px", padding: "0 10px", fontSize: "12px", color: "#ef4444", borderColor: "rgba(239,68,68,0.35)" }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View shift details centered bottom link */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleCreateShift}
                style={{
                  fontSize: "13px",
                  color: "#6366f1",
                  fontWeight: "600",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Tạo ca trực
              </button>
            </div>
          </div>
        </div>
      </div>

      <CrudModal
        isOpen={slideoverOpen}
        mode={editStaff ? "edit" : "create"}
        title={editStaff ? "Chỉnh sửa thông tin" : "Thêm nhân viên mới"}
        onClose={() => setSlideoverOpen(false)}
        onSubmit={handleSubmit}
        submitLabel={editStaff ? "Lưu thay đổi" : "Thêm nhân viên"}
        size="xl"
      >
          <div className="admin-form-row">
            <FormField label="Họ và tên" required>
              <FormInput
                placeholder="Nhập tên nhân viên..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Email" required>
              <FormInput
                type="email"
                placeholder="example@uteshop.vn"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </FormField>
          </div>
          
          <div className="admin-form-row">
            <FormField label="Số điện thoại">
              <FormInput
                placeholder="Nhập số điện thoại..."
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </FormField>
            <FormField label="Vai trò" required>
              <FormSelect value={formRole} onChange={(e) => setFormRole(e.target.value)} disabled={editStaff !== null}>
                <option value="Admin">Admin (Quản trị viên)</option>
                <option value="Staff">Staff (Nhân viên vận hành)</option>
                <option value="Quản lý ca">Quản lý ca (Shift Manager)</option>
                <option value="Kho vận">Kho vận (Logistics Team)</option>
              </FormSelect>
            </FormField>
          </div>

          <div className="admin-form-row">
            <FormField label="Trạng thái làm việc" required>
              <FormSelect value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Nghỉ phép">Nghỉ phép</option>
                <option value="Tạm nghỉ">Tạm nghỉ</option>
              </FormSelect>
            </FormField>
            {!editStaff && (
              <FormField label="Mật khẩu" required>
                <FormInput
                  type="password"
                  placeholder="Mật khẩu mặc định..."
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                />
              </FormField>
            )}
          </div>

          <FormField label="Ảnh đại diện (Avatar)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormAvatar(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "8px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--adm-border)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px"
              }}
            />
          </FormField>
          <FormField label="Hiệu suất khởi điểm (%)">
            <FormInput
              type="number"
              min="0"
              max="100"
              placeholder="85"
              value={formPerformance}
              onChange={(e) => setFormPerformance(Number(e.target.value))}
            />
          </FormField>
      </CrudModal>
    </div>
  );
}
