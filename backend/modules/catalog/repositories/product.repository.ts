import mongoose from 'mongoose';
import Product, { IProduct } from '../models/Product.js';
import ProductVariant, { IProductVariant } from '../models/ProductVariant.js';
import StockLevel from '../../inventory/models/StockLevel.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import {
  mapProductToAdminListItem,
  type AdminProductListItemDto,
} from '../../../shared/mappers/product.mapper.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockMaps {
  stockByProductId: Map<string, number>;
  skuByProductId: Map<string, string>;
  priceByProductId: Map<string, number>;
  primaryVariantByProductId: Map<string, string>;
}

export interface AdminTopCategory {
  categoryId: string;
  categoryName: string;
  productCount: number;
  percentage: number;
}

export interface AdminLowStockAlert {
  id: string;
  name: string;
  description: string;
  stock: number;
  mainImageUrl: string;
}

export interface GetAdminProductsParams {
  status?: string;
  categoryId?: string;
  search?: string;
  stockFilter?: 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  limit?: number;
}

export interface PaginatedAdminProducts {
  items: AdminProductListItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const LOW_STOCK_THRESHOLD = 50;

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(String(value)) || 0;
};

// ─── ProductRepository ────────────────────────────────────────────────────────

export class ProductRepository {
  /**
   * Build in-memory maps for stock, SKU, price, and primary variant per product.
   * Encapsulates the StockLevel + ProductVariant aggregation that was previously
   * inlined inside product.service.ts.
   */
  async buildStockMaps(productIds: string[]): Promise<StockMaps> {
    const products = await Product.find({ _id: { $in: productIds } })
      .select('minifiedVariants')
      .lean();

    const variantIds = products.flatMap((p) =>
      (p.minifiedVariants ?? []).map((mv) => mv.variantId.toString())
    );

    const [stockAgg, variants] = await Promise.all([
      StockLevel.aggregate<{ _id: mongoose.Types.ObjectId; totalQty: number }>([
        {
          $match: {
            productVariant: {
              $in: variantIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $group: {
            _id: '$productVariant',
            totalQty: { $sum: { $toDouble: '$quantity' } },
          },
        },
      ]),
      ProductVariant.find({ product: { $in: productIds }, isActive: true })
        .select('product sku price')
        .lean(),
    ]);

    const stockByVariant = new Map(
      stockAgg.map((row) => [row._id.toString(), row.totalQty])
    );

    const stockByProductId = new Map<string, number>();
    const skuByProductId = new Map<string, string>();
    const priceByProductId = new Map<string, number>();
    const primaryVariantByProductId = new Map<string, string>();

    for (const product of products) {
      const pid = product._id.toString();
      let totalStock = 0;
      for (const mv of product.minifiedVariants ?? []) {
        const vid = mv.variantId.toString();
        totalStock += stockByVariant.get(vid) ?? 0;
        if (!primaryVariantByProductId.has(pid)) {
          primaryVariantByProductId.set(pid, vid);
        }
      }
      stockByProductId.set(pid, totalStock);
    }

    for (const variant of variants) {
      const pid = variant.product.toString();
      if (!skuByProductId.has(pid)) {
        skuByProductId.set(pid, variant.sku);
        priceByProductId.set(pid, decimalToNumber(variant.price));
        primaryVariantByProductId.set(pid, variant._id.toString());
      }
    }

    return { stockByProductId, skuByProductId, priceByProductId, primaryVariantByProductId };
  }

  /**
   * Return top categories by product count (excluding DISCONTINUED products).
   */
  async getAdminTopCategories(limit = 6): Promise<AdminTopCategory[]> {
    const [grouped, total] = await Promise.all([
      Product.aggregate<{
        categoryId: mongoose.Types.ObjectId;
        categoryName: string;
        productCount: number;
      }>([
        { $match: { status: { $ne: ProductStatus.DISCONTINUED } } },
        { $group: { _id: '$category', productCount: { $sum: 1 } } },
        { $sort: { productCount: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            categoryId: '$_id',
            categoryName: { $ifNull: ['$category.name', 'Chưa phân loại'] },
            productCount: 1,
            _id: 0,
          },
        },
      ]),
      Product.countDocuments({ status: { $ne: ProductStatus.DISCONTINUED } }),
    ]);

    return grouped.map((row) => ({
      categoryId: row.categoryId?.toString() ?? '',
      categoryName: row.categoryName,
      productCount: row.productCount,
      percentage: total > 0 ? Math.round((row.productCount / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Return products with low or zero stock (excludes DISCONTINUED).
   */
  async getAdminLowStockAlerts(limit = 5): Promise<AdminLowStockAlert[]> {
    const products = await Product.find({ status: { $ne: ProductStatus.DISCONTINUED } })
      .select('name description mainImageUrl minifiedVariants')
      .lean();

    const productIds = products.map((p) => p._id.toString());
    const { stockByProductId } = await this.buildStockMaps(productIds);

    return products
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description ?? '',
        stock: stockByProductId.get(p._id.toString()) ?? 0,
        mainImageUrl: p.mainImageUrl ?? '',
      }))
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, limit);
  }

  /**
   * Paginated admin product list with optional filters and stock data.
   */
  async getAdminProducts({
    status,
    categoryId,
    search,
    stockFilter,
    page = 1,
    limit = 20,
  }: GetAdminProductsParams = {}): Promise<PaginatedAdminProducts> {
    const filter: Record<string, unknown> = {};
    if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
      filter.status = status;
    }
    if (categoryId) filter.category = categoryId;
    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rawItems = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const productIds = rawItems.map((p) => p._id.toString());
    const maps = await this.buildStockMaps(productIds);

    let items = rawItems.map((product) =>
      mapProductToAdminListItem(
        product as Record<string, unknown>,
        maps.stockByProductId,
        maps.skuByProductId,
        maps.priceByProductId,
        maps.primaryVariantByProductId
      )
    );

    if (stockFilter === 'in_stock') {
      items = items.filter((p) => p.stock > 0);
    } else if (stockFilter === 'low_stock') {
      items = items.filter((p) => p.stock > 0 && p.stock <= 50);
    } else if (stockFilter === 'out_of_stock') {
      items = items.filter((p) => p.stock === 0);
    }

    const total = items.length;
    const paginatedItems = items.slice((safePage - 1) * safeLimit, safePage * safeLimit);

    return {
      items: paginatedItems,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id);
  }

  async findByIdOrSlug(idOrSlug: string): Promise<IProduct | null> {
    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };
    return Product.findOne(query).populate('category', 'name slug').populate('tags', 'name slug');
  }

  async findVariantsByProductId(productId: string): Promise<IProductVariant[]> {
    return ProductVariant.find({ product: productId, isActive: true });
  }

  async countByStatus(status: ProductStatus): Promise<number> {
    return Product.countDocuments({ status });
  }

  async countAll(): Promise<number> {
    return Product.countDocuments();
  }

  async distinctCategories(): Promise<unknown[]> {
    return Product.distinct('category');
  }
}

export const productRepository = new ProductRepository();
