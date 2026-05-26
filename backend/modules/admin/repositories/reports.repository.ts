import Order from '../../order/models/Order.js';
import Product from '../../catalog/models/Product.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import { ORDER_STATUS_GROUP_MAP } from '../../order/constants/orderStatusGroups.js';

export type ReportsPeriod = '7d' | '30d' | 'month';

export interface ReportsPeriodRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

const MONTH_LABELS = [
  'Th01', 'Th02', 'Th03', 'Th04', 'Th05', 'Th06',
  'Th07', 'Th08', 'Th09', 'Th10', 'Th11', 'Th12',
];

const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  [OrderType.ONLINE]: '#10b981',
  [OrderType.AT_STORE]: '#3b82f6',
};

const ORDER_TYPE_NAMES: Record<OrderType, string> = {
  [OrderType.ONLINE]: 'Website',
  [OrderType.AT_STORE]: 'Tại cửa hàng',
};

export const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in (value as object)) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};

export const resolveReportsPeriodRange = (period: ReportsPeriod): ReportsPeriodRange => {
  const end = new Date();

  if (period === 'month') {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const prevEnd = new Date(start);
    const prevStart = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const fmt = (d: Date) =>
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: `${fmt(start)} - ${fmt(end)}`,
    };
  }

  const days = period === '7d' ? 7 : 30;
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

export const sumCompletedRevenueInRange = async (start: Date, end: Date): Promise<number> => {
  const orders = await Order.find({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start, $lt: end },
  })
    .select('totalAmount subtotal discountAmount')
    .lean();

  return orders.reduce((sum, o) => sum + decimalToNumber(o.totalAmount), 0);
};

export const sumGrossProfitInRange = async (start: Date, end: Date): Promise<number> => {
  const orders = await Order.find({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start, $lt: end },
  })
    .select('subtotal discountAmount')
    .lean();

  return orders.reduce(
    (sum, o) =>
      sum + decimalToNumber(o.subtotal) - decimalToNumber(o.discountAmount),
    0
  );
};

export const countCompletedOrdersInRange = async (start: Date, end: Date): Promise<number> =>
  Order.countDocuments({
    status: OrderStatus.COMPLETED,
    createdAt: { $gte: start, $lt: end },
  });

export const countAllOrdersInRange = async (start: Date, end: Date): Promise<number> =>
  Order.countDocuments({ createdAt: { $gte: start, $lt: end } });

export const countCancelledOrdersInRange = async (start: Date, end: Date): Promise<number> =>
  Order.countDocuments({
    status: { $in: ORDER_STATUS_GROUP_MAP.cancelled },
    createdAt: { $gte: start, $lt: end },
  });

export const getRevenueGrowthLast12Months = async (): Promise<
  { month: string; value: number; label: string; revenue: number }[]
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

  const buckets = new Map<string, number>();

  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }

  for (const order of orders) {
    const created = new Date(order.createdAt as Date);
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const current = buckets.get(key);
    if (current === undefined) continue;
    buckets.set(key, current + decimalToNumber(order.totalAmount));
  }

  const result: { month: string; value: number; label: string; revenue: number }[] = [];
  let idx = 0;
  for (const [, revenue] of buckets) {
    const billions = Math.round((revenue / 1_000_000_000) * 10) / 10;
    result.push({
      month: MONTH_LABELS[idx] ?? `Th${idx + 1}`,
      value: billions,
      label: `${billions}B`,
      revenue,
    });
    idx += 1;
  }

  return result;
};

export const getCategoryRevenueInRange = async (
  start: Date,
  end: Date,
  limit = 6
): Promise<{ category: string; value: number; label: string; revenue: number }[]> => {
  const rows = await Order.aggregate<{
    categoryName: string;
    revenue: number;
  }>([
    {
      $match: {
        status: OrderStatus.COMPLETED,
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'productvariants',
        localField: 'items.productVariant',
        foreignField: '_id',
        as: 'variant',
      },
    },
    { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'products',
        localField: 'variant.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$category.name', 'Chưa phân loại'] },
        revenue: {
          $sum: {
            $convert: {
              input: '$items.subtotal',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        categoryName: '$_id',
        revenue: 1,
      },
    },
  ]);

  return rows.map((row) => {
    const billions = Math.round((row.revenue / 1_000_000_000) * 100) / 100;
    const millions = Math.round(row.revenue / 1_000_000);
    return {
      category: row.categoryName,
      value: billions,
      label: billions >= 1 ? `${billions.toFixed(1)}B` : `${millions}M`,
      revenue: row.revenue,
    };
  });
};

