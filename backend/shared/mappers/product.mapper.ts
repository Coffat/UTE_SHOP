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
