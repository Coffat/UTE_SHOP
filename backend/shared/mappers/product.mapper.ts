import ProductStatus from '../enums/ProductStatus.js';
import StockStatus from '../enums/StockStatus.js';

export interface AdminProductListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  price: number;
  stock: number;
  status: ProductStatus;
  soldCount: number;
  mainImageUrl: string;
  primaryVariantId: string | null;
  stockStatus: StockStatus | null;
}

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in (value as object)) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};

export const mapProductToAdminListItem = (
  product: Record<string, unknown>,
  stockByProductId: Map<string, number>,
  skuByProductId: Map<string, string>,
  priceByProductId: Map<string, number>,
  primaryVariantByProductId: Map<string, string>
): AdminProductListItemDto => {
  const category = product.category as Record<string, unknown> | null | undefined;
  const productId = String(product._id);

  const minified = (product.minifiedVariants as Record<string, unknown>[] | undefined) ?? [];
  const firstVariant = minified[0];
  const priceFromMinified = firstVariant ? decimalToNumber(firstVariant.price) : 0;

  return {
    id: productId,
    name: String(product.name ?? ''),
    slug: String(product.slug ?? ''),
    description: String(product.description ?? ''),
    categoryId: String(category?._id ?? product.category ?? ''),
    categoryName: String(category?.name ?? 'Chưa phân loại'),
    sku: skuByProductId.get(productId) ?? '',
    price: priceByProductId.get(productId) ?? priceFromMinified,
    stock: stockByProductId.get(productId) ?? 0,
    status: product.status as ProductStatus,
    soldCount: Number(product.soldCount ?? 0),
    mainImageUrl: String(product.mainImageUrl ?? ''),
    primaryVariantId: primaryVariantByProductId.get(productId) ?? null,
    stockStatus: null,
  };
};

export interface StaffProductListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  soldCount: number;
  mainImageUrl: string;
  primaryVariantId: string | null;
  stockStatus: string | null;
}

export interface StaffProductSummaryDto {
  total: number;
  active: number;
  lowStock: number;
  categories: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    percentage: number;
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    description: string;
    stock: number;
    mainImageUrl: string;
  }>;
}

export interface AdminProductSummary {
  total: number;
  active: number;
  lowStock: number;
  discontinued: number;
  categories: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    percentage: number;
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    description: string;
    stock: number;
    mainImageUrl: string;
  }>;
}

export const mapAdminProductToStaffListItem = (
  item: AdminProductListItemDto
): StaffProductListItemDto => {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    sku: item.sku,
    price: item.price,
    stock: item.stock,
    status: item.status,
    soldCount: item.soldCount,
    mainImageUrl: item.mainImageUrl,
    primaryVariantId: item.primaryVariantId,
    stockStatus: item.stockStatus,
  };
};

export const mapAdminSummaryToStaffSummary = (
  summary: AdminProductSummary
): StaffProductSummaryDto => {
  return {
    total: summary.total,
    active: summary.active,
    lowStock: summary.lowStock,
    categories: summary.categories,
    topCategories: summary.topCategories.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      productCount: c.productCount,
      percentage: c.percentage,
    })),
    lowStockAlerts: summary.lowStockAlerts.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      stock: a.stock,
      mainImageUrl: a.mainImageUrl,
    })),
  };
};

