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

export interface CreateProductPayload {
  name: string;
  description?: string;
  categoryId: string;
  sku: string;
  price: number;
  stock: number;
  status?: BackendProductStatus;
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

export async function fetchStaffProductSummary(): Promise<ProductSummary> {
  const response = await api.get("/api/v1/staff/products/summary");
  return response.data.data as ProductSummary;
}

export async function fetchStaffProducts(
  params: ProductsListParams = {}
): Promise<ProductsListResult> {
  const response = await api.get("/api/v1/staff/products", { params });
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

export async function createStaffProduct(payload: CreateProductPayload) {
  const response = await api.post("/api/v1/staff/products", {
    ...payload,
    status: payload.status ?? uiStatusToBackend("active"),
  });
  return response.data.data;
}

export async function updateStaffProduct(id: string, payload: UpdateProductPayload) {
  const response = await api.patch(`/api/v1/staff/products/${id}`, payload);
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
