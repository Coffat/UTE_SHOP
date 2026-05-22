import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { shiftRepository } from '../repositories/shift.repository.js';
import { AppError } from '../../../shared/utils/AppError.js';

export class AdminService {
  // ─── Staff Management ────────────────────────────────────────────────────────
  async getStaffList(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    role?: string;
  }) {
    return userRepository.getStaffList(params);
  }

  async createStaff(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    role: 'SALES' | 'WAREHOUSE_STAFF' | 'STORE_STAFF';
    fullName: string;
    status?: string;
    performanceScore?: number;
    isOnline?: boolean;
    assignedWarehouse?: string;
    counterId?: string;
    storeLocation?: string;
  }) {
    const existingUser = await userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng bởi người dùng khác', 400);
    }

    // Hash the password
    const hashed = await bcrypt.hash(data.passwordHash, 10);
    const staffData = {
      ...data,
      passwordHash: hashed,
    };

    return userRepository.createStaff(staffData);
  }

  async updateStaff(id: string, data: any) {
    const currentStaff = await userRepository.getStaffById(id);
    if (!currentStaff) {
      throw new AppError('Không tìm thấy tài khoản nhân viên', 404);
    }

    // Role modification check: Mongoose does not allow changing discriminator key 'role' easily.
    // Prevent role change entirely.
    if (data.role && data.role !== currentStaff.role) {
      throw new AppError('Không được thay đổi vai trò (discriminator key) của nhân viên đã tồn tại', 400);
    }

    if (data.email) {
      const existingUser = await userRepository.findUserByEmail(data.email);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new AppError('Email này đã được sử dụng bởi người dùng khác', 400);
      }
    }

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    return userRepository.updateStaff(id, data);
  }

  async softDeleteStaff(id: string, deletedByUserId: string) {
    if (id === deletedByUserId) {
      throw new AppError('Bạn không thể tự xóa tài khoản của chính mình', 400);
    }

    const staff = await userRepository.getStaffById(id);
    if (!staff) {
      throw new AppError('Không tìm thấy tài khoản nhân viên cần xóa', 404);
    }

    return userRepository.softDeleteUser(id, deletedByUserId);
  }

  // ─── Customer Management ─────────────────────────────────────────────────────
  async getCustomerList(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }) {
    return userRepository.getCustomerList(params);
  }

  async getCustomerById(id: string) {
    return userRepository.getCustomerById(id);
  }

  async updateCustomerStatus(id: string, status: 'ACTIVE' | 'BANNED' | 'PENDING' | 'SUSPENDED', adminUserId: string) {
    if (id === adminUserId) {
      throw new AppError('Bạn không thể tự cập nhật trạng thái tài khoản của chính mình', 400);
    }

    const customer = await userRepository.getCustomerById(id);
    if (!customer) {
      throw new AppError('Không tìm thấy tài khoản khách hàng', 404);
    }

    return userRepository.updateCustomerStatus(id, status);
  }

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    fullName: string;
    status?: string;
  }) {
    const existingUser = await userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng bởi người dùng khác', 400);
    }

    if (!data.passwordHash) {
      throw new AppError('Mật khẩu là bắt buộc khi tạo tài khoản khách hàng', 422);
    }
    const hashed = await bcrypt.hash(data.passwordHash, 10);

    return userRepository.createCustomer({
      ...data,
      passwordHash: hashed,
    });
  }

  // ─── Shift Management ────────────────────────────────────────────────────────
  async getShiftList(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return shiftRepository.getShiftList(start, end);
  }

  async createShift(data: {
    title: string;
    startTime: string;
    endTime: string;
    color?: string;
    bg?: string;
    date: string;
    assignedStaff: string[];
  }) {
    // Validate staff members exist
    for (const staffId of data.assignedStaff) {
      const staff = await userRepository.getStaffById(staffId);
      if (!staff) {
        throw new AppError(`Không tìm thấy nhân viên với ID ${staffId}`, 400);
      }
    }

    const parsedDate = new Date(data.date);
    return shiftRepository.createShift({
      ...data,
      date: parsedDate,
    });
  }

  async updateShift(id: string, data: any) {
    if (data.assignedStaff) {
      for (const staffId of data.assignedStaff) {
        const staff = await userRepository.getStaffById(staffId);
        if (!staff) {
          throw new AppError(`Không tìm thấy nhân viên với ID ${staffId}`, 400);
        }
      }
    }

    if (data.date) {
      data.date = new Date(data.date);
    }

    const shift = await shiftRepository.updateShift(id, data);
    if (!shift) {
      throw new AppError('Không tìm thấy lịch trực hoặc lịch trực đã bị hủy', 404);
    }

    return shift;
  }

  async cancelShift(id: string, cancelledByUserId: string) {
    const shift = await shiftRepository.getShiftById(id);
    if (!shift) {
      throw new AppError('Không tìm thấy lịch trực để hủy', 404);
    }

    return shiftRepository.cancelShift(id, cancelledByUserId);
  }
}

export const adminService = new AdminService();
