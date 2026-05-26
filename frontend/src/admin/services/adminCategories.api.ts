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
    totalPages: number;
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

  const response = await api.get("/api/v1/admin/categories", { params: query });
  // New endpoint: data is top-level array, meta is top-level object
  const items = response.data.data as BackendCategoryRow[];
  const rawMeta = response.data.meta as {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    activeCount: number;
    inactiveCount: number;
    totalProducts: number;
  };

  return {
    items: items.map(mapCategoryRow),
    meta: {
      ...rawMeta,
      pages: rawMeta.totalPages,
    },
  };
}

export async function createAdminCategory(payload: CategoryPayload) {
  const response = await api.post("/api/v1/admin/categories", payload);
  return response.data.data;
}

export async function updateAdminCategory(id: string, payload: Partial<CategoryPayload>) {
  const response = await api.patch(`/api/v1/admin/categories/${id}`, payload);
  return response.data.data;
}

/**
 * Toggle category active status.
 * Calls PATCH /admin/categories/:id with { isActive } body.
 * Replaces the legacy PATCH /categories/admin/:id/toggle endpoint.
 */
export async function toggleAdminCategory(id: string, isActive: boolean) {
  const response = await api.patch(`/api/v1/admin/categories/${id}`, { isActive });
  return response.data.data;
}

export async function deleteAdminCategory(id: string) {
  const response = await api.delete(`/api/v1/admin/categories/${id}`);
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
