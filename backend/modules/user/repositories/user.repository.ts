import mongoose, { Types } from 'mongoose';
import User from '../models/User.js';
import { Sales, WarehouseStaff, StoreStaff } from '../models/Staff.js';
import Customer from '../models/Customer.js';

export interface IListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export class UserRepository {
  // ─── Staff Querying ──────────────────────────────────────────────────────────
  async getStaffList(params: IListParams) {
    const { page, limit, search, sortBy = 'createdAt', sortOrder = 'desc', status } = params;
    const skip = (page - 1) * limit;

    // Filter out ADMIN and CUSTOMER, keep only SALES, WAREHOUSE_STAFF, STORE_STAFF
    // And filter out soft-deleted users
    const filter: any = {
      role: { $in: ['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'] },
      isActive: true,
      deletedAt: null,
    };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(filter),
    ]);

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getStaffById(id: string) {
    return User.findOne({
      _id: id,
      role: { $in: ['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'] },
      isActive: true,
      deletedAt: null,
    }).exec();
  }

  async createStaff(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    role: 'SALES' | 'WAREHOUSE_STAFF' | 'STORE_STAFF';
    fullName: string;
    status?: string;
    performanceScore?: number;
    // discriminator specific fields
    isOnline?: boolean;
    assignedWarehouse?: string;
    counterId?: string;
    storeLocation?: string;
  }) {
    const ModelMap = {
      SALES: Sales,
      WAREHOUSE_STAFF: WarehouseStaff,
      STORE_STAFF: StoreStaff,
    };

    const SpecificModel = ModelMap[data.role];
    if (!SpecificModel) {
      throw new Error(`Invalid staff role: ${data.role}`);
    }

    const newStaff = new SpecificModel({
      email: data.email,
      passwordHash: data.passwordHash,
      phone: data.phone || null,
      fullName: data.fullName,
      status: data.status || 'ACTIVE',
      performanceScore: data.performanceScore ?? 100,
      isActive: true,
      // specific fields
      isOnline: data.isOnline ?? false,
      assignedWarehouse: data.assignedWarehouse ? new Types.ObjectId(data.assignedWarehouse) : null,
      counterId: data.counterId,
      storeLocation: data.storeLocation,
    });

    return newStaff.save();
  }

  async updateStaff(id: string, data: any) {
    // Note: discriminator key `role` cannot be dynamically updated in Mongoose because Mongoose discriminators
    // do not support changing the discriminator key value once created.
    // So we update properties on the existing document directly.
    const staff = await User.findOne({
      _id: id,
      role: { $in: ['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'] },
      isActive: true,
    });

    if (!staff) return null;

    // Update standard user/staff fields
    if (data.fullName !== undefined) staff.set('fullName', data.fullName);
    if (data.email !== undefined) staff.set('email', data.email);
    if (data.phone !== undefined) staff.set('phone', data.phone);
    if (data.status !== undefined) staff.set('status', data.status);
    if (data.performanceScore !== undefined) staff.set('performanceScore', data.performanceScore);
    if (data.passwordHash !== undefined) staff.set('passwordHash', data.passwordHash);

    // Update specific fields based on discriminator
    if (staff.role === 'SALES') {
      if (data.isOnline !== undefined) staff.set('isOnline', data.isOnline);
    } else if (staff.role === 'WAREHOUSE_STAFF') {
      if (data.assignedWarehouse !== undefined) {
        staff.set('assignedWarehouse', data.assignedWarehouse ? new Types.ObjectId(data.assignedWarehouse) : null);
      }
    } else if (staff.role === 'STORE_STAFF') {
      if (data.counterId !== undefined) staff.set('counterId', data.counterId);
      if (data.storeLocation !== undefined) staff.set('storeLocation', data.storeLocation);
    }

    return staff.save();
  }

  async softDeleteUser(id: string, deletedByUserId: string) {
    return User.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: 'SUSPENDED',
        deletedAt: new Date(),
        deletedBy: new Types.ObjectId(deletedByUserId),
      },
      { new: true }
    ).exec();
  }

  // ─── Customer Aggregation with Pagination ($facet) ───────────────────────────
  async getCustomerList(params: IListParams) {
    const { page, limit, search, sortBy = 'createdAt', sortOrder = 'desc', status } = params;
    const skip = (page - 1) * limit;

    const matchStage: any = {
      role: 'CUSTOMER',
      isActive: true,
      deletedAt: null,
    };

    if (status) {
      matchStage.status = status;
    }

    if (search) {
      matchStage.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Build the aggregation pipeline using $facet to perform counts and results in a single database query.
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            sortStage ? { $sort: sortStage } : null,
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'customer',
                as: 'orders',
              },
            },
            {
              $project: {
                _id: 1,
                fullName: 1,
                email: 1,
                phone: 1,
                status: 1,
                loyalty: 1,
                createdAt: 1,
                ordersCount: { $size: '$orders' },
                totalSpent: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$orders',
                          as: 'order',
                          cond: { $in: ['$$order.status', ['COMPLETED']] },
                        },
                      },
                      as: 'o',
                      in: { $toDouble: '$$o.totalAmount' }, // Crucial: convert Mongoose Decimal128 to double
                    },
                  },
                },
              },
            },
          ].filter(Boolean),
        },
      },
    ];

    const result = await User.aggregate(pipeline).exec();
    const facetData = result[0];

    const total = facetData.metadata[0]?.total || 0;
    const items = facetData.data || [];

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getCustomerById(id: string) {
    return User.findOne({
      _id: id,
      role: 'CUSTOMER',
      isActive: true,
      deletedAt: null,
    }).exec();
  }

  async updateCustomerStatus(id: string, status: 'ACTIVE' | 'BANNED' | 'PENDING' | 'SUSPENDED') {
    return User.findOneAndUpdate(
      { _id: id, role: 'CUSTOMER' },
      { status },
      { new: true }
    ).exec();
  }

  // ─── Guard Protections ───────────────────────────────────────────────────────
  async countActiveAdmins() {
    return User.countDocuments({
      role: 'ADMIN',
      isActive: true,
      status: 'ACTIVE',
      deletedAt: null,
    }).exec();
  }

  async findUserById(id: string) {
    return User.findById(id).exec();
  }

  async findUserByEmail(email: string) {
    return User.findOne({ email }).exec();
  }
}
export const userRepository = new UserRepository();
