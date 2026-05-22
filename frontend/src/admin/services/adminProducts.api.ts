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
  };
}

export async function fetchProductSummary(): Promise<ProductSummary> {
  const response = await api.get("/api/v1/products/admin/summary");
  return response.data.data as ProductSummary;
}

export async function fetchAdminProducts(
  params: ProductsListParams = {}
): Promise<ProductsListResult> {
  const response = await api.get("/api/v1/products/admin/list", { params });
  const data = response.data.data as {
    items: BackendAdminProduct[];
    meta: ProductsListResult["meta"];
  };
  return {
    items: data.items.map(mapBackendProductToRow),
    meta: data.meta,
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
}

export async function createAdminProduct(payload: CreateProductPayload) {
  const response = await api.post("/api/v1/products/admin", {
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
}

export async function updateAdminProduct(id: string, payload: UpdateProductPayload) {
  const response = await api.put(`/api/v1/products/admin/${id}`, payload);
  return response.data.data;
}

export async function discontinueAdminProduct(id: string) {
  const response = await api.patch(`/api/v1/products/${id}/discontinue`);
  return response.data.data;
}

export function buildUpdatePayloadFromForm(
  form: {
    name: string;
    subName: string;
    sku: string;
    categoryId: string;
    price: number;
    stock: number;
    status: UiProductStatus;
  }
): UpdateProductPayload {
  return {
    name: form.name,
    description: form.subName,
    categoryId: form.categoryId,
    sku: form.sku,
    price: form.price,
    stock: form.stock,
    status: uiStatusToBackend(form.status),
  };
}

export function buildCreatePayloadFromForm(
  form: {
    name: string;
    subName: string;
    sku: string;
    categoryId: string;
    price: number;
    stock: number;
    status: UiProductStatus;
  }
): CreateProductPayload {
  return {
    name: form.name,
    description: form.subName,
    categoryId: form.categoryId,
    sku: form.sku,
    price: form.price,
    stock: form.stock,
    status: uiStatusToBackend(form.status),
  };
}
