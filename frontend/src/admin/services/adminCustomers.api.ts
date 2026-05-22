import { api } from "../../lib/api";

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export interface CustomerListResult {
  items: unknown[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function fetchCustomers(params: CustomerListParams = {}): Promise<CustomerListResult> {
  const response = await api.get("/api/v1/admin/customers", { params });
  return response.data.data as CustomerListResult;
}

export async function fetchCustomerById(id: string) {
  const response = await api.get(`/api/v1/admin/customers/${id}`);
  return response.data.data;
}

export async function createCustomer(payload: Record<string, unknown>) {
  const response = await api.post("/api/v1/admin/customers", payload);
  return response.data.data;
}

export async function updateCustomerStatus(id: string, status: string) {
  const response = await api.patch(`/api/v1/admin/customers/${id}/status`, { status });
  return response.data.data;
}
