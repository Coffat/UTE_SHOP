import mongoose from 'mongoose';
import Order, { IOrder } from '../models/Order.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';
import {
  ORDER_STATUS_GROUP_MAP,
} from '../constants/orderStatusGroups.js';
import type { AttentionOrderDto } from '../../../shared/mappers/order.mapper.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GetOrdersParams {
  customerId?: string;
  status?: string;
  statusGroup?: string;
  orderType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  includeSummary?: boolean;
}

export interface OrdersSummaryDto {
  total: number;
  pending: number;
  confirmed: number;
  ready: number;
  shipping: number;
  completed: number;
  cancelled: number;
  attentionCount: number;
  attentionOrders: AttentionOrderDto[];
}

const ATTENTION_DELIVERY_DAYS = 3;

// ─── OrderRepository ──────────────────────────────────────────────────────────

export class OrderRepository {
  private buildAttentionFilter(): Record<string, unknown> {
    const deliveryCutoff = new Date();
    deliveryCutoff.setDate(deliveryCutoff.getDate() - ATTENTION_DELIVERY_DAYS);

    return {
      $or: [
        { status: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.READY] } },
        { status: OrderStatus.DELIVERING, updatedAt: { $lte: deliveryCutoff } },
      ],
    };
  }

  private resolveAttentionLabel(status: OrderStatus, updatedAt: Date): string {
    if (status === OrderStatus.CANCELLED) return 'Đã hủy';
    if (status === OrderStatus.DELIVERING) {
      const deliveryCutoff = new Date();
      deliveryCutoff.setDate(deliveryCutoff.getDate() - ATTENTION_DELIVERY_DAYS);
      if (updatedAt <= deliveryCutoff) return 'Quá hạn giao';
    }
    if (
      status === OrderStatus.PENDING ||
      status === OrderStatus.CONFIRMED ||
      status === OrderStatus.READY
    ) {
      return 'Chờ xử lý';
    }
    return 'Cần xem';
  }

  async getAttentionOrders(limit = 5): Promise<AttentionOrderDto[]> {
    const orders = await Order.find(this.buildAttentionFilter())
      .populate('customer', 'fullName')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return orders.map((order) => {
      const customer = order.customer as Record<string, unknown> | null | undefined;
      return {
        id: String(order._id),
        orderCode: String(order.orderCode),
        customerName: String(customer?.fullName ?? order.recipient?.fullName ?? 'Khách lẻ'),
        createdAt: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : new Date().toISOString(),
        status: order.status as OrderStatus,
        attentionLabel: this.resolveAttentionLabel(
          order.status as OrderStatus,
          order.updatedAt ? new Date(order.updatedAt) : new Date()
        ),
      };
    });
  }

  async getAttentionOrdersCount(): Promise<number> {
    return Order.countDocuments(this.buildAttentionFilter());
  }

  buildOrdersFilter({
    customerId,
    status,
    statusGroup,
    orderType,
    search,
    dateFrom,
    dateTo,
  }: Omit<GetOrdersParams, 'page' | 'limit' | 'includeSummary' | 'paymentStatus'>): Record<string, unknown> {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (customerId) filter.customer = customerId;

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      filter.status = status;
    } else if (statusGroup && ORDER_STATUS_GROUP_MAP[statusGroup]) {
      filter.status = { $in: ORDER_STATUS_GROUP_MAP[statusGroup] };
    }

    if (orderType && Object.values(OrderType).includes(orderType as OrderType)) {
      filter.orderType = orderType;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = end;
      }
    }

    if (search?.trim()) {
      const term = search.trim();
      const regex = { $regex: term, $options: 'i' };
      filter.$or = [
        { orderCode: regex },
        { 'recipient.fullName': regex },
        { 'recipient.phone': regex },
      ];
    }

    return filter;
  }

  async computeOrdersSummary(baseFilter: Record<string, unknown>): Promise<OrdersSummaryDto> {
    const [total, pending, confirmed, ready, shipping, completed, cancelled, attentionCount, attentionOrders] =
      await Promise.all([
        Order.countDocuments(baseFilter),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.pending } }),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.confirmed } }),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.ready } }),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.shipping } }),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.completed } }),
        Order.countDocuments({ ...baseFilter, status: { $in: ORDER_STATUS_GROUP_MAP.cancelled } }),
        this.getAttentionOrdersCount(),
        this.getAttentionOrders(5),
      ]);
    return { total, pending, confirmed, ready, shipping, completed, cancelled, attentionCount, attentionOrders };
  }

  async findOrders(
    filter: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<IOrder[]> {
    return Order.find(filter)
      .populate('customer', 'email fullName phone')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean() as unknown as IOrder[];
  }

  async countOrders(filter: Record<string, unknown>): Promise<number> {
    return Order.countDocuments(filter);
  }

  async findById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate({
        path: 'items.productVariant',
        select: 'sku sizeName price product',
        populate: {
          path: 'product',
          select: 'name mainImageUrl slug'
        }
      })
      .populate('customer', 'email fullName');
  }

  async save(order: IOrder): Promise<IOrder> {
    return (order as mongoose.Document & IOrder).save();
  }

  async findByIdWithVariants(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId).populate('items.productVariant');
  }

  async findByIdWithSession(
    orderId: string,
    session: mongoose.ClientSession
  ): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate('items.productVariant')
      .session(session) as unknown as IOrder | null;
  }
}

export const orderRepository = new OrderRepository();
