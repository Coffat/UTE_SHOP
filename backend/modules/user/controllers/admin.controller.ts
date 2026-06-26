import { Request, Response } from 'express';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { AppError } from '../../../shared/utils/AppError.js';
import { adminService } from '../services/admin.service.js';
import AuditLog from '../../system/models/AuditLog.js';

const STAFF_ACTIVITY_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'];

// ─── Staff Controller Actions ────────────────────────────────────────────────
export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || undefined;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  const status = req.query.status as string || undefined;
  const role = req.query.role as string || undefined;

  const result = await adminService.getStaffList({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status,
    role,
  });

  return sendSuccess(res, 200, 'Lấy danh sách nhân viên thành công', {
    items: result.items,
    meta: {
      total: result.total,
      page,
      limit,
      pages: result.pages,
    },
  });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    password,
    phone,
    role,
    fullName,
    status,
    performanceScore,
    isOnline,
    assignedWarehouse,
    counterId,
    storeLocation,
  } = req.body;

  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

  const result = await adminService.createStaff({
    avatar,
    email,
    passwordHash: password, // adminService handles the hashing
    phone,
    role,
    fullName,
    status,
    performanceScore,
    isOnline,
    assignedWarehouse,
    counterId,
    storeLocation,
  });

  return sendSuccess(res, 201, 'Tạo tài khoản nhân viên thành công', result);
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedStaff = await adminService.updateStaff(id as string, req.body);

  return sendSuccess(res, 200, 'Cập nhật thông tin nhân viên thành công', updatedStaff);
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminUserId = req.user!.id;

  const deletedStaff = await adminService.softDeleteStaff(id as string, adminUserId as string);

  return sendSuccess(res, 200, 'Xóa tài khoản nhân viên thành công (Soft Delete)', deletedStaff);
});

// ─── Customer Controller Actions ─────────────────────────────────────────────
export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || undefined;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  const status = req.query.status as string || undefined;

  const result = await adminService.getCustomerList({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status,
  });

  return sendSuccess(res, 200, 'Lấy danh sách khách hàng thành công', {
    items: result.items,
    meta: {
      total: result.total,
      page,
      limit,
      pages: result.pages,
    },
  });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await adminService.getCustomerById(id as string);
  if (!customer) {
    throw new AppError('Không tìm thấy khách hàng', 404);
  }
  return sendSuccess(res, 200, 'Lấy thông tin khách hàng thành công', customer);
});

export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminUserId = req.user!.id;

  const updatedCustomer = await adminService.updateCustomerStatus(id as string, status, adminUserId as string);

  return sendSuccess(res, 200, 'Cập nhật trạng thái khách hàng thành công', updatedCustomer);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, phone, fullName, status } = req.body;

  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

  const result = await adminService.createCustomer({
    avatar,
    email,
    passwordHash: password || 'Uteshop@123',
    phone,
    fullName,
    status,
  });

  return sendSuccess(res, 201, 'Tạo tài khoản khách hàng thành công', result);
});

// ─── Shift Controller Actions ────────────────────────────────────────────────
export const listShifts = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.startDate as string || undefined;
  const endDate = req.query.endDate as string || undefined;

  const result = await adminService.getShiftList(startDate, endDate);

  return sendSuccess(res, 200, 'Lấy danh sách lịch trực thành công', result);
});

export const createShift = asyncHandler(async (req: Request, res: Response) => {
  const { title, startTime, endTime, color, bg, date, assignedStaff } = req.body;

  const result = await adminService.createShift({
    title,
    startTime,
    endTime,
    color,
    bg,
    date,
    assignedStaff,
  });

  return sendSuccess(res, 201, 'Tạo lịch trực thành công', result);
});

export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await adminService.updateShift(id as string, req.body);

  return sendSuccess(res, 200, 'Cập nhật lịch trực thành công', result);
});

export const cancelShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminUserId = req.user!.id;

  const result = await adminService.cancelShift(id as string, adminUserId as string);

  return sendSuccess(res, 200, 'Hủy lịch trực thành công (Soft Cancel)', result);
});

// GET /api/v1/admin/staff-activities
export const listStaffActivities = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const activities = await AuditLog.find({
    actorRole: { $in: STAFF_ACTIVITY_ROLES },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actorId', 'fullName role isActive status');

  const items = activities.map((activity) => ({
    id: activity._id.toString(),
    actorId: activity.actorId?._id?.toString?.() || activity.actorId?.toString?.() || '',
    fullName: (activity.actorId as any)?.fullName || 'Nhân sự',
    role: (activity.actorId as any)?.role || activity.actorRole,
    isActive: (activity.actorId as any)?.isActive ?? false,
    status: (activity.actorId as any)?.status || null,
    action: activity.action,
    resourceType: activity.resourceType,
    resourceId: activity.resourceId,
    createdAt: activity.createdAt,
  }));

  return sendSuccess(res, 200, 'Lấy hoạt động nhân viên thành công', items);
});
