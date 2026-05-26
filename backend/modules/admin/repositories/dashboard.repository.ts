import Order from '../../order/models/Order.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import Customer from '../../user/models/Customer.js';
import { ORDER_STATUS_GROUP_MAP } from '../../order/constants/orderStatusGroups.js';

export type DashboardPeriod = '7d' | '30d';

export interface PeriodRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export const resolvePeriodRange = (period: DashboardPeriod): PeriodRange => {
  const days = period === '7d' ? 7 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const prevEnd = new Date(start);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  return {
    start,
    end,
    prevStart,
    prevEnd,
    label: `${fmt(start)} - ${fmt(end)}`,
  };
};

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in (value as object)) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};

export const sumCompletedRevenue = async (start: Date, end: Date): Promise<number> => {
  const orders = await Order.find({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start, $lt: end },
  })
    .select('totalAmount')
    .lean();

  return orders.reduce((sum, o) => sum + decimalToNumber(o.totalAmount), 0);
};

export const countOrdersInRange = async (start: Date, end: Date): Promise<number> =>
  Order.countDocuments({ createdAt: { $gte: start, $lt: end } });

export const countCompletedOrdersInRange = async (start: Date, end: Date): Promise<number> =>
  Order.countDocuments({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start, $lt: end },
  });

export const countNewCustomersInRange = async (start: Date, end: Date): Promise<number> =>
  Customer.countDocuments({ createdAt: { $gte: start, $lt: end } });

export const countPendingOrders = async (): Promise<number> =>
  Order.countDocuments({ status: { $in: ORDER_STATUS_GROUP_MAP.pending } });

export const getRevenueChartLast12Months = async (): Promise<
  { month: string; revenue: number; orders: number }[]
> => {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start },
  })
    .select('totalAmount createdAt')
    .lean();

  const buckets = new Map<string, { revenue: number; orders: number }>();

  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const created = new Date(order.createdAt as Date);
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += decimalToNumber(order.totalAmount);
    bucket.orders += 1;
  }

  const result: { month: string; revenue: number; orders: number }[] = [];
  let idx = 0;
  for (const [, data] of buckets) {
    result.push({
      month: MONTH_LABELS[idx] ?? `T${idx + 1}`,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    });
    idx += 1;
  }

  return result;
};

export const getOrderStatusBreakdown = async (): Promise<
  { name: string; value: number; fill: string; percentage: string }[]
> => {
  const [completed, pending, cancelled, total] = await Promise.all([
    Order.countDocuments({ status: { $in: ORDER_STATUS_GROUP_MAP.completed } }),
    Order.countDocuments({ status: { $in: ORDER_STATUS_GROUP_MAP.pending } }),
    Order.countDocuments({ status: { $in: ORDER_STATUS_GROUP_MAP.cancelled } }),
    Order.countDocuments({}),
  ]);

  const pct = (n: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%';

  return [
    { name: 'Thành công', value: completed, fill: '#10b981', percentage: pct(completed) },
    { name: 'Chờ xử lý', value: pending, fill: '#f59e0b', percentage: pct(pending) },
    { name: 'Đã hủy', value: cancelled, fill: '#ef4444', percentage: pct(cancelled) },
  ];
};

export const getRecentCustomersForActivity = async (limit = 3) => {
  return Customer.find()
    .select('fullName createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};
