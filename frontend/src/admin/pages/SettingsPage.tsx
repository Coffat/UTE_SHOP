import { useState } from "react";

const SETTING_SECTIONS = [
  { key: "general",   label: "Thông tin cửa hàng",   icon: "🏪" },
  { key: "payment",   label: "Thanh toán",           icon: "💳" },
  { key: "shipping",  label: "Vận chuyển",           icon: "🚚" },
  { key: "email",     label: "Thông báo",            icon: "🔔" },
  { key: "security",  label: "Bảo mật",              icon: "🛡️" },
  { key: "backup",    label: "Tích hợp",             icon: "🧩" },
];

export function SettingsPage() {
  const [activeNav, setActiveNav] = useState("general");
  const [showToast, setShowToast] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState("UTESHOP");
  const [supportEmail, setSupportEmail] = useState("support@uteshop.vn");
  const [phone, setPhone] = useState("1900 1234");
  const [address, setAddress] = useState("123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh, Việt Nam");
  const [timezone, setTimezone] = useState("(GMT+07:00) Bangkok, Hanoi, Jakarta");

  // Payment states
  const [vnpayActive, setVnpayActive] = useState(true);
  const [codActive, setCodActive] = useState(true);
  const [momoActive, setMomoActive] = useState(true);

  // Tax states
  const [vat, setVat] = useState("10");
  const [roundPrice, setRoundPrice] = useState("Làm tròn .000đ");
  const [currency, setCurrency] = useState("VND (Việt Nam Đồng)");

  // Notification states
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [newOrder, setNewOrder] = useState(true);

  // Security states
  const [tfaActive, setTfaActive] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30 phút");
  const [apiKey, setApiKey] = useState("ute_shop_live_89f8d3f3fa2847a6b772d84f79a33578");

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleRotateKey = () => {
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiKey(`ute_shop_live_${randomHex}`);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
    return (
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: "42px",
          height: "22px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: checked ? "#10b981" : "rgba(255, 255, 255, 0.1)",
            borderRadius: "22px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: checked ? "0 0 10px rgba(16,185,129,0.35)" : "none",
          }}
        />
        <span
          style={{
            position: "absolute",
            height: "16px",
            width: "16px",
            left: checked ? "23px" : "3px",
            bottom: "3px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </label>
    );
  };

  return (
    <div className="admin-page">
      
      {/* Toast slide-in micro-animation */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Floating Success Toast */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "rgba(13, 21, 38, 0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16,185,129,0.2)",
            borderRadius: "10px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 9999,
            animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "550",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span>Lưu cấu hình thành công!</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Cài đặt</h2>
          <p className="admin-page-subtitle">
            Quản lý cấu hình hệ thống và thông tin cửa hàng
          </p>
        </div>

        {/* Save Changes Button */}
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "13.5px",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "38px",
            transition: "all 0.2s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>Lưu thay đổi</span>
        </button>
      </div>

      {/* Main Settings Body Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Navigation Card Panel */}
        <div
          className="admin-card"
          style={{
            padding: "12px",
            background: "rgba(13, 21, 38, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--adm-border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {SETTING_SECTIONS.map((section) => {
            const isActive = activeNav === section.key;
            return (
              <button
                key={section.key}
                onClick={() => setActiveNav(section.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  color: isActive ? "#fff" : "var(--adm-text-dim)",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive ? "0 4px 15px rgba(59,130,246,0.15)" : "none",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "var(--adm-text)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--adm-text-dim)";
                  }
                }}
              >
                {/* Custom Inline SVG icons for sections */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", color: isActive ? "#60a5fa" : "var(--adm-text-muted)" }}>
                  {section.key === "general" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                      <path d="M9 22V12h6v10" />
                      <path d="M8 6h.01" />
                      <path d="M16 6h.01" />
                      <path d="M8 10h.01" />
                      <path d="M16 10h.01" />
                    </svg>
                  )}
                  {section.key === "payment" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  )}
                  {section.key === "shipping" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  )}
                  {section.key === "email" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  )}
                  {section.key === "security" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                  {section.key === "backup" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  )}
                </div>
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Bento Configuration Pane */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
          
          {/* Row 1: Card A (Store Info) & Card B (Store Logo Dropzone) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {/* Card A: Thông tin cửa hàng */}
            <div
              className="admin-card"
              style={{
                padding: "24px",
                background: "rgba(13, 21, 38, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ color: "#60a5fa", display: "flex", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                    <path d="M9 22V12h6v10" />
                    <path d="M8 6h.01" />
                    <path d="M16 6h.01" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Thông tin cửa hàng</h3>
              </div>

              {/* Form Grids */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                
                {/* Block 1: Store Name & Address */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--adm-text-dim)" }}>Tên cửa hàng</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridRow: "span 2" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--adm-text-dim)" }}>Địa chỉ</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={4}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                        resize: "none",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>

                {/* Block 2: Email & Timezone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--adm-text-dim)" }}>Email hỗ trợ</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--adm-text-dim)" }}>Múi giờ</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          background: "rgba(13, 21, 38, 0.4)",
                          border: "1px solid var(--adm-border)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "13.5px",
                          outline: "none",
                          fontFamily: "inherit",
                          width: "100%",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="(GMT+07:00) Bangkok, Hanoi, Jakarta">(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                        <option value="(GMT+00:00) Greenwich Mean Time">(GMT+00:00) London, Lisbon</option>
                        <option value="(GMT+08:00) Singapore, Beijing">(GMT+08:00) Singapore, Beijing</option>
                      </select>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--adm-text-muted)",
                          pointerEvents: "none",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Block 3: Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--adm-text-dim)" }}>Số điện thoại</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                    />
                  </div>
                  <div />
                </div>

              </div>
            </div>

            {/* Card B: Logo cửa hàng (Dropzone Upload) */}
            <div
              className="admin-card"
              style={{
                padding: "24px",
                background: "rgba(13, 21, 38, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  border: "2px dashed rgba(59,130,246,0.3)",
                  borderRadius: "10px",
                  padding: "32px 20px",
                  textAlign: "center",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(13, 21, 38, 0.2)",
                  cursor: "pointer",
                }}
              >
                {/* Glowing bag icon */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#60a5fa",
                    marginBottom: "16px",
                    border: "1px solid rgba(59,130,246,0.25)",
                    boxShadow: "0 0 15px rgba(59,130,246,0.15)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>

                <span style={{ fontSize: "14px", fontWeight: "500", color: "#fff" }}>Kéo & thả file hoặc</span>
                
                {/* Select file glass btn */}
                <button
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    color: "#e2e8f0",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                >
                  Chọn file
                </button>

                <p style={{ fontSize: "11px", color: "var(--adm-text-muted)", margin: "16px 0 0", lineHeight: "16px" }}>
                  PNG, JPG, SVG tối đa 2MB. Kích thước khuyến nghị 512x512px.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Card C (Thanh toán & phí) */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ color: "#60a5fa", display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Thanh toán & phí</h3>
            </div>

            {/* Split layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              
              {/* Left Column: Payment switches */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--adm-text-dim)", margin: "0 0 4px" }}>
                  Phương thức thanh toán
                </h4>

                {/* VNPay Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* VNPay styled logo */}
                    <div style={{
                      width: "44px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "900",
                      letterSpacing: "-0.5px"
                    }}>
                      <span style={{ color: "#3b82f6" }}>VN</span>
                      <span style={{ color: "#ef4444" }}>PAY</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>VNPay</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Thanh toán qua cổng VNPay</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={vnpayActive} onChange={() => setVnpayActive(!vnpayActive)} />
                </div>

                {/* COD Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* COD styled badge */}
                    <div style={{
                      width: "44px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#10b981",
                      letterSpacing: "0.5px"
                    }}>
                      COD
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>COD</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Thanh toán khi nhận hàng</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={codActive} onChange={() => setCodActive(!codActive)} />
                </div>

                {/* MoMo Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* MoMo styled badge */}
                    <div style={{
                      width: "44px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(236,72,153,0.1)",
                      border: "1px solid rgba(236,72,153,0.2)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: "900",
                      color: "#ec4899",
                      lineHeight: "9px"
                    }}>
                      <span>mo</span>
                      <span>mo</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>MoMo</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Thanh toán qua ví MoMo</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={momoActive} onChange={() => setMomoActive(!momoActive)} />
                </div>

              </div>

              {/* Right Column: Taxes & Currencies */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--adm-text-dim)", margin: "0 0 4px" }}>
                  Thuế & tiền tệ
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Tax VAT */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--adm-text-dim)", fontWeight: "500" }}>Thuế VAT (%)</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type="text"
                        value={vat}
                        onChange={(e) => setVat(e.target.value)}
                        style={{
                          padding: "10px 32px 10px 14px",
                          background: "rgba(13, 21, 38, 0.4)",
                          border: "1px solid var(--adm-border)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "13.5px",
                          outline: "none",
                          fontFamily: "inherit",
                          width: "100%",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--adm-text-muted)",
                          fontSize: "13.5px",
                          fontWeight: "600",
                          pointerEvents: "none",
                        }}
                      >
                        %
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                      Áp dụng cho tất cả cả sản phẩm (nếu có)
                    </span>
                  </div>

                  {/* Currency selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--adm-text-dim)", fontWeight: "500" }}>Đơn vị tiền tệ</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          background: "rgba(13, 21, 38, 0.4)",
                          border: "1px solid var(--adm-border)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "13.5px",
                          outline: "none",
                          fontFamily: "inherit",
                          width: "100%",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="VND (Việt Nam Đồng)">VND (Việt Nam Đồng)</option>
                        <option value="USD (Đô la Mỹ)">USD (Đô la Mỹ)</option>
                      </select>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--adm-text-muted)",
                          pointerEvents: "none",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                      Đơn vị tiền tệ hiển thị trên cửa hàng
                    </span>
                  </div>
                </div>

                {/* Round Price */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "50%", paddingRight: "8px" }}>
                  <label style={{ fontSize: "13px", color: "var(--adm-text-dim)", fontWeight: "500" }}>Làm tròn giá</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <select
                      value={roundPrice}
                      onChange={(e) => setRoundPrice(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="Làm tròn .000đ">Làm tròn .000đ</option>
                      <option value="Không làm tròn">Không làm tròn</option>
                    </select>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--adm-text-muted)",
                        pointerEvents: "none",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                    Cách làm tròn giá khi hiển thị
                  </span>
                </div>

              </div>

            </div>
          </div>

          {/* Row 3: Card D (Thông báo hệ thống) & Card E (Bảo mật tài khoản) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {/* Card D: Thông báo hệ thống */}
            <div
              className="admin-card"
              style={{
                padding: "24px",
                background: "rgba(13, 21, 38, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ color: "#60a5fa", display: "flex", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Thông báo hệ thống</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Row 1: Email notification */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Nhận thông báo qua Email</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Gửi thông báo hệ thống qua email</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                </div>

                {/* Row 2: SMS notification */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Nhận thông báo qua SMS</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Gửi thông báo quan trọng qua SMS</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={notifySMS} onChange={() => setNotifySMS(!notifySMS)} />
                </div>

                {/* Row 3: Low stock warning */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Cảnh báo tồn kho thấp</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Thông báo khi sản phẩm sắp hết hàng</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={lowStock} onChange={() => setLowStock(!lowStock)} />
                </div>

                {/* Row 4: New order notifications */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Thông báo đơn hàng mới</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Nhận thông báo khi có đơn hàng mới</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={newOrder} onChange={() => setNewOrder(!newOrder)} />
                </div>

              </div>
            </div>

            {/* Card E: Bảo mật tài khoản */}
            <div
              className="admin-card"
              style={{
                padding: "24px",
                background: "rgba(13, 21, 38, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ color: "#60a5fa", display: "flex", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Bảo mật tài khoản</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* 2FA Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Xác thực 2 lớp (2FA)</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Tăng cường bảo mật cho tài khoản của bạn</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={tfaActive} onChange={() => setTfaActive(!tfaActive)} />
                </div>

                {/* Session Expiry Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid var(--adm-border-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>Thời gian hết hạn phiên</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-muted)" }}>Tự động đăng xuất khi không hoạt động</p>
                    </div>
                  </div>
                  
                  {/* Styled Expiry Select */}
                  <div style={{ position: "relative", width: "110px" }}>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      style={{
                        padding: "6px 24px 6px 10px",
                        background: "rgba(13, 21, 38, 0.4)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "12.5px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="15 phút">15 phút</option>
                      <option value="30 phút">30 phút</option>
                      <option value="1 giờ">1 giờ</option>
                      <option value="8 giờ">8 giờ</option>
                    </select>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--adm-text-muted)",
                        pointerEvents: "none",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* API Key Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--adm-text-muted)", display: "flex", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0, paddingRight: "16px", flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>API Key</p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "12px",
                          color: "var(--adm-text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {apiKey}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rotate API Key Button */}
                  <button
                    onClick={handleRotateKey}
                    style={{
                      background: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(220,38,38,0.25)",
                      color: "#f87171",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                      boxShadow: "0 0 10px rgba(220,38,38,0.1)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(220,38,38,0.15)";
                      e.currentTarget.style.borderColor = "rgba(220,38,38,0.35)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(220,38,38,0.1)";
                      e.currentTarget.style.borderColor = "rgba(220,38,38,0.25)";
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>Đổi API Key</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
