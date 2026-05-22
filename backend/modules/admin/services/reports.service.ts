import {
  resolveReportsPeriodRange,
  sumCompletedRevenueInRange,
  sumGrossProfitInRange,
  countCompletedOrdersInRange,
  countAllOrdersInRange,
  countCancelledOrdersInRange,
  getRevenueGrowthLast12Months,
  getCategoryRevenueInRange,
  getOrderSourcesInRange,
  getTopProductsInRange,
  type ReportsPeriod,
} from '../repositories/reports.repository.js';

const MONTHLY_REVENUE_TARGET = 5_000_000_000;

const calcChangePercent = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const formatVnd = (amount: number): string =>
  `${amount.toLocaleString('vi-VN')} đ`;

const CHANNEL_COLORS = ['#3b82f6', '#fb923c', '#a78bfa', '#fb7185', '#60a5fa'];
const CHANNEL_BGS = [
  'rgba(59,130,246,0.12)',
  'rgba(251,146,60,0.12)',
  'rgba(167,139,250,0.12)',
  'rgba(251,113,133,0.12)',
  'rgba(96,165,250,0.12)',
];

export interface ReportsStatCardDto {
  id: string;
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  color: 'indigo' | 'purple' | 'cyan' | 'amber';
  tooltip: string;
}

export interface ReportsDataDto {
  period: ReportsPeriod;
  periodLabel: string;
  stats: ReportsStatCardDto[];
  revenueGrowth: { month: string; value: number; label: string }[];
  categoryRevenue: { category: string; value: number; label: string }[];
  orderSources: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  totalOrdersInPeriod: number;
  topProducts: {
    id: string;
    name: string;
    sku: string;
    sold: number;
    revenue: string;
    growth: string;
    isUp: boolean;
  }[];
  channelPerformance: {
    name: string;
    revenue: string;
    ratio: string;
    progress: number;
    color: string;
    bg: string;
  }[];
  monthlyGoal: {
    target: string;
    achievedPercent: number;
  };
}

export const getAdminReports = async (
  period: ReportsPeriod = '30d',
  topLimit = 5
): Promise<ReportsDataDto> => {
  const range = resolveReportsPeriodRange(period);
  const safeLimit = Math.min(Math.max(1, topLimit), 20);

  const [
    revenueCurrent,
    revenuePrevious,
    profitCurrent,
    profitPrevious,
    completedCurrent,
    completedPrevious,
    allOrdersCurrent,
    cancelledCurrent,
    revenueGrowth,
    categoryRevenue,
    orderSourcesRaw,
    topProducts,
  ] = await Promise.all([
    sumCompletedRevenueInRange(range.start, range.end),
    sumCompletedRevenueInRange(range.prevStart, range.prevEnd),
    sumGrossProfitInRange(range.start, range.end),
    sumGrossProfitInRange(range.prevStart, range.prevEnd),
    countCompletedOrdersInRange(range.start, range.end),
    countCompletedOrdersInRange(range.prevStart, range.prevEnd),
    countAllOrdersInRange(range.start, range.end),
    countCancelledOrdersInRange(range.start, range.end),
    getRevenueGrowthLast12Months(),
    getCategoryRevenueInRange(range.start, range.end, 6),
    getOrderSourcesInRange(range.start, range.end),
    getTopProductsInRange(
      range.start,
      range.end,
      range.prevStart,
      range.prevEnd,
      safeLimit
    ),
  ]);

  const aovCurrent =
    completedCurrent > 0 ? Math.round(revenueCurrent / completedCurrent) : 0;
  const aovPrevious =
    completedPrevious > 0
      ? Math.round(revenuePrevious / completedPrevious)
      : 0;

  const returnRateCurrent =
    allOrdersCurrent > 0
      ? Math.round((cancelledCurrent / allOrdersCurrent) * 10000) / 100
      : 0;

  const prevAllOrders = await countAllOrdersInRange(range.prevStart, range.prevEnd);
  const prevCancelled = await countCancelledOrdersInRange(
    range.prevStart,
    range.prevEnd
  );
  const returnRatePrevious =
    prevAllOrders > 0
      ? Math.round((prevCancelled / prevAllOrders) * 10000) / 100
      : 0;

  const changeLabel = 'so với kỳ trước';

  const stats: ReportsStatCardDto[] = [
    {
      id: 'report-revenue',
      label: 'Doanh thu',
      value: revenueCurrent,
      change: calcChangePercent(revenueCurrent, revenuePrevious),
      changeLabel,
      color: 'indigo',
      tooltip: 'Tổng doanh thu đơn hoàn tất trong kỳ',
    },
    {
      id: 'report-profit',
      label: 'Lợi nhuận gộp',
      value: profitCurrent,
      change: calcChangePercent(profitCurrent, profitPrevious),
      changeLabel,
      color: 'purple',
      tooltip: 'Subtotal trừ giảm giá trên đơn hoàn tất',
    },
    {
      id: 'report-aov',
      label: 'AOV',
      value: aovCurrent,
      change: calcChangePercent(aovCurrent, aovPrevious),
      changeLabel,
      color: 'cyan',
      tooltip: 'Giá trị trung bình mỗi đơn hoàn tất',
    },
    {
      id: 'report-returns',
      label: 'Tỷ lệ hoàn đơn',
      value: `${returnRateCurrent.toFixed(2)}%`,
      change: calcChangePercent(returnRateCurrent, returnRatePrevious),
      changeLabel,
      color: 'amber',
      tooltip: 'Tỷ lệ đơn hủy trên tổng đơn trong kỳ',
    },
  ];

  const totalRevenueByChannel = orderSourcesRaw.reduce((sum, s) => sum + s.revenue, 0);

  const orderSources = orderSourcesRaw.map((s) => ({
    name: s.name,
    count: s.count,
    percentage: s.percentage,
    color: s.color,
  }));

  const channelPerformance = orderSourcesRaw.map((source, idx) => {
    const revenue = source.revenue;
    const ratio =
      totalRevenueByChannel > 0
        ? Math.round((revenue / totalRevenueByChannel) * 1000) / 10
        : 0;
    return {
      name: source.name,
      revenue: formatVnd(revenue),
      ratio: `${ratio}%`,
      progress: Math.min(100, Math.max(0, Math.round(ratio))),
      color: CHANNEL_COLORS[idx % CHANNEL_COLORS.length],
      bg: CHANNEL_BGS[idx % CHANNEL_BGS.length],
    };
  });

  const achievedPercent =
    MONTHLY_REVENUE_TARGET > 0
      ? Math.min(
          100,
          Math.round((revenueCurrent / MONTHLY_REVENUE_TARGET) * 1000) / 10
        )
      : 0;

  return {
    period,
    periodLabel: range.label,
    stats,
    revenueGrowth: revenueGrowth.map(({ month, value, label }) => ({
      month,
      value,
      label,
    })),
    categoryRevenue: categoryRevenue.map(({ category, value, label }) => ({
      category,
      value,
      label,
    })),
    orderSources,
    totalOrdersInPeriod: allOrdersCurrent,
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      mainImageUrl: p.mainImageUrl,
      sold: p.sold,
      revenue: formatVnd(p.revenue),
      growth: `${Math.abs(p.growth).toFixed(1)}%`,
      isUp: p.isUp,
    })),
    channelPerformance,
    monthlyGoal: {
      target: formatVnd(MONTHLY_REVENUE_TARGET),
      achievedPercent,
    },
  };
};