export const getOrderSourcesInRange = async (
  start: Date,
  end: Date
): Promise<
  {
    name: string;
    count: number;
    percentage: number;
    color: string;
    orderType: OrderType;
    revenue: number;
  }[]
> => {
  const rows = await Order.aggregate<{ _id: OrderType; count: number; revenue: number }>([
    {
      $match: {
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$orderType',
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', OrderStatus.COMPLETED] },
              {
                $convert: {
                  input: '$totalAmount',
                  to: 'double',
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return rows.map((row) => {
    const orderType = row._id as OrderType;
    return {
      name: ORDER_TYPE_NAMES[orderType] ?? String(row._id),
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
      color: ORDER_TYPE_COLORS[orderType] ?? '#64748b',
      orderType,
      revenue: row.revenue,
    };
  });
};

export interface TopProductRow {
  productId: string;
  name: string;
  sku: string;
  mainImageUrl: string;
  sold: number;
  revenue: number;
}

export const getTopProductsInRange = async (
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date,
  limit = 5
): Promise<
  {
    id: string;
    name: string;
    sku: string;
    mainImageUrl: string;
    sold: number;
    revenue: number;
    growth: number;
    isUp: boolean;
  }[]
> => {
  const [currentRows, previousRows] = await Promise.all([
    aggregateProductSales(start, end, limit),
    aggregateProductSales(prevStart, prevEnd, limit * 3),
  ]);

  const resolvedCurrent =
    currentRows.length > 0 ? currentRows : await getTopProductsFromCatalog(limit);

  const prevSoldByProduct = new Map(
    previousRows.map((r) => [r.productId, r.sold])
  );

  return resolvedCurrent.map((row) => {
    const prevSold = prevSoldByProduct.get(row.productId) ?? 0;
    const growth =
      prevSold > 0
        ? Math.round(((row.sold - prevSold) / prevSold) * 1000) / 10
        : row.sold > 0
          ? 100
          : 0;

    return {
      id: row.productId,
      name: row.name,
      sku: row.sku,
      mainImageUrl: row.mainImageUrl,
      sold: row.sold,
      revenue: row.revenue,
      growth,
      isUp: growth >= 0,
    };
  });
};

const aggregateProductSales = async (
  start: Date,
  end: Date,
  limit: number
): Promise<TopProductRow[]> => {
  const rows = await Order.aggregate<{
    productId: string;
    name: string;
    sku: string;
    mainImageUrl: string;
    sold: number;
    revenue: number;
  }>([
    {
      $match: {
        status: { $ne: OrderStatus.CANCELLED },
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'productvariants',
        localField: 'items.productVariant',
        foreignField: '_id',
        as: 'variant',
      },
    },
    { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'products',
        localField: 'variant.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$product._id', '$items.productVariant'] },
        name: {
          $first: {
            $ifNull: ['$product.name', '$items.snapshotName'],
          },
        },
        sku: { $first: { $ifNull: ['$variant.sku', 'N/A'] } },
        mainImageUrl: { $first: { $ifNull: ['$product.mainImageUrl', ''] } },
        sold: { $sum: '$items.quantity' },
        revenue: {
          $sum: {
            $convert: {
              input: '$items.subtotal',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
    { $match: { sold: { $gt: 0 } } },
    { $sort: { sold: -1, revenue: -1 } },
    { $limit: limit },
    {
      $project: {
        productId: { $toString: '$_id' },
        name: 1,
        sku: 1,
        mainImageUrl: 1,
        sold: 1,
        revenue: 1,
        _id: 0,
      },
    },
  ]);

  return rows;
};

const getTopProductsFromCatalog = async (limit: number): Promise<TopProductRow[]> => {
  const products = await Product.find({
    status: { $ne: ProductStatus.DISCONTINUED },
    soldCount: { $gt: 0 },
  })
    .sort({ soldCount: -1 })
    .limit(limit)
    .select('name mainImageUrl soldCount minifiedVariants')
    .lean();

  return products.map((product) => {
    const firstVariant = product.minifiedVariants?.[0];
    const price = firstVariant?.price
      ? decimalToNumber(firstVariant.price)
      : 0;
    const sold = product.soldCount ?? 0;

    return {
      productId: String(product._id),
      name: product.name,
      sku: firstVariant?.sizeName ? `SIZE-${firstVariant.sizeName}` : 'N/A',
      mainImageUrl: product.mainImageUrl ?? '',
      sold,
      revenue: Math.round(price * sold),
    };
  });
};
