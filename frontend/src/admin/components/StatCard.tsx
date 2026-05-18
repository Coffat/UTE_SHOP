import type { StatCard } from "../types/admin.types";

interface StatCardProps {
  card: StatCard;
  animate?: boolean;
}

const COLOR_CONFIG = {
  indigo: {
    bg:      "rgba(99, 102, 241, 0.12)",
    border:  "rgba(99, 102, 241, 0.25)",
    icon:    "rgba(99, 102, 241, 0.2)",
    iconClr: "#6366f1",
    text:    "#818cf8",
    glow:    "rgba(99, 102, 241, 0.15)",
  },
  emerald: {
    bg:      "rgba(16, 185, 129, 0.12)",
    border:  "rgba(16, 185, 129, 0.25)",
    icon:    "rgba(16, 185, 129, 0.2)",
    iconClr: "#10b981",
    text:    "#34d399",
    glow:    "rgba(16, 185, 129, 0.15)",
  },
  purple: {
    bg:      "rgba(168, 85, 247, 0.12)",
    border:  "rgba(168, 85, 247, 0.25)",
    icon:    "rgba(168, 85, 247, 0.2)",
    iconClr: "#a855f7",
    text:    "#c084fc",
    glow:    "rgba(168, 85, 247, 0.15)",
  },
  amber: {
    bg:      "rgba(245, 158, 11, 0.12)",
    border:  "rgba(245, 158, 11, 0.25)",
    icon:    "rgba(245, 158, 11, 0.2)",
    iconClr: "#f59e0b",
    text:    "#fbbf24",
    glow:    "rgba(245, 158, 11, 0.15)",
  },
  rose: {
    bg:      "rgba(244, 63, 94, 0.12)",
    border:  "rgba(244, 63, 94, 0.25)",
    icon:    "rgba(244, 63, 94, 0.2)",
    iconClr: "#f43f5e",
    text:    "#fb7185",
    glow:    "rgba(244, 63, 94, 0.15)",
  },
};

import React from "react";

const STAT_ICONS: Record<string, React.ReactNode> = {
  revenue: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 002 2h14v-8H6a2 2 0 00-2 2v2" /></svg>,
  orders: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
  rate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  tasks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  products: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  completed: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
};

const STAT_SPARKLINES: Record<string, string> = {
  revenue: "M0,25 C10,25 15,20 20,22 C30,26 40,15 45,18 C50,21 55,10 60,15 C65,20 70,12 75,5 C80,0 85,10 90,8 C95,5 100,0 100,0",
  orders: "M0,25 C10,25 15,20 20,22 C30,26 40,15 45,18 C50,21 55,10 60,15 C65,20 70,12 75,5 C80,0 85,10 90,8 C95,5 100,0 100,0",
  users: "M0,25 C10,25 15,20 20,22 C30,26 40,15 45,18 C50,21 55,10 60,15 C65,20 70,12 75,5 C80,0 85,10 90,8 C95,5 100,0 100,0",
  rate: "M0,5 C10,5 15,10 20,8 C30,4 40,15 45,12 C50,9 55,20 60,15 C65,10 70,18 75,25 C80,30 85,20 90,22 C95,25 100,30 100,30",
};

const renderValue = (val: string | number) => {
  const str = typeof val === "number" ? val.toLocaleString("vi-VN") : String(val);
  if (str.includes("₫")) {
    const parts = str.split("₫");
    return (
      <>
        {parts[0]}
        <span style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>₫</span>
        {parts[1]}
      </>
    );
  }
  return str;
};

export function StatCardWidget({ card }: StatCardProps) {
  const cfg = COLOR_CONFIG[card.color];
  const isPositive = card.change >= 0;
  const iconNode = STAT_ICONS[card.icon] || card.icon;
  // Use a fallback path if not defined
  const sparklinePath = STAT_SPARKLINES[card.id] || STAT_SPARKLINES.revenue;

  return (
    <div className="admin-stat-card">
      {/* Top Row: Icon Box on Left, Label + Info on Right */}
      <div className="admin-stat-top">
        <div
          className="admin-stat-icon-wrap"
          style={{
            background: cfg.icon,
            color: cfg.iconClr,
            borderColor: cfg.border,
            borderWidth: "1px",
            borderStyle: "solid",
            boxShadow: `0 0 12px ${cfg.glow}`
          }}
        >
          {iconNode}
        </div>
        <div className="admin-stat-label-wrap">
          <span className="admin-stat-label">{card.label}</span>
          <svg className="admin-stat-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
      </div>

      {/* Middle Row: Value + Sparkline */}
      <div className="admin-stat-middle">
        <div className="admin-stat-value">
          {renderValue(card.value)}
        </div>
        <div className="admin-stat-sparkline">
          <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
            <path
              d={sparklinePath}
              stroke={cfg.iconClr}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`${sparklinePath} L100,30 L0,30 Z`}
              fill={`url(#grad-${card.color})`}
              stroke="none"
            />
            <defs>
              <linearGradient id={`grad-${card.color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.iconClr} stopOpacity="0.2" />
                <stop offset="100%" stopColor={cfg.iconClr} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Bottom Row: Footer trend info */}
      <div className="admin-stat-footer">
        <span
          className={`admin-stat-change ${isPositive ? "positive" : "negative"}`}
          style={{ color: isPositive ? "#10b981" : "#f43f5e" }}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(card.change)}%
        </span>
        <span className="admin-stat-change-label">{card.changeLabel}</span>
      </div>
    </div>
  );
}

interface StatGridProps {
  cards: StatCard[];
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
