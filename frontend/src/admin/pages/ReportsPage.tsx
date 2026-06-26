import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCardWidget } from "../components/StatCard";
import {
  fetchAdminReports,
  type ReportsData,
  type ReportsOrderSource,
  type ReportsPeriod,
  type ReportsTopProduct,
} from "../services/adminReports.api";

const chartTooltipStyle = {
  backgroundColor: "#0d1526",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  backdropFilter: "blur(12px)",
};

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 46;

function buildDonutSegments(sources: ReportsOrderSource[]) {
  let cumulative = 0;
  return sources.map((source, index) => {
    const arc = (source.percentage / 100) * DONUT_CIRCUMFERENCE;
    const gap = index < sources.length - 1 ? 2 : 0;
    const segment = {
      color: source.color,
      strokeDasharray: `${Math.max(arc - gap, 0)} ${DONUT_CIRCUMFERENCE}`,
      strokeDashoffset: -cumulative,
    };
    cumulative += arc;
    return segment;
  });
}

const PRODUCT_AVATARS = [
  { avatarBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)", avatarSymbol: "🌸" },
  { avatarBg: "linear-gradient(135deg, #a78bfa, #7c3aed)", avatarSymbol: "💐" },
  { avatarBg: "linear-gradient(135deg, #10b981, #059669)", avatarSymbol: "🌹" },
  { avatarBg: "linear-gradient(135deg, #fb923c, #d97706)", avatarSymbol: "🪻" },
  { avatarBg: "linear-gradient(135deg, #ef4444, #dc2626)", avatarSymbol: "🌻" },
];

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportsPeriod>("30d");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExportExcel = () => {
    if (!data) return;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // 1. Stats Sheet
    const statsData = data.stats.map(s => ({
      'Chỉ số': s.label,
      'Giá trị': s.value,
      'Thay đổi (%)': s.change,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsData), "Tổng quan");
    
    // 2. Top Products Sheet
    const productsData = data.topProducts.map(p => ({
      'Sản phẩm': p.name,
      'SKU': p.sku,
      'Đã bán': p.sold,
      'Doanh thu': p.revenue,
      'Tăng trưởng': p.growth
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), "Top Sản phẩm");
    
    // 3. Category Revenue Sheet
    const categoryData = data.categoryRevenue.map(c => ({
      'Danh mục': c.category,
      'Doanh thu (Tỷ/Triệu)': c.label
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryData), "Doanh thu Danh mục");
    
    // 4. Order Sources Sheet
    const sourcesData = data.orderSources.map(s => ({
      'Nguồn': s.name,
      'Đơn hàng': s.count,
      'Tỷ lệ (%)': s.percentage
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourcesData), "Nguồn Đơn hàng");
    
    // Save file
    XLSX.writeFile(wb, `BaoCao_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    setShowExportDropdown(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminReports(period, 5)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch reports:", err);
        if (!cancelled) {
          setData(null);
          setError("Không thể tải báo cáo. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, reloadKey]);

  const report: ReportsData =
    data ??
    ({
      period,
      periodLabel: "Không có dữ liệu",
      stats: [],
      revenueGrowth: [],
      categoryRevenue: [],
      orderSources: [],
      totalOrdersInPeriod: 0,
      topProducts: [],
      channelPerformance: [],
      monthlyGoal: { target: "0 đ", achievedPercent: 0 },
    } as ReportsData);
  const revenueGrowth = report?.revenueGrowth ?? [];
  const categoryRevenue = report?.categoryRevenue ?? [];
  const orderSources = report?.orderSources ?? [];
  const topProducts: ReportsTopProduct[] = report?.topProducts ?? [];
  const channelPerformance = report?.channelPerformance ?? [];
  const donutSegments = useMemo(() => buildDonutSegments(orderSources), [orderSources]);

  const maxRevenueGrowth = Math.max(...revenueGrowth.map((d) => d.value), 0.5);
  const maxCategoryValue = Math.max(...categoryRevenue.map((d) => d.value), 0.5);

  const statIconMap: Record<string, React.ReactNode> = {
    "report-revenue": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    "report-profit": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    "report-aov": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    "report-returns": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
      </svg>
    ),
  };

  const statSparklines: Record<string, string> = {
    "report-revenue": "M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    "report-profit": "M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16",
    "report-aov": "M2 24L12 12L22 24L32 14L44 26L56 16L68 20L76 8",
    "report-returns": "M2 22L12 26L22 14L32 18L44 8L56 24L68 12L76 16",
  };

  const statCards = report.stats.map((stat) => ({
    ...stat,
    icon: statIconMap[stat.id],
    sparklinePoints: statSparklines[stat.id],
  }));

  // Custom node labels for Area/Line Chart
  const CustomLineLabel = (props: any) => {
    const { x, y, value } = props;
    if (value === undefined) return null;
    return (
      <text x={x} y={y - 8} fill="#fff" fontSize={10} fontWeight={600} textAnchor="middle">
        {value}B
      </text>
    );
  };

  // Custom bar labels for vertical Bar Chart
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined) return null;
    const labelText = value >= 1.0 ? `${value.toFixed(1)}B` : `${Math.round(value * 1000)}M`;
    return (
      <text x={x + width / 2} y={y - 8} fill="#fff" fontSize={10} fontWeight={600} textAnchor="middle">
        {labelText}
      </text>
    );
  };

  if (loading && !data) {
    return (
      <div className="admin-page" style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
        Đang tải báo cáo...
      </div>
    );
  }

  if (!loading && !report) {
    return (
      <div className="admin-page" style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: "#fda4af", marginBottom: "12px" }}>{error || "Không có dữ liệu báo cáo."}</p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => setReloadKey((prev) => prev + 1)}
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      
      {/* Top Header Section */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Báo cáo</h2>
          <p className="admin-page-subtitle">
            Phân tích doanh thu, đơn hàng và hiệu suất bán hàng
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Custom Date Range Selector */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                background: "rgba(13, 21, 38, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                color: "var(--adm-text-dim)",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                height: "38px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--adm-text-muted)" }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{report.periodLabel}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--adm-text-muted)", marginLeft: "4px", transform: showPeriodDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            
            {showPeriodDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                background: "#0d1526",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "4px",
                width: "180px",
                zIndex: 100,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              }}>
                <div onClick={() => { setPeriod("7d"); setShowPeriodDropdown(false); }} style={{ padding: "8px 12px", fontSize: "13px", color: period === "7d" ? "#60a5fa" : "#e2e8f0", cursor: "pointer", borderRadius: "4px", background: period === "7d" ? "rgba(96,165,250,0.1)" : "transparent" }} onMouseOver={(e) => { if (period !== "7d") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }} onMouseOut={(e) => { if (period !== "7d") e.currentTarget.style.background = "transparent" }}>7 ngày qua</div>
                <div onClick={() => { setPeriod("30d"); setShowPeriodDropdown(false); }} style={{ padding: "8px 12px", fontSize: "13px", color: period === "30d" ? "#60a5fa" : "#e2e8f0", cursor: "pointer", borderRadius: "4px", background: period === "30d" ? "rgba(96,165,250,0.1)" : "transparent" }} onMouseOver={(e) => { if (period !== "30d") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }} onMouseOut={(e) => { if (period !== "30d") e.currentTarget.style.background = "transparent" }}>30 ngày qua</div>
                <div onClick={() => { setPeriod("month"); setShowPeriodDropdown(false); }} style={{ padding: "8px 12px", fontSize: "13px", color: period === "month" ? "#60a5fa" : "#e2e8f0", cursor: "pointer", borderRadius: "4px", background: period === "month" ? "rgba(96,165,250,0.1)" : "transparent" }} onMouseOver={(e) => { if (period !== "month") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }} onMouseOut={(e) => { if (period !== "month") e.currentTarget.style.background = "transparent" }}>Tháng này</div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="admin-btn admin-btn-primary"
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
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "38px",
                transition: "all 0.2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Xuất Báo cáo</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", transform: showExportDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            
            {showExportDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                background: "#0d1526",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "4px",
                width: "160px",
                zIndex: 100,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              }}>
                <div onClick={handleExportExcel} style={{ padding: "8px 12px", fontSize: "13px", color: "#10b981", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Xuất Excel
                </div>
                <div onClick={handleExportPDF} style={{ padding: "8px 12px", fontSize: "13px", color: "#f43f5e", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  In PDF
                </div>
              </div>
            )}
          </div>
        </div>
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

      {/* Middle Row: 3 Custom Bento Widgets Layout (12-Column Grid) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "20px",
          alignItems: "stretch"
        }}
      >
        
        {/* Widget 1: Tăng trưởng doanh thu (6 Columns) */}
        <div
          className="admin-card"
          style={{
            gridColumn: "span 7",
            padding: "24px",
            background: "rgba(13, 21, 38, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--adm-border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Tăng trưởng doanh thu</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ fontSize: "12px", color: "var(--adm-text-dim)" }}>Doanh thu (đ)</span>
            </div>
          </div>

          <div className="h-[320px] min-h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGrowth} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="glow-area-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                    <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, Math.ceil(maxRevenueGrowth * 1.2 * 10) / 10]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? "0" : `${Number(v).toFixed(1)}B`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: any) => [`${v.toFixed(1)}B đ`, "Doanh thu"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#glow-area-blue)"
                  dot={{ fill: "#6366f1", r: 4, strokeWidth: 1.5, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                  label={<CustomLineLabel />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 2: Doanh thu theo danh mục (3 Columns) */}
        <div
          className="admin-card"
          style={{
            gridColumn: "span 3",
            padding: "24px",
            background: "rgba(13, 21, 38, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--adm-border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Doanh thu theo danh mục</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }} />
              <span style={{ fontSize: "11px", color: "var(--adm-text-dim)" }}>Doanh thu (đ)</span>
            </div>
          </div>

          <div className="h-[320px] min-h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="glow-bar-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, Math.ceil(maxCategoryValue * 1.2 * 10) / 10]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (n === 0) return "0";
                    if (n < 1) return `${Math.round(n * 1000)}M`;
                    return `${n.toFixed(1)}B`;
                  }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: any) => [`${v >= 1.0 ? `${v.toFixed(1)}B` : `${Math.round(v * 1000)}M`} đ`, "Doanh thu"]}
                />
                <Bar
                  dataKey="value"
                  fill="url(#glow-bar-blue)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  label={<CustomBarLabel />}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 3: Nguồn đơn hàng (3 Columns) Donut SVG */}
        <div
          className="admin-card"
          style={{
            gridColumn: "span 2",
            padding: "24px",
            background: "rgba(13, 21, 38, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--adm-border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: "0 0 20px" }}>Nguồn đơn hàng</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              flex: 1
            }}
          >
            {/* Vector SVG Donut Chart */}
            <div style={{ position: "relative", width: "130px", height: "130px" }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                {/* Circumference = 2 * Math.PI * 46 = 289.02
                    Segment gap adjustments:
                    - Website (49% = 141.6): offset -86.4 (-90deg), length = 139.6, gap = 2
                    - Shopee (24.8% = 71.7): offset -228 (-141.6), length = 69.7, gap = 2
                    - Lazada (14.4% = 41.6): offset -299.7 (-213.3), length = 39.6, gap = 2
                    - Tiktok (7.7% = 22.3): offset -341.3 (-254.9), length = 20.3, gap = 2
                    - Facebook (4.0% = 11.6): offset -363.6 (-277.2), length = 9.6, gap = 2
                */}
                <circle cx="65" cy="65" r="46" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                {donutSegments.map((segment, index) => (
                  <circle
                    key={index}
                    cx="65"
                    cy="65"
                    r="46"
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    transform="rotate(-90 65 65)"
                    style={{ transition: "stroke-dasharray 0.3s" }}
                  />
                ))}
              </svg>

              {/* Center Donut text label */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#fff", fontFamily: "var(--adm-mono)" }}>{report.totalOrdersInPeriod.toLocaleString("vi-VN")}</span>
                <span style={{ fontSize: "10px", color: "var(--adm-text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Tổng đơn</span>
              </div>
            </div>

            {/* Vertically Aligned Compact Legends */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {orderSources.map((source, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: source.color }} />
                    <span style={{ color: "var(--adm-text-dim)", fontWeight: 550 }}>{source.name}</span>
                  </div>
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {source.count} <span style={{ color: "var(--adm-text-muted)", fontWeight: 400, fontSize: "11px" }}>({source.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Centered Detail Link */}
            <div style={{ borderTop: "1px solid var(--adm-border)", width: "100%", paddingTop: "12px", display: "flex", justifyContent: "center" }}>
              <Link
                to="/admin/orders"
                style={{
                  fontSize: "12px",
                  color: "#60a5fa",
                  textDecoration: "none",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "color 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#82b1ff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#60a5fa")}
              >
                <span>Xem chi tiết</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Splits into 2 widgets (65% / 35% Columns) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Widget 1: Top sản phẩm bán chạy (Left, wide) */}
        <div
          className="admin-card"
          style={{
            padding: "24px",
            background: "rgba(13, 21, 38, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--adm-border)",
            borderRadius: "12px",
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Top sản phẩm bán chạy</h3>
            <Link
              to="/admin/products"
              style={{
                fontSize: "13px",
                color: "#60a5fa",
                textDecoration: "none",
                fontWeight: "600",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#82b1ff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#60a5fa")}
            >
              Xem tất cả
            </Link>
          </div>

          {/* Table list of products */}
          <div className="admin-table-wrap" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--adm-border)" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                  <th style={{ width: "50px", padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>#</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Sản phẩm</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>SKU</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Đã bán</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Doanh thu</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Tăng trưởng</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      Chưa có dữ liệu bán hàng trong kỳ này.
                    </td>
                  </tr>
                ) : topProducts.map((prod, index) => {
                  const avatar = PRODUCT_AVATARS[index % PRODUCT_AVATARS.length];
                  return (
                  <tr
                    key={prod.id}
                    className="admin-table-row"
                    style={{
                      borderBottom: index === topProducts.length - 1 ? "none" : "1px solid var(--adm-border)",
                      background: "transparent",
                      transition: "background 0.2s"
                    }}
                  >
                    {/* Index */}
                    <td style={{ padding: "12px 16px", color: "var(--adm-text-muted)", fontSize: "13px", fontWeight: "600" }}>
                      {index + 1}
                    </td>
                    
                    {/* Product visual + Name */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Rounded custom card image block */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: prod.mainImageUrl ? "rgba(255,255,255,0.03)" : avatar.avatarBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {prod.mainImageUrl ? (
                            <img
                              src={prod.mainImageUrl}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            avatar.avatarSymbol
                          )}
                        </div>
                        <span style={{ fontWeight: 550, color: "#fff", fontSize: "13.5px" }}>
                          {prod.name}
                        </span>
                      </div>
                    </td>

                    {/* SKU code */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "var(--adm-mono)", fontSize: "12.5px", color: "var(--adm-text-dim)" }}>
                        {prod.sku}
                      </span>
                    </td>

                    {/* Quantity sold */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--adm-text)" }}>
                        {prod.sold}
                      </span>
                    </td>

                    {/* Product Revenue */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#fff", fontFamily: "var(--adm-mono)" }}>
                        {prod.revenue}
                      </span>
                    </td>

                    {/* Growth rate */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: "600",
                          color: prod.isUp ? "#10b981" : "#ef4444",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {prod.isUp ? "↑" : "↓"} {prod.growth}
                      </span>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 2: Hiệu suất theo kênh (Right, narrow) */}
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
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Hiệu suất theo kênh</h3>
            <a
              href="#view-all-channels"
              style={{
                fontSize: "13px",
                color: "#60a5fa",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Xem tất cả
            </a>
          </div>

          {/* List of channels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {channelPerformance.map((channel, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Circle icon container */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: channel.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        color: channel.color
                      }}
                    >
                      {channel.name === "Website" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      )}
                      {channel.name === "Shopee" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      )}
                      {channel.name === "Lazada" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                        </svg>
                      )}
                      {channel.name === "Tiktok Shop" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      )}
                      {channel.name === "Facebook" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#fff" }}>{channel.name}</span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "13px", color: "var(--adm-text-dim)", fontFamily: "var(--adm-mono)" }}>
                      {channel.revenue}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      {channel.ratio}
                    </span>
                  </div>
                </div>

                {/* Progress bar and Target */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${channel.progress}%`,
                        height: "100%",
                        background: channel.progress >= 70 ? "#3b82f6" : channel.progress >= 50 ? "#fb923c" : "#ef4444",
                        borderRadius: "3px",
                        boxShadow: `0 0 8px ${channel.progress >= 70 ? "rgba(59,130,246,0.3)" : channel.progress >= 50 ? "rgba(251,146,60,0.3)" : "rgba(239,68,68,0.3)"}`
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "600", width: "30px", textAlign: "right", color: channel.progress >= 70 ? "#60a5fa" : channel.progress >= 50 ? "#fb923c" : "#f87171" }}>
                    {channel.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Goal footer target with thick green progress bar */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--adm-border)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: "var(--adm-text-dim)" }}>
                Mục tiêu doanh thu tháng: <strong style={{ color: "#fff", fontFamily: "var(--adm-mono)" }}>{report.monthlyGoal.target}</strong>
              </span>
              <span style={{ color: "#10b981", fontWeight: "600" }}>
                Đạt {report.monthlyGoal.achievedPercent}%
              </span>
            </div>

            {/* Glowing target bar */}
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${report.monthlyGoal.achievedPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #10b981, #34d399)",
                  borderRadius: "4px",
                  boxShadow: "0 0 12px rgba(16,185,129,0.5)"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
