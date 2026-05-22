import { api } from "../../lib/api";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface AdminCategoriesListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface AdminCategoriesListResult {
  items: AdminCategoryRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    activeCount: number;
    inactiveCount: number;
    totalProducts: number;
  };
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

interface BackendCategoryRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

const mapCategoryRow = (row: BackendCategoryRow): AdminCategoryRow => ({
  id: row._id,
  name: row.name,
  slug: row.slug,
  description: row.description ?? "",
  imageUrl: row.imageUrl ?? "",
  isActive: row.isActive,
  productCount: row.productCount ?? 0,
  createdAt: row.createdAt,
});

export async function fetchAdminCategories(
  params: AdminCategoriesListParams = {}
): Promise<AdminCategoriesListResult> {
  const query: Record<string, string | number | boolean> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.search) query.search = params.search;
  if (params.isActive !== undefined) query.isActive = params.isActive;

  const response = await api.get("/api/v1/categories/admin/list", { params: query });
  const data = response.data.data as {
    items: BackendCategoryRow[];
    meta: AdminCategoriesListResult["meta"];
  };

  return {
    items: data.items.map(mapCategoryRow),
    meta: data.meta,
  };
}

export async function createAdminCategory(payload: CategoryPayload) {
  const response = await api.post("/api/v1/categories/admin", payload);
  return response.data.data;
}

export async function updateAdminCategory(id: string, payload: Partial<CategoryPayload>) {
  const response = await api.put(`/api/v1/categories/admin/${id}`, payload);
  return response.data.data;
}

export async function toggleAdminCategory(id: string, isActive: boolean) {
  const response = await api.patch(`/api/v1/categories/admin/${id}/toggle`, { isActive });
  return response.data.data;
}

export async function deleteAdminCategory(id: string) {
  const response = await api.delete(`/api/v1/categories/admin/${id}`);
  return response.data.data;
}

export function slugifyCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
