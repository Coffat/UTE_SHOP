import { api } from "../../lib/api";
import {
  mapBackendProductToRow,
  uiStatusToBackend,
  type AdminProductRow,
  type BackendAdminProduct,
  type BackendProductStatus,
  type UiProductStatus,
} from "./mappers/product.mapper";

export interface TopCategoryItem {
  categoryId: string;
  categoryName: string;
  productCount: number;
  percentage: number;
}

export interface LowStockAlertItem {
  id: string;
  name: string;
  description: string;
  stock: number;
  mainImageUrl: string;
}

export interface ProductSummary {
  total: number;
  active: number;
  lowStock: number;
  discontinued: number;
  categories: number;
  topCategories: TopCategoryItem[];
  lowStockAlerts: LowStockAlertItem[];
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface ProductsListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BackendProductStatus;
  categoryId?: string;
  stockFilter?: "in_stock" | "low_stock" | "out_of_stock";
}

export interface ProductsListResult {
  items: AdminProductRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    totalPages: number;
  };
}

export function getProductManagementBasePath(role: string): string {
  if (role === "ADMIN") {
    return "/api/v1/admin";
  }
  if (["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(role)) {
    return "/api/v1/staff";
  }
  throw new Error(`Unauthorized role for product management: ${role}`);
}

export async function fetchProductManagementSummary(role: string): Promise<ProductSummary> {
  const basePath = getProductManagementBasePath(role);
  const response = await api.get(`${basePath}/products/summary`);
  return response.data.data as ProductSummary;
}

export async function fetchManagedProducts(
  params: ProductsListParams = {},
  role: string
): Promise<ProductsListResult> {
  const basePath = getProductManagementBasePath(role);
  const response = await api.get(`${basePath}/products`, { params });
  // New endpoint: data is top-level array, meta is top-level object
  const items = response.data.data as BackendAdminProduct[];
  const rawMeta = response.data.meta as {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  return {
    items: items.map(mapBackendProductToRow),
    meta: {
      ...rawMeta,
      pages: rawMeta.totalPages,
    },
  };
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const response = await api.get("/api/v1/categories");
  const categories = response.data.data as Array<{ _id: string; name: string; slug: string }>;
  return categories.map((c) => ({
    id: c._id,
    name: c.name,
    slug: c.slug,
  }));
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  categoryId: string;
  sku: string;
  price: number;
  stock: number;
  status?: BackendProductStatus;
  mainImageUrl?: string;
}

export async function createAdminProduct(payload: CreateProductPayload) {
  const response = await api.post("/api/v1/admin/products", {
    ...payload,
    status: payload.status ?? uiStatusToBackend("active"),
  });
  return response.data.data;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  price?: number;
  stock?: number;
  status?: BackendProductStatus;
  mainImageUrl?: string;
}

export async function updateAdminProduct(id: string, payload: UpdateProductPayload) {
  const response = await api.patch(`/api/v1/admin/products/${id}`, payload);
  return response.data.data;
}

export async function discontinueAdminProduct(id: string) {
  const response = await api.delete(`/api/v1/admin/products/${id}`);
  return response.data.data;
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/api/v1/admin/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data.url;
}

export function buildUpdatePayloadFromForm(
  form: {
    name: string;
    description: string;
    sku: string;
    categoryId: string;
    price: number;
    stock: number;
    status: UiProductStatus;
    mainImageUrl?: string;
  }
): UpdateProductPayload {
  return {
    name: form.name,
    description: form.description,
    categoryId: form.categoryId,
    sku: form.sku,
    price: form.price,
    stock: form.stock,
    status: uiStatusToBackend(form.status),
    mainImageUrl: form.mainImageUrl,
  };
}

export function buildCreatePayloadFromForm(
  form: {
    name: string;
    description: string;
    sku: string;
    categoryId: string;
    price: number;
    stock: number;
    status: UiProductStatus;
    mainImageUrl?: string;
  }
): CreateProductPayload {
  return {
    name: form.name,
    description: form.description,
    categoryId: form.categoryId,
    sku: form.sku,
    price: form.price,
    stock: form.stock,
    status: uiStatusToBackend(form.status),
    mainImageUrl: form.mainImageUrl,
  };
}
