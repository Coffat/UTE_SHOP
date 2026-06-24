import { api } from "../../lib/api";

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  role?: string;
}

export interface StaffListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ShiftPayload {
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
  bg?: string;
  date: string;
  assignedStaff: string[];
}

export async function fetchStaffList(params: StaffListParams = {}) {
  const response = await api.get("/api/v1/admin/staff", { params });
  const data = response.data.data as { items: unknown[]; meta: StaffListMeta };
  return data;
}

export async function createStaffMember(payload: Record<string, unknown> | FormData) {
  const response = await api.post("/api/v1/admin/staff", payload);
  return response.data.data;
}

export async function updateStaffMember(id: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/api/v1/admin/staff/${id}`, payload);
  return response.data.data;
}

export async function deleteStaffMember(id: string) {
  const response = await api.delete(`/api/v1/admin/staff/${id}`);
  return response.data.data;
}

export async function fetchShifts(params?: {
  startDate?: string;
  endDate?: string;
  date?: string;
}) {
  const response = await api.get("/api/v1/admin/shifts", { params });
  return response.data.data as unknown[];
}

export async function createShift(payload: ShiftPayload) {
  const response = await api.post("/api/v1/admin/shifts", payload);
  return response.data.data;
}

export async function updateShift(id: string, payload: Partial<ShiftPayload>) {
  const response = await api.patch(`/api/v1/admin/shifts/${id}`, payload);
  return response.data.data;
}

export async function cancelShift(id: string) {
  const response = await api.delete(`/api/v1/admin/shifts/${id}`);
  return response.data.data;
}
