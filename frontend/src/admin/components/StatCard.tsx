import type { StatCard } from "../types/admin.types";
import React from "react";

interface StatCardProps {
  card: Omit<StatCard, "color" | "icon"> & {
    color: "indigo" | "emerald" | "amber" | "rose" | "purple" | "cyan" | "blue";
    icon: string | React.ReactNode;
    tooltip?: string;
    sparklinePoints?: string;
  };
  animate?: boolean;
}

const COLOR_CONFIG = {
  indigo: {
    bg:      "rgba(99, 102, 241, 0.12)",
    border:  "rgba(99, 102, 241, 0.22)",
    iconClr: "#6366f1",
  },
  emerald: {
    bg:      "rgba(16, 185, 129, 0.12)",
    border:  "rgba(16, 185, 129, 0.22)",
    iconClr: "#10b981",
  },
  purple: {
    bg:      "rgba(168, 85, 247, 0.12)",
    border:  "rgba(168, 85, 247, 0.22)",
    iconClr: "#a855f7",
  },
  amber: {
    bg:      "rgba(245, 158, 11, 0.12)",
    border:  "rgba(245, 158, 11, 0.22)",
    iconClr: "#f59e0b",
  },
  rose: {
    bg:      "rgba(244, 63, 94, 0.12)",
    border:  "rgba(244, 63, 94, 0.22)",
    iconClr: "#f43f5e",
  },
  cyan: {
    bg:      "rgba(6, 182, 212, 0.12)",
    border:  "rgba(6, 182, 212, 0.22)",
    iconClr: "#06b6d4",
  },
  blue: {
    bg:      "rgba(59, 130, 246, 0.12)",
    border:  "rgba(59, 130, 246, 0.22)",
    iconClr: "#3b82f6",
  },
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  revenue: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 002 2h14v-8H6a2 2 0 00-2 2v2" /></svg>,
  orders: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
  rate: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  tasks: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  products: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  completed: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
};

const STAT_SPARKLINES: Record<string, string> = {
  revenue: "M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
  orders: "M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16",
  users: "M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8",
  rate: "M2 22L12 26L22 14L32 18L44 8L56 24L68 12L76 16",
};

const renderValue = (val: string | number) => {
  const str = typeof val === "number" ? val.toLocaleString("vi-VN") : String(val);
  if (str.includes("₫") || str.includes("đ")) {
    const char = str.includes("₫") ? "₫" : "đ";
    const parts = str.split(char);
    return (
      <>
        {parts[0]}
        <span style={{ fontSize: "18px", textDecoration: "none", marginLeft: "1px", fontWeight: 600 }}>{char}</span>
        {parts[1]}
      </>
    );
  }
  return str;
};

export function StatCardWidget({ card }: StatCardProps) {
  const cfg = COLOR_CONFIG[card.color] || COLOR_CONFIG.indigo;
  
  // Clean custom percent formatting if any
  let isPositive = true;
  let displayChange = "";

  if (typeof card.change === "number") {
    isPositive = card.change >= 0;
    displayChange = `${isPositive ? "↑" : "↓"} ${Math.abs(card.change).toFixed(1)}%`;
  } else {
    const cleanStr = String(card.change).trim();
    isPositive = !cleanStr.startsWith("-") && !cleanStr.startsWith("↓");
    displayChange = cleanStr;
    if (!displayChange.startsWith("↑") && !displayChange.startsWith("↓") && !displayChange.startsWith("-")) {
      displayChange = `${isPositive ? "↑" : "↓"} ${displayChange}`;
    }
  }

  const iconNode = typeof card.icon === "string" ? (STAT_ICONS[card.icon] || STAT_ICONS.revenue) : card.icon;
  const sparklinePoints = card.sparklinePoints || STAT_SPARKLINES[card.id] || STAT_SPARKLINES.revenue;
  const tooltipText = card.tooltip || card.label;

  return (
    <div className="admin-stat-card" style={{ gap: "16px" }}>
      {/* Top row: Icon + Text block and Sparkline */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
        
        {/* Left group: Icon + Info/Value */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Icon Container */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.iconClr,
            flexShrink: 0
          }}>
            {iconNode}
          </div>

          {/* Text: Label + Value */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>{card.label}</span>
              <span style={{ color: "#64748b", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }} title={tooltipText}>ⓘ</span>
            </div>
            <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0, fontFamily: "var(--adm-mono)", whiteSpace: "nowrap" }}>
              {renderValue(card.value)}
            </p>
          </div>
        </div>

        {/* Sparkline chart */}
        <div style={{ flexShrink: 0 }}>
          <svg width="78" height="32" viewBox="0 0 78 32" fill="none">
            <path d={sparklinePoints} stroke={cfg.iconClr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${sparklinePoints}V32H2Z`} fill={`url(#sparkline-grad-${card.id})`} opacity="0.08" />
            <defs>
              <linearGradient id={`sparkline-grad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.iconClr} />
                <stop offset="100%" stopColor={cfg.iconClr} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
      </div>

      {/* Bottom row: Trend metrics */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", marginTop: "auto" }}>
        <span style={{ color: isPositive ? "#10b981" : "#f43f5e", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {isPositive ? (
              <polyline points="18 15 12 9 6 15" />
            ) : (
              <polyline points="6 9 12 15 18 9" />
            )}
          </svg>
          {displayChange}
        </span>
        <span style={{ color: "#64748b" }}>{card.changeLabel}</span>
      </div>

    </div>
  );
}

interface StatGridProps {
  cards: any[];
}

export function StatGrid({ cards }: StatGridProps) {
  return (
    <div className="admin-stat-grid">
      {cards.map((card) => (
        <StatCardWidget key={card.id} card={card} />
      ))}
    </div>
  );
}
