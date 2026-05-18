import type { ActivityItem } from "../types/admin.types";
import type { ReactNode } from "react";

const TYPE_STYLE: Record<
  ActivityItem["type"],
  { icon: ReactNode; bg: string; border: string; color: string }
> = {
  order: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    bg: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "#34d399",
  },
  user: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="17" y1="11" x2="23" y2="11" />
      </svg>
    ),
    bg: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
  },
  product: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    bg: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    color: "#fbbf24",
  },
  system: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    bg: "rgba(139, 92, 246, 0.12)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    color: "#a78bfa",
  },
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

function formatActivityText(text: string) {
  // Try to parse order format: "Đơn hàng #ORD-1024 đã được tạo"
  if (text.includes("đã được tạo")) {
    const match = text.match(/(Đơn hàng\s+#ORD-\d+)\s+(đã được tạo)/i) || text.match(/(Đơn hàng\s+\S+)\s+(đã được tạo)/i);
    if (match) {
      const codePart = match[1].replace("Đơn hàng", "").trim();
      return (
        <>
          <strong style={{ color: "#fff", fontWeight: 600 }}>Đơn hàng</strong>{" "}
          <span style={{ color: "#818cf8", fontFamily: "var(--adm-mono)", fontWeight: 500, fontSize: "12px" }}>
            {codePart}
          </span>{" "}
          đã được tạo
        </>
      );
    }
  }

  // Try to parse user registration format: "Khách hàng Nguyễn Minh Anh đã đăng ký"
  if (text.includes("đã đăng ký")) {
    const name = text.replace("Khách hàng", "").replace("đã đăng ký", "").trim();
    return (
      <>
        Khách hàng <strong style={{ color: "#fff", fontWeight: 600 }}>{name}</strong> đã đăng ký
      </>
    );
  }

  // Try to parse product updates format: "Sản phẩm Tai Nghe Bluetooth Sony WH-1000XM5 đã được cập nhật"
  if (text.includes("đã được cập nhật")) {
    const prod = text.replace("Sản phẩm", "").replace("đã được cập nhật", "").trim();
    return (
      <>
        Sản phẩm <strong style={{ color: "#fff", fontWeight: 600 }}>{prod}</strong> đã được cập nhật
      </>
    );
  }

  // Try to parse system logins format: "Nhân viên Trần Văn Nam đã đăng nhập"
  if (text.includes("đã đăng nhập")) {
    const staff = text.replace("Nhân viên", "").replace("đã đăng nhập", "").trim();
    return (
      <>
        Nhân viên <strong style={{ color: "#fff", fontWeight: 600 }}>{staff}</strong> đã đăng nhập
      </>
    );
  }

  return text;
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {items.map((item) => {
        const styleInfo = TYPE_STYLE[item.type] || TYPE_STYLE.system;
        return (
          <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: styleInfo.bg,
                border: styleInfo.border,
                color: styleInfo.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {styleInfo.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12.5px", color: "var(--adm-text-dim)", margin: 0, lineHeight: 1.4 }}>
                {formatActivityText(item.user)}
              </p>
              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>{item.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
