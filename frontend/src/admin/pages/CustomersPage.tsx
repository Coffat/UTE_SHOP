import { useState, useEffect, useMemo } from "react";
import { useConfirm, CrudModal, FormField, FormInput, FormSelect } from "../components/AdminUI";
import { StatCardWidget } from "../components/StatCard";
import {
  fetchCustomers as fetchCustomersApi,
  createCustomer as createCustomerApi,
  updateCustomerStatus,
} from "../services/adminCustomers.api";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  isActive: boolean;
  segment: "VIP" | "Tiềm năng" | "Mới" | "Ngủ quên";
  statusText: "Hoạt động" | "Ít hoạt động" | "Không hoạt động";
  lastPurchaseDate: string;
  avatarColor: string;
  isFemale: boolean;
  avatarUrl?: string;
}

export function CustomersPage() {
  const { confirm, ModalEl } = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("Tất cả");
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  // Form states for adding customer
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSegment, setNewSegment] = useState<"VIP" | "Tiềm năng" | "Mới" | "Ngủ quên">("Mới");
  const [newStatus, setNewStatus] = useState<"Hoạt động" | "Ít hoạt động" | "Không hoạt động">("Hoạt động");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const mapBackendToFrontendCustomer = (bCust: any): Customer => {
    const status = bCust.status || "ACTIVE";
    const totalSpent = bCust.totalSpent || 0;
    const ordersCount = bCust.ordersCount || 0;

    // Status mapping
    let statusText: "Hoạt động" | "Ít hoạt động" | "Không hoạt động" = "Hoạt động";
    if (status === "SUSPENDED" || status === "PENDING") {
      statusText = "Ít hoạt động";
    } else if (status === "BANNED") {
      statusText = "Không hoạt động";
    }

    // Segment mapping
    let segment: "VIP" | "Tiềm năng" | "Mới" | "Ngủ quên" = "Mới";
    if (status === "SUSPENDED" || status === "BANNED") {
      segment = "Ngủ quên";
    } else if (totalSpent >= 10000000 || ordersCount >= 10) {
      segment = "VIP";
    } else if (totalSpent >= 3000000 || ordersCount >= 4) {
      segment = "Tiềm năng";
    }

    // Avatar gradient color based on segment
    let avatarColor = "linear-gradient(135deg, #10b981, #047857)"; // Default Green for New
    if (segment === "VIP") {
      avatarColor = "linear-gradient(135deg, #a855f7, #7e22ce)"; // Purple
    } else if (segment === "Tiềm năng") {
      avatarColor = "linear-gradient(135deg, #06b6d4, #0891b2)"; // Cyan
    } else if (segment === "Ngủ quên") {
      avatarColor = "linear-gradient(135deg, #6b7280, #374151)"; // Gray
    }

    // Join date mapping
    const joinDate = bCust.createdAt 
      ? new Date(bCust.createdAt).toLocaleDateString("vi-VN") 
      : new Date().toLocaleDateString("vi-VN");

    return {
      id: bCust._id,
      fullName: bCust.fullName,
      email: bCust.email,
      phone: bCust.phone || "Chưa cập nhật",
      totalOrders: ordersCount,
      totalSpent: totalSpent,
      joinDate: joinDate,
      isActive: bCust.isActive !== false,
      segment: segment,
      statusText: statusText,
      lastPurchaseDate: ordersCount > 0 ? "Giao dịch gần đây" : "Chưa giao dịch",
      avatarColor: avatarColor,
      isFemale: Math.random() > 0.5,
      avatarUrl: bCust.avatar || "",
    };
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (segmentFilter === "Ngủ quên") {
        params.status = "SUSPENDED";
      } else if (segmentFilter === "VIP" || segmentFilter === "Tiềm năng" || segmentFilter === "Mới") {
        params.status = "ACTIVE";
      }

      const { items, meta } = await fetchCustomersApi(params);

      const mapped = items.map(mapBackendToFrontendCustomer);
      setCustomers(mapped);
      setTotalPages(meta.pages || 1);
      setTotalCount(meta.total || 0);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchQuery, segmentFilter]);

  // Handle addition of a new customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    let mappedStatus = "ACTIVE";
    if (newStatus === "Ít hoạt động") {
      mappedStatus = "SUSPENDED";
    } else if (newStatus === "Không hoạt động") {
      mappedStatus = "BANNED";
    }

    try {
      let payload: any;
      if (newAvatar) {
        payload = new FormData();
        payload.append("fullName", newFullName);
        payload.append("email", newEmail);
        if (newPhone) payload.append("phone", newPhone);
        payload.append("status", mappedStatus);
        payload.append("password", "Uteshop@123");
        payload.append("avatar", newAvatar);
      } else {
        payload = {
          fullName: newFullName,
          email: newEmail,
          phone: newPhone || undefined,
          status: mappedStatus,
          password: "Uteshop@123",
        };
      }

      await createCustomerApi(payload);
      
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setNewSegment("Mới");
      setNewStatus("Hoạt động");
      setNewAvatar(null);
      setSlideoverOpen(false);

      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi tạo tài khoản khách hàng");
    }
  };

  // Handle deletion of a customer
  const handleDeleteCustomer = async (cust: Customer) => {
    const isConfirmed = await confirm({
      title: "Xóa/Khóa khách hàng",
      message: `Bạn có chắc chắn muốn khóa tài khoản khách hàng "${cust.fullName}" (${cust.id})? Hành động này sẽ chuyển trạng thái của khách hàng thành Không hoạt động.`,
      confirmLabel: "Khóa tài khoản",
      variant: "danger",
    });

    if (isConfirmed) {
      try {
        await updateCustomerStatus(cust.id, "BANNED");
        fetchCustomers();
      } catch (err: any) {
        alert(err.response?.data?.message || "Không thể khóa tài khoản khách hàng");
      }
    }
  };

  const filteredCustomers = customers;

  const stats = useMemo(() => {
    const total = totalCount;
    const vip = customers.filter((c) => c.segment === "VIP").length;
    const potential = customers.filter((c) => c.segment === "Tiềm năng").length;
    const brandNew = customers.filter((c) => c.segment === "Mới").length;
    const sleeping = customers.filter((c) => c.segment === "Ngủ quên").length;

    const spentSum = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = customers.length > 0 ? Math.round(spentSum / customers.length) : 0;

    return {
      total,
      vip,
      potential,
      brandNew,
      sleeping,
      avgSpent,
    };
  }, [customers, totalCount]);

  const segmentsData = useMemo(() => {
    const list = customers;
    const vip = list.filter((c) => c.segment === "VIP").length;
    const potential = list.filter((c) => c.segment === "Tiềm năng").length;
    const brandNew = list.filter((c) => c.segment === "Mới").length;
    const sleeping = list.filter((c) => c.segment === "Ngủ quên").length;
    const total = vip + potential + brandNew + sleeping || 1;

    const vipPct = Math.round((vip / total) * 100);
    const potentialPct = Math.round((potential / total) * 100);
    const brandNewPct = Math.round((brandNew / total) * 100);
    const sleepingPct = 100 - vipPct - potentialPct - brandNewPct;

    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    const vipStroke = (vipPct / 100) * circumference;
    const potentialStroke = (potentialPct / 100) * circumference;
    const brandNewStroke = (brandNewPct / 100) * circumference;
    const sleepingStroke = (sleepingPct / 100) * circumference;

    return {
      vip: { count: vip, pct: vipPct, stroke: vipStroke },
      potential: { count: potential, pct: potentialPct, stroke: potentialStroke },
      brandNew: { count: brandNew, pct: brandNewPct, stroke: brandNewStroke },
      sleeping: { count: sleeping, pct: sleepingPct, stroke: sleepingStroke },
      circumference,
    };
  }, [customers]);

  const topCustomers = useMemo(() => {
    return [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);
  }, [customers]);

  const statCards = [
    {
      id: "cust-total",
      label: "Tổng khách hàng",
      value: stats.total.toLocaleString("vi-VN"),
      change: 12.4,
      changeLabel: "so với tuần trước",
      icon: "users",
      color: "purple" as const,
      tooltip: "Tổng số khách hàng trong hệ thống",
      sparklinePoints: "M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8",
    },
    {
      id: "cust-new",
      label: "Khách mới (Trang này)",
      value: stats.brandNew.toString(),
      change: 8.1,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="17" y1="11" x2="23" y2="11" />
        </svg>
      ),
      color: "cyan" as const,
      tooltip: "Khách hàng đăng ký mới",
      sparklinePoints: "M2 28L12 20L22 26L32 16L44 22L56 12L68 18L76 8",
    },
    {
      id: "cust-vip",
      label: "Khách VIP (Trang này)",
      value: stats.vip.toString(),
      change: 15.3,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Khách hàng VIP",
      sparklinePoints: "M2 26L12 22L22 15L32 25L44 20L56 10L68 14L76 5",
    },
    {
      id: "cust-avg",
      label: "Giá trị trung bình",
      value: `${stats.avgSpent.toLocaleString("vi-VN")} đ`,
      change: 6.7,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <line x1="12" y1="10" x2="12" y2="14" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      color: "blue" as const,
      tooltip: "Giá trị trung bình mỗi đơn hàng",
      sparklinePoints: "M2 22L12 14L22 18L32 8L44 14L56 5L68 12L76 8",
    },
  ];

  return (
    <div className="admin-page">
      {ModalEl}

      {/* HEADER BLOCK */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Khách hàng</h2>
          <p className="admin-page-subtitle">Quản lý hồ sơ, hành vi mua sắm và phân khúc khách hàng</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          style={{ padding: "10px 20px", fontWeight: 600 }}
          onClick={() => setSlideoverOpen(true)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: "4px" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm khách hàng
        </button>
      </div>

      {/* STATS CARDS ROW */}
      <div className="admin-stat-grid" style={{ marginBottom: "20px" }}>
        {statCards.map((card) => (
          <StatCardWidget key={card.id} card={card} />
        ))}
      </div>

      {/* DOUBLE-COLUMN BENTO BLOCK */}
      <div className="admin-grid-2col" style={{ marginTop: "8px" }}>
        
        {/* LEFT COLUMN: Danh sách khách hàng */}
        <div className="admin-card" style={{ padding: 0 }}>
          {/* Header & Filter Toolbar */}
          <div style={{ padding: "20px 20px 16px" }}>
            <h2 className="admin-card-title" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Danh sách khách hàng</h2>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search input */}
              <div className="admin-search-box" style={{ flex: 1, minWidth: "260px" }}>
                <span className="admin-search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email hoặc mã KH..."
                  className="admin-search-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Segment Dropdown */}
              <div style={{ position: "relative" }}>
                <select
                  className="admin-form-select"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "6px",
                    color: "var(--adm-text-dim)",
                    fontSize: "13px",
                    padding: "8px 36px 8px 12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    height: "38px",
                  }}
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <option value="Tất cả">Phân khúc: Tất cả</option>
                  <option value="VIP">VIP</option>
                  <option value="Tiềm năng">Tiềm năng</option>
                  <option value="Mới">Mới</option>
                  <option value="Ngủ quên">Ngủ quên</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                className="admin-btn admin-btn-outline"
                style={{
                  height: "38px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderColor: "var(--adm-border)",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  color: "var(--adm-text-dim)",
                }}
                onClick={() => alert("Đang xuất danh sách khách hàng...")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "6px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Xuất dữ liệu
              </button>
            </div>
          </div>

          {/* Customer Table */}
          <div className="admin-table-wrap">
            <table className="admin-table" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "20px" }}>Khách hàng</th>
                  <th>Mã KH</th>
                  <th>Email</th>
                  <th style={{ textAlign: "center" }}>Số đơn</th>
                  <th style={{ textAlign: "right" }}>Tổng chi tiêu</th>
                  <th style={{ paddingLeft: "16px" }}>Phân khúc</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="admin-table-row">
                    {/* Customer column (Avatar + Name & Last purchase date) */}
                    <td style={{ paddingLeft: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: cust.avatarColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 650,
                            flexShrink: 0,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            overflow: "hidden",
                          }}
                        >
                          {cust.avatarUrl ? (
                            <img src={`http://localhost:5000${cust.avatarUrl}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            cust.fullName
                              .split(" ")
                              .pop()
                              ?.charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13.5px" }}>
                            {cust.fullName}
                          </p>
                          <p className="admin-table-muted" style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.85 }}>
                            Mua lần cuối: {cust.lastPurchaseDate}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID column */}
                    <td>
                      <span
                        className="admin-table-mono"
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "var(--adm-text-dim)",
                        }}
                      >
                        {cust.id}
                      </span>
                    </td>

                    {/* Email column */}
                    <td style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                      {cust.email}
                    </td>

                    {/* Total Orders column */}
                    <td style={{ textAlign: "center", fontFamily: "var(--adm-mono)", fontWeight: 500, fontSize: "13px" }}>
                      {cust.totalOrders}
                    </td>

                    {/* Total spent column */}
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--adm-mono)",
                        fontWeight: 600,
                        color: "#fff",
                        fontSize: "13px",
                      }}
                    >
                      {cust.totalSpent === 0 ? "0 đ" : `${cust.totalSpent.toLocaleString("vi-VN")} đ`}
                    </td>

                    {/* Segment badge column */}
                    <td style={{ paddingLeft: "16px" }}>
                      {cust.segment === "VIP" && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(168, 85, 247, 0.12)",
                            borderColor: "rgba(168, 85, 247, 0.2)",
                            color: "#c084fc",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          VIP
                        </span>
                      )}
                      {cust.segment === "Tiềm năng" && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(59, 130, 246, 0.12)",
                            borderColor: "rgba(59, 130, 246, 0.2)",
                            color: "#60a5fa",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          Tiềm năng
                        </span>
                      )}
                      {cust.segment === "Mới" && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(16, 185, 129, 0.12)",
                            borderColor: "rgba(16, 185, 129, 0.2)",
                            color: "#34d399",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          Mới
                        </span>
                      )}
                      {cust.segment === "Ngủ quên" && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(245, 158, 11, 0.12)",
                            borderColor: "rgba(245, 158, 11, 0.2)",
                            color: "#fbbf24",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          Ngủ quên
                        </span>
                      )}
                    </td>

                    {/* Status column */}
                    <td>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          color:
                            cust.statusText === "Hoạt động"
                              ? "#10b981"
                              : cust.statusText === "Ít hoạt động"
                              ? "#eab308"
                              : "#ef4444",
                          fontSize: "12.5px",
                        }}
                      >
                        <span
                          className="admin-status-dot"
                          style={{
                            background:
                              cust.statusText === "Hoạt động"
                                ? "#10b981"
                                : cust.statusText === "Ít hoạt động"
                                ? "#eab308"
                                : "#ef4444",
                            marginRight: "2px",
                          }}
                        />
                        {cust.statusText}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td>
                      <button
                        className="admin-action-btn delete"
                        title="Xóa"
                        style={{ border: "none", width: "24px", height: "24px", padding: 0 }}
                        onClick={() => handleDeleteCustomer(cust)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "36px 0", textAlign: "center" }}>
                      <div className="admin-empty-state">
                        <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", margin: 0 }}>
                          Không tìm thấy khách hàng nào trùng khớp.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Paginated Footer Controls */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--adm-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="admin-table-muted" style={{ fontSize: "12.5px" }}>
              Hiển thị {totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, totalCount)} / {totalCount} khách hàng
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={{
                  background: "transparent",
                  border: "1px solid var(--adm-border)",
                  color: currentPage === 1 ? "rgba(255,255,255,0.15)" : "var(--adm-text-muted)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &lt;
              </button>
              <button
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid var(--adm-accent)",
                  color: "#818cf8",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "default",
                  fontWeight: 600,
                  fontSize: "12.5px",
                }}
              >
                {currentPage}
              </button>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                style={{
                  background: "transparent",
                  border: "1px solid var(--adm-border)",
                  color: currentPage === totalPages ? "rgba(255,255,255,0.15)" : "var(--adm-text-muted)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Widgets Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Widget 1: Phân khúc khách hàng */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h2 className="admin-card-title" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Phân khúc khách hàng (Trang này)
            </h2>

            {/* Donut Chart Block */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", marginTop: "10px" }}>
              {/* Left Column: Donut SVG */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", width: "150px", height: "150px", flexShrink: 0 }}>
                <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
                  {/* VIP (Purple) */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="16"
                    strokeDasharray={`${segmentsData.vip.stroke} ${segmentsData.circumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Tiềm năng (Blue) */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray={`${segmentsData.potential.stroke} ${segmentsData.circumference}`}
                    strokeDashoffset={`-${segmentsData.vip.stroke}`}
                  />
                  {/* Mới (Green) */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${segmentsData.brandNew.stroke} ${segmentsData.circumference}`}
                    strokeDashoffset={`-${segmentsData.vip.stroke + segmentsData.potential.stroke}`}
                  />
                  {/* Ngủ quên (Red) */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray={`${segmentsData.sleeping.stroke} ${segmentsData.circumference}`}
                    strokeDashoffset={`-${segmentsData.vip.stroke + segmentsData.potential.stroke + segmentsData.brandNew.stroke}`}
                  />
                </svg>

                {/* Text inside donut */}
                <div
                  style={{
                    position: "absolute",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff", fontFamily: "var(--adm-mono)", letterSpacing: "-0.5px" }}>
                    {customers.length}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px", fontWeight: 550, whiteSpace: "nowrap" }}>
                    Tổng hiển thị
                  </span>
                </div>
              </div>

              {/* Right Column: Legends & Action Link */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexGrow: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* VIP row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px rgba(168, 85, 247, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>VIP</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      {segmentsData.vip.count} ({segmentsData.vip.pct}%)
                    </span>
                  </div>
                  {/* Tiềm năng row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Tiềm năng</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      {segmentsData.potential.count} ({segmentsData.potential.pct}%)
                    </span>
                  </div>
                  {/* Mới row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Mới</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      {segmentsData.brandNew.count} ({segmentsData.brandNew.pct}%)
                    </span>
                  </div>
                  {/* Ngủ quên row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Ngủ quên</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      {segmentsData.sleeping.count} ({segmentsData.sleeping.pct}%)
                    </span>
                  </div>
                </div>

                <div style={{ paddingTop: "8px", textAlign: "left" }}>
                  <span style={{ fontSize: "13px", color: "var(--adm-text-muted)", fontWeight: 500 }}>
                    Tính trên trang hiện tại
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Khách hàng nổi bật */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h2 className="admin-card-title" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Khách hàng nổi bật (Trang này)
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {topCustomers.map((cust, idx) => (
                <div key={cust.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: cust.avatarColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12.5px",
                        fontWeight: 600,
                      }}
                    >
                      {cust.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                          {cust.fullName}
                        </p>
                        <span
                          style={{
                            background: cust.segment === "VIP" ? "rgba(168, 85, 247, 0.12)" : cust.segment === "Tiềm năng" ? "rgba(59, 130, 246, 0.12)" : "rgba(16, 185, 129, 0.12)",
                            color: cust.segment === "VIP" ? "#c084fc" : cust.segment === "Tiềm năng" ? "#60a5fa" : "#34d399",
                            borderRadius: "4px",
                            padding: "1px 4px",
                            fontSize: "9px",
                            fontWeight: 700,
                            border: cust.segment === "VIP" ? "1px solid rgba(168, 85, 247, 0.2)" : cust.segment === "Tiềm năng" ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          {cust.segment}
                        </span>
                      </div>
                      <p className="admin-table-muted" style={{ margin: "2px 0 0", fontSize: "11px" }}>
                        {cust.totalOrders} đơn hàng
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px", fontFamily: "var(--adm-mono)" }}>
                      {cust.totalSpent.toLocaleString("vi-VN")} đ
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#10b981", fontWeight: 550 }}>
                      ↑ {10 - idx * 2}%
                    </p>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: 0 }}>
                  Chưa có dữ liệu nổi bật
                </p>
              )}
            </div>
          </div>

          {/* Widget 3: Hoạt động gần đây */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h2 className="admin-card-title" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Hoạt động gần đây
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Activity item 1 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "rgba(59, 130, 246, 0.12)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12.5px", color: "var(--adm-text-dim)", margin: 0, lineHeight: 1.4 }}>
                    <strong style={{ color: "#fff", fontWeight: 600 }}>Nguyễn Thị Thu Hà</strong> vừa đăng ký tài khoản
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>10:24</span>
                </div>
              </div>

              {/* Activity item 2 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12.5px", color: "var(--adm-text-dim)", margin: 0, lineHeight: 1.4 }}>
                    <strong style={{ color: "#fff", fontWeight: 600 }}>Lê Minh Quân</strong> đã đặt hàng <span style={{ fontFamily: "var(--adm-mono)", fontSize: "12px", color: "#818cf8", fontWeight: 500 }}>#ORD-1028</span>
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>09:56</span>
                </div>
              </div>

              {/* Activity item 3 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    color: "#fbbf24",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12.5px", color: "var(--adm-text-dim)", margin: 0, lineHeight: 1.4 }}>
                    <strong style={{ color: "#fff", fontWeight: 600 }}>Trần Bảo Ngọc</strong> đã mua 2 sản phẩm
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>09:32</span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: "12px", borderTop: "1px solid var(--adm-border)", marginTop: "8px", textAlign: "left" }}>
              <a
                href="#activity"
                style={{ fontSize: "12.5px", color: "#818cf8", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center" }}
              >
                Xem tất cả hoạt động
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "4px" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <CrudModal
        isOpen={slideoverOpen}
        mode="create"
        title="Thêm khách hàng mới"
        onClose={() => setSlideoverOpen(false)}
        onSubmit={handleCreateCustomer}
        submitLabel="Lưu khách hàng"
        size="xl"
      >
          <div className="admin-form-row">
            <FormField label="Họ và tên" required>
              <FormInput
                placeholder="Nhập họ và tên..."
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
              />
            </FormField>
            <FormField label="Email" required>
              <FormInput
                type="email"
                placeholder="example@email.com"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </FormField>
          </div>
          
          <div className="admin-form-row">
            <FormField label="Số điện thoại">
              <FormInput
                placeholder="0xxx xxx xxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </FormField>
            <FormField label="Phân khúc" required>
              <FormSelect
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value as any)}
              >
                <option value="Mới">Mới</option>
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="VIP">VIP</option>
                <option value="Ngủ quên">Ngủ quên</option>
              </FormSelect>
            </FormField>
          </div>

          <div className="admin-form-row">
            <FormField label="Trạng thái hoạt động" required>
              <FormSelect
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Ít hoạt động">Ít hoạt động</option>
                <option value="Không hoạt động">Không hoạt động</option>
              </FormSelect>
            </FormField>
            <FormField label="Mật khẩu" required>
              <FormInput
                type="password"
                placeholder="Mật khẩu mặc định..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Ảnh đại diện (Avatar)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewAvatar(e.target.files?.[0] || null)}
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
      </CrudModal>
    </div>
  );
}
