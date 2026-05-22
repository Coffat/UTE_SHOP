import { getOrders } from '../../order/services/order.service.js';
import type { AdminOrderListItemDto } from '../../../shared/mappers/order.mapper.js';
import { getAdminLowStockAlerts } from '../../catalog/services/product.service.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import {
  resolvePeriodRange,
  sumCompletedRevenue,
  countOrdersInRange,
  countCompletedOrdersInRange,
  countNewCustomersInRange,
  countPendingOrders,
  getRevenueChartLast12Months,
  getOrderStatusBreakdown,
  getRecentCustomersForActivity,
  type DashboardPeriod,
} from '../repositories/dashboard.repository.js';

export interface DashboardStatDto {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export interface DashboardRecentOrderDto {
  id: string;
  orderCode: string;
  customer: string;
  product: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

export interface DashboardActivityDto {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'order' | 'user' | 'product' | 'system';
}

export interface DashboardLowStockDto {
  id: string;
  name: string;
  stock: number;
}

export interface AdminDashboardDto {
  period: DashboardPeriod;
  periodLabel: string;
  stats: DashboardStatDto[];
  revenueChart: { month: string; revenue: number; orders: number }[];
  orderStatusBreakdown: { name: string; value: number; fill: string; percentage: string }[];
  recentOrders: DashboardRecentOrderDto[];
  lowStock: DashboardLowStockDto[];
  activityFeed: DashboardActivityDto[];
  staffStats: DashboardStatDto[];
  pendingOrdersCount: number;
}

const calcChangePercent = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const formatVndShort = (amount: number): string => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₫`;
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

const mapOrderStatusToUi = (
  status: OrderStatus
): DashboardRecentOrderDto['status'] => {
  if (status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED || status === OrderStatus.READY) {
    return 'pending';
  }
  if (status === OrderStatus.DELIVERING) return 'shipped';
  if (status === OrderStatus.COMPLETED) return 'delivered';
  if (status === OrderStatus.CANCELLED) return 'cancelled';
  return 'processing';
};

const formatOrderDate = (iso: string): string =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatActivityTime = (iso: string | Date): string =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export const getAdminDashboard = async (
  period: DashboardPeriod = '30d'
): Promise<AdminDashboardDto> => {
  const range = resolvePeriodRange(period);

  const [
    revenueCurrent,
    revenuePrevious,
    ordersCurrent,
    ordersPrevious,
    completedCurrent,
    completedPrevious,
    customersCurrent,
    customersPrevious,
    revenueChart,
    orderStatusBreakdown,
    recentOrdersResult,
    lowStockAlerts,
    recentCustomers,
    pendingOrdersCount,
  ] = await Promise.all([
    sumCompletedRevenue(range.start, range.end),
    sumCompletedRevenue(range.prevStart, range.prevEnd),
    countOrdersInRange(range.start, range.end),
    countOrdersInRange(range.prevStart, range.prevEnd),
    countCompletedOrdersInRange(range.start, range.end),
    countCompletedOrdersInRange(range.prevStart, range.prevEnd),
    countNewCustomersInRange(range.start, range.end),
    countNewCustomersInRange(range.prevStart, range.prevEnd),
    getRevenueChartLast12Months(),
    getOrderStatusBreakdown(),
    getOrders({ page: 1, limit: 5 }),
    getAdminLowStockAlerts(5),
    getRecentCustomersForActivity(3),
    countPendingOrders(),
  ]);

  const conversionCurrent =
    ordersCurrent > 0 ? (completedCurrent / ordersCurrent) * 100 : 0;
  const conversionPrevious =
    ordersPrevious > 0 ? (completedPrevious / ordersPrevious) * 100 : 0;

  const prevLabel = `so với kỳ trước (${range.label})`;

  const stats: DashboardStatDto[] = [
    {
      id: 'revenue',
      label: 'Doanh thu',
      value: formatVndShort(revenueCurrent),
      change: calcChangePercent(revenueCurrent, revenuePrevious),
      changeLabel: prevLabel,
      icon: 'revenue',
      color: 'indigo',
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      value: ordersCurrent.toLocaleString('vi-VN'),
      change: calcChangePercent(ordersCurrent, ordersPrevious),
      changeLabel: prevLabel,
      icon: 'orders',
      color: 'purple',
    },
    {
      id: 'users',
      label: 'Khách hàng mới',
      value: customersCurrent,
      change: calcChangePercent(customersCurrent, customersPrevious),
      changeLabel: prevLabel,
      icon: 'users',
      color: 'emerald',
    },
    {
      id: 'rate',
      label: 'Tỷ lệ chuyển đổi',
      value: `${conversionCurrent.toFixed(2)}%`,
      change: calcChangePercent(conversionCurrent, conversionPrevious),
      changeLabel: prevLabel,
      icon: 'rate',
      color: 'amber',
    },
  ];

  const recentOrderItems = recentOrdersResult.items as AdminOrderListItemDto[];

  const recentOrders: DashboardRecentOrderDto[] = recentOrderItems.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    customer: order.customerName,
    product: 'Đơn hàng',
    amount: order.totalAmount,
    status: mapOrderStatusToUi(order.status),
    date: formatOrderDate(order.createdAt),
  }));

  const activityFeed: DashboardActivityDto[] = [
    ...recentOrderItems.slice(0, 3).map((order) => ({
      id: `order-${order.id}`,
      user: `Đơn hàng ${order.orderCode} đã được tạo`,
      action: '',
      target: '',
      time: formatActivityTime(order.createdAt),
      type: 'order' as const,
    })),
    ...recentCustomers.map((customer) => ({
      id: `user-${String(customer._id)}`,
      user: `Khách hàng ${customer.fullName} đã đăng ký`,
      action: '',
      target: '',
      time: formatActivityTime(customer.createdAt as Date),
      type: 'user' as const,
    })),
  ].slice(0, 5);

  const staffStats: DashboardStatDto[] = [
    {
      id: 'tasks',
      label: 'Nhiệm vụ hôm nay',
      value: 0,
      change: 0,
      changeLabel: 'Chưa có dữ liệu',
      icon: 'tasks',
      color: 'indigo',
    },
    {
      id: 'orders',
      label: 'Đơn cần xử lý',
      value: pendingOrdersCount,
      change: 0,
      changeLabel: 'Hiện tại',
      icon: 'orders',
      color: 'emerald',
    },
    {
      id: 'products',
      label: 'Sản phẩm cập nhật',
      value: 0,
      change: 0,
      changeLabel: 'Tuần này',
      icon: 'products',
      color: 'amber',
    },
    {
      id: 'completed',
      label: 'Hoàn thành hôm nay',
      value: `${conversionCurrent.toFixed(0)}%`,
      change: calcChangePercent(conversionCurrent, conversionPrevious),
      changeLabel: prevLabel,
      icon: 'completed',
      color: 'rose',
    },
  ];

  return {
    period,
    periodLabel: range.label,
    stats,
    revenueChart,
    orderStatusBreakdown,
    recentOrders,
    lowStock: lowStockAlerts.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
    })),
    activityFeed,
    staffStats,
    pendingOrdersCount,
  };
};
