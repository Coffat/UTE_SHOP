import { useState } from "react";
import { useConfirm, Slideover, FormField, FormInput, FormSelect } from "../components/AdminUI";
import { StatCardWidget } from "../components/StatCard";

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

  // Initial mockup customer list matching user's design image
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "KH-0001248",
      fullName: "Nguyễn Minh Anh",
      email: "minhanh.nguyen@gmail.com",
      phone: "0912 345 678",
      totalOrders: 12,
      totalSpent: 18750000,
      joinDate: "12/01/2025",
      isActive: true,
      segment: "VIP",
      statusText: "Hoạt động",
      lastPurchaseDate: "24/05/2024",
      avatarColor: "linear-gradient(135deg, #a855f7, #7e22ce)",
      isFemale: true,
    },
    {
      id: "KH-0001193",
      fullName: "Trần Quốc Bảo",
      email: "bao.tran95@gmail.com",
      phone: "0987 654 321",
      totalOrders: 8,
      totalSpent: 12980000,
      joinDate: "03/03/2025",
      isActive: true,
      segment: "VIP",
      statusText: "Hoạt động",
      lastPurchaseDate: "25/05/2024",
      avatarColor: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      isFemale: false,
    },
    {
      id: "KH-0001523",
      fullName: "Lê Thị Thanh Mai",
      email: "thanhmai.le@gmail.com",
      phone: "0903 111 222",
      totalOrders: 5,
      totalSpent: 6250000,
      joinDate: "20/07/2025",
      isActive: true,
      segment: "Tiềm năng",
      statusText: "Hoạt động",
      lastPurchaseDate: "24/05/2024",
      avatarColor: "linear-gradient(135deg, #06b6d4, #0891b2)",
      isFemale: true,
    },
    {
      id: "KH-0001032",
      fullName: "Phạm Hoàng Nam",
      email: "nam.pham86@gmail.com",
      phone: "0978 333 444",
      totalOrders: 3,
      totalSpent: 4350000,
      joinDate: "05/11/2024",
      isActive: true,
      segment: "Mới",
      statusText: "Hoạt động",
      lastPurchaseDate: "20/05/2024",
      avatarColor: "linear-gradient(135deg, #10b981, #047857)",
      isFemale: false,
    },
    {
      id: "KH-0000987",
      fullName: "Đỗ Quỳnh Trang",
      email: "quynhtrang.do@gmail.com",
      phone: "0965 555 666",
      totalOrders: 2,
      totalSpent: 2180000,
      joinDate: "10/04/2026",
      isActive: true,
      segment: "Tiềm năng",
      statusText: "Ít hoạt động",
      lastPurchaseDate: "10/05/2024",
      avatarColor: "linear-gradient(135deg, #ec4899, #be185d)",
      isFemale: true,
    },
    {
      id: "KH-0000756",
      fullName: "Vũ Đức Anh",
      email: "ducanh.vu@gmail.com",
      phone: "0912 777 888",
      totalOrders: 1,
      totalSpent: 1250000,
      joinDate: "28/02/2025",
      isActive: false,
      segment: "Ngủ quên",
      statusText: "Không hoạt động",
      lastPurchaseDate: "02/05/2024",
      avatarColor: "linear-gradient(135deg, #6b7280, #374151)",
      isFemale: false,
    },
  ]);

  // Handle addition of a new customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    const randomId = `KH-000${Math.floor(1000 + Math.random() * 9000)}`;
    const randomColor = [
      "linear-gradient(135deg, #a855f7, #7e22ce)",
      "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      "linear-gradient(135deg, #10b981, #047857)",
      "linear-gradient(135deg, #f59e0b, #b45309)",
      "linear-gradient(135deg, #ec4899, #be185d)",
    ][Math.floor(Math.random() * 5)];

    const dateToday = new Date().toLocaleDateString("vi-VN");

    const newCust: Customer = {
      id: randomId,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone || "Chưa cập nhật",
      totalOrders: 0,
      totalSpent: 0,
      joinDate: dateToday,
      isActive: newStatus !== "Không hoạt động",
      segment: newSegment,
      statusText: newStatus,
      lastPurchaseDate: "Chưa giao dịch",
      avatarColor: randomColor,
      isFemale: Math.random() > 0.5,
    };

    setCustomers([newCust, ...customers]);
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setSlideoverOpen(false);
  };

  // Handle deletion of a customer
  const handleDeleteCustomer = async (cust: Customer) => {
    const isConfirmed = await confirm({
      title: "Xóa khách hàng",
      message: `Bạn có chắc chắn muốn xóa khách hàng "${cust.fullName}" (${cust.id})? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa khách hàng",
      variant: "danger",
    });

    if (isConfirmed) {
      setCustomers(customers.filter((c) => c.id !== cust.id));
    }
  };

  // Filter customers list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment =
      segmentFilter === "Tất cả" || c.segment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  const statCards = [
    {
      id: "cust-total",
      label: "Tổng khách hàng",
      value: "12,648",
      change: 12.4,
      changeLabel: "so với tuần trước",
      icon: "users",
      color: "purple" as const,
      tooltip: "Tổng số khách hàng trong hệ thống",
      sparklinePoints: "M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8",
    },
    {
      id: "cust-new",
      label: "Khách hàng mới",
      value: "1,248",
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
      tooltip: "Khách hàng đăng ký mới tuần này",
      sparklinePoints: "M2 28L12 20L22 26L32 16L44 22L56 12L68 18L76 8",
    },
    {
      id: "cust-vip",
      label: "Khách hàng thân thiết",
      value: "2,356",
      change: 15.3,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Khách hàng có trên 5 đơn hàng",
      sparklinePoints: "M2 26L12 22L22 15L32 25L44 20L56 10L68 14L76 5",
    },
    {
      id: "cust-avg",
      label: "Giá trị trung bình",
      value: "1,480,000đ",
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
                          }}
                        >
                          {cust.fullName
                            .split(" ")
                            .pop()
                            ?.charAt(0)
                            .toUpperCase()}
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
              Hiển thị 1 - {filteredCustomers.length} / {filteredCustomers.length} khách hàng
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid var(--adm-border)",
                  color: "var(--adm-text-muted)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
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
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "12.5px",
                }}
              >
                1
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid var(--adm-border)",
                  color: "var(--adm-text-muted)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
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
              Phân khúc khách hàng
            </h2>

            {/* Donut Chart Block */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", marginTop: "10px" }}>
              {/* Left Column: Donut SVG */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", width: "150px", height: "150px", flexShrink: 0 }}>
                <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
                  {/* VIP (Purple) - 18.6% */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="16"
                    strokeDasharray="56.9 314.2"
                    strokeDashoffset="0"
                  />
                  {/* Tiềm năng (Blue) - 25.4% */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray="78.3 314.2"
                    strokeDashoffset="-58.4"
                  />
                  {/* Mới (Green) - 23.6% */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray="72.6 314.2"
                    strokeDashoffset="-138.2"
                  />
                  {/* Ngủ quên (Red) - 14.8% */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray="45.0 314.2"
                    strokeDashoffset="-212.4"
                  />
                  {/* Khác (Gray) - 17.6% */}
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth="16"
                    strokeDasharray="53.8 314.2"
                    strokeDashoffset="-258.9"
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
                    12,648
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px", fontWeight: 550, whiteSpace: "nowrap" }}>
                    Tổng khách hàng
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
                      2,356 (18.6%)
                    </span>
                  </div>
                  {/* Tiềm năng row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Tiềm năng</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      3,214 (25.4%)
                    </span>
                  </div>
                  {/* Mới row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Mới</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      2,987 (23.6%)
                    </span>
                  </div>
                  {/* Ngủ quên row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Ngủ quên</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      1,876 (14.8%)
                    </span>
                  </div>
                  {/* Khác row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#64748b", boxShadow: "0 0 8px rgba(100, 116, 139, 0.4)" }} />
                      <span style={{ color: "var(--adm-text-dim)", fontWeight: 500 }}>Khác</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: 550, fontFamily: "var(--adm-mono)", fontSize: "12.5px" }}>
                      2,215 (17.6%)
                    </span>
                  </div>
                </div>

                <div style={{ paddingTop: "8px", textAlign: "left" }}>
                  <a
                    href="#details"
                    style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Xem chi tiết
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>&gt;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Khách hàng nổi bật */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h2 className="admin-card-title" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Khách hàng nổi bật
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Top customer 1 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #a855f7, #7e22ce)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    A
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px" }}>
                        Nguyễn Minh Anh
                      </p>
                      <span
                        style={{
                          background: "rgba(168, 85, 247, 0.12)",
                          color: "#c084fc",
                          borderRadius: "4px",
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontWeight: 700,
                          border: "1px solid rgba(168, 85, 247, 0.2)",
                        }}
                      >
                        VIP
                      </span>
                    </div>
                    <p className="admin-table-muted" style={{ margin: "2px 0 0", fontSize: "11px" }}>
                      12 đơn hàng
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px", fontFamily: "var(--adm-mono)" }}>
                    18,750,000 đ
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#10b981", fontWeight: 550 }}>
                    ↑ 14.2%
                  </p>
                </div>
              </div>

              {/* Top customer 2 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    B
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px" }}>
                        Trần Quốc Bảo
                      </p>
                      <span
                        style={{
                          background: "rgba(168, 85, 247, 0.12)",
                          color: "#c084fc",
                          borderRadius: "4px",
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontWeight: 700,
                          border: "1px solid rgba(168, 85, 247, 0.2)",
                        }}
                      >
                        VIP
                      </span>
                    </div>
                    <p className="admin-table-muted" style={{ margin: "2px 0 0", fontSize: "11px" }}>
                      8 đơn hàng
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px", fontFamily: "var(--adm-mono)" }}>
                    12,980,000 đ
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#10b981", fontWeight: 550 }}>
                    ↑ 9.8%
                  </p>
                </div>
              </div>

              {/* Top customer 3 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    M
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px" }}>
                        Lê Thị Thanh Mai
                      </p>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.12)",
                          color: "#60a5fa",
                          borderRadius: "4px",
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontWeight: 700,
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        Tiềm năng
                      </span>
                    </div>
                    <p className="admin-table-muted" style={{ margin: "2px 0 0", fontSize: "11px" }}>
                      5 đơn hàng
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "13px", fontFamily: "var(--adm-mono)" }}>
                    6,250,000 đ
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#10b981", fontWeight: 550 }}>
                    ↑ 6.1%
                  </p>
                </div>
              </div>
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

      {/* DRAWER SLIDEOVER FOR CREATING CUSTOMER */}
      <Slideover isOpen={slideoverOpen} title="Thêm khách hàng mới" onClose={() => setSlideoverOpen(false)}>
        <form className="admin-form" onSubmit={handleCreateCustomer}>
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
          
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => setSlideoverOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              Lưu khách hàng
            </button>
          </div>
        </form>
      </Slideover>
    </div>
  );
}
