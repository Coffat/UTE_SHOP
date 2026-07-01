import Product, { IProduct } from '../models/Product.js';
import ProductVariant, { IProductVariant } from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import StockStatus from '../../../shared/enums/StockStatus.js';
import mongoose from 'mongoose';
import StockLevel from '../../inventory/models/StockLevel.js';
import Warehouse from '../../inventory/models/Warehouse.js';
import { AppError } from '../../../shared/utils/AppError.js';
import {
  productRepository,
  type AdminTopCategory,
  type AdminLowStockAlert,
  type PaginatedAdminProducts,
  type GetAdminProductsParams,
} from '../repositories/product.repository.js';
import {
  buildProductMongoFilter,
  type ProductTextSearchInput,
} from './productSearchQuery.service.js';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export const createProduct = async (data: Partial<IProduct>): Promise<IProduct> => {
  const product = await Product.create(data);
  return product;
};

interface GetProductsParams {
  status?: string;
  categoryId?: string;
  categorySlug?: string;
  /** @deprecated Prefer textSearch — kept for backward compatibility */
  search?: string;
  color?: string;
  /** @deprecated Prefer textSearch.mode styleOnly */
  style?: string;
  textSearch?: ProductTextSearchInput;
  excludeProductIds?: string[];
  minPrice?: string | number;
  maxPrice?: string | number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  items: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getProducts = async ({
  status,
  categoryId,
  categorySlug,
  search,
  color,
  style,
  textSearch,
  excludeProductIds,
  minPrice,
  maxPrice,
  sortBy,
  page = 1,
  limit = 20
}: GetProductsParams = {}): Promise<PaginatedProducts> => {
  let resolvedCategorySlug = categorySlug;
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (category) resolvedCategorySlug = category.slug;
  }

  const legacyTextSearch: ProductTextSearchInput | undefined = textSearch
    ? textSearch
    : search
      ? { mode: 'keyword', keyword: search }
      : style
        ? { mode: 'styleOnly', style }
        : undefined;

  const filter = buildProductMongoFilter({
    status,
    minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    textSearch: legacyTextSearch,
    excludeProductIds,
  });

  if (resolvedCategorySlug) {
    const category = await Category.findOne({ slug: resolvedCategorySlug });
    if (category) filter.category = category._id;
  }

  if (color) {
    const colorClause = {
      $or: [
        { name: { $regex: color, $options: 'i' } },
        { description: { $regex: color, $options: 'i' } },
      ],
    };
    if (filter.$and) {
      (filter.$and as Record<string, unknown>[]).push(colorClause);
    } else if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, colorClause];
      delete filter.$or;
    } else {
      Object.assign(filter, colorClause);
    }
  }

  if (categoryId && !resolvedCategorySlug) {
    filter.category = categoryId;
  }

  let sortOption: Record<string, any> = { createdAt: -1 };
  if (sortBy === 'price_asc') sortOption = { 'minifiedVariants.price': 1 };
  if (sortBy === 'price_desc') sortOption = { 'minifiedVariants.price': -1 };
  if (sortBy === 'sold') sortOption = { soldCount: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortOption),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

export const getProductById = async (idOrSlug: string): Promise<IProduct | null> => {
  const query = mongoose.Types.ObjectId.isValid(idOrSlug) 
    ? { _id: idOrSlug } 
    : { slug: idOrSlug };
    
  return Product.findOne(query)
    .populate('category', 'name slug')
    .populate('tags', 'name slug');
};

export const incrementProductViews = async (idOrSlug: string): Promise<IProduct | null> => {
  const query = mongoose.Types.ObjectId.isValid(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  return Product.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true });
};

export const getRelatedProducts = async (idOrSlug: string, limit: number = 4): Promise<IProduct[]> => {
  const query = mongoose.Types.ObjectId.isValid(idOrSlug) 
    ? { _id: idOrSlug } 
    : { slug: idOrSlug };
    
  const product = await Product.findOne(query);
  if (!product) return [];
  
  return Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: ProductStatus.ACTIVE
  })
    .limit(limit)
    .populate('category', 'name slug');
};

export const updateProduct = async (productId: string, data: Partial<IProduct>): Promise<IProduct | null> => {
  return Product.findByIdAndUpdate(productId, data, { new: true, runValidators: true });
};

export const publishProduct = async (productId: string): Promise<IProduct | null> => {
  return Product.findByIdAndUpdate(
    productId,
    { status: ProductStatus.ACTIVE },
    { new: true }
  );
};

export const discontinueProduct = async (productId: string): Promise<IProduct | null> => {
  return Product.findByIdAndUpdate(
    productId,
    { status: ProductStatus.DISCONTINUED },
    { new: true }
  );
};

// ─── Variant CRUD ─────────────────────────────────────────────────────────────

export const createVariant = async (productId: string, variantData: Partial<IProductVariant>): Promise<IProductVariant> => {
  return ProductVariant.create({ product: productId, ...variantData });
};

export const getVariantsByProduct = async (idOrSlug: string): Promise<IProductVariant[]> => {
  let productId = idOrSlug;
  if (!mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const product = await Product.findOne({ slug: idOrSlug });
    if (!product) return [];
    productId = (product._id as mongoose.Types.ObjectId).toString();
  }
  return ProductVariant.find({ product: productId, isActive: true });
};

export const updateVariant = async (variantId: string, data: Partial<IProductVariant>): Promise<IProductVariant | null> => {
  return ProductVariant.findByIdAndUpdate(variantId, data, { new: true, runValidators: true });
};

export const deactivateVariant = async (variantId: string): Promise<IProductVariant | null> => {
  return ProductVariant.findByIdAndUpdate(
    variantId,
    { isActive: false, stockStatus: StockStatus.OUT_OF_STOCK },
    { new: true }
  );
};

// ─── Admin helpers ────────────────────────────────────────────────────────────

export const generateProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let suffix = 0;
  while (await Product.exists({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
};

const getDefaultWarehouse = async () => {
  const warehouse = await Warehouse.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!warehouse) {
    throw new AppError('Chưa cấu hình kho hàng. Vui lòng tạo warehouse trước khi nhập tồn.', 400);
  }
  return warehouse;
};

export interface AdminProductSummary {
  total: number;
  active: number;
  lowStock: number;
  discontinued: number;
  categories: number;
  topCategories: AdminTopCategory[];
  lowStockAlerts: AdminLowStockAlert[];
}

export const getAdminTopCategories = (limit = 6): Promise<AdminTopCategory[]> =>
  productRepository.getAdminTopCategories(limit);

export const getAdminLowStockAlerts = (limit = 5): Promise<AdminLowStockAlert[]> =>
  productRepository.getAdminLowStockAlerts(limit);

export const getAdminProductSummary = async (): Promise<AdminProductSummary> => {
  const [total, active, discontinued, categoryIds, lowStockProducts, topCategories, lowStockAlerts] =
    await Promise.all([
      productRepository.countAll(),
      productRepository.countByStatus(ProductStatus.ACTIVE),
      productRepository.countByStatus(ProductStatus.DISCONTINUED),
      productRepository.distinctCategories(),
      Product.find({ status: { $ne: ProductStatus.DISCONTINUED } })
        .select('_id minifiedVariants')
        .lean(),
      productRepository.getAdminTopCategories(6),
      productRepository.getAdminLowStockAlerts(5),
    ]);

  const productIds = lowStockProducts.map((p) => p._id.toString());
  const { stockByProductId } = await productRepository.buildStockMaps(productIds);
  const LOW_STOCK_THRESHOLD = 50;
  const lowStock =
    productIds.filter((id) => {
      const stock = stockByProductId.get(id) ?? 0;
      return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    }).length + productIds.filter((id) => (stockByProductId.get(id) ?? 0) === 0).length;

  return {
    total,
    active,
    lowStock,
    discontinued,
    categories: categoryIds.length,
    topCategories,
    lowStockAlerts,
  };
};

export const getAdminProducts = (
  params: GetAdminProductsParams = {}
): Promise<PaginatedAdminProducts> => productRepository.getAdminProducts(params);

export interface CreateAdminProductInput {
  name: string;
  description?: string;
  categoryId: string;
  sku: string;
  price: number;
  stock: number;
  status?: ProductStatus;
  mainImageUrl?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export const createAdminProduct = async (input: CreateAdminProductInput): Promise<IProduct> => {
  const category = await Category.findById(input.categoryId);
  if (!category) throw new AppError('Không tìm thấy danh mục', 404);

  const slug = await ensureUniqueSlug(generateProductSlug(input.name));
  const variantId = new mongoose.Types.ObjectId();
  const priceDecimal = mongoose.Types.Decimal128.fromString(String(input.price));
  const productStatus = input.status ?? ProductStatus.DRAFT;

  const product = await Product.create({
    name: input.name.trim(),
    slug,
    description: input.description?.trim() ?? '',
    mainImageUrl: input.mainImageUrl ?? '',
    status: productStatus,
    category: input.categoryId,
    tags: [],
    minifiedVariants: [
      {
        variantId,
        sizeName: 'Mặc định',
        price: priceDecimal,
        inStock: input.stock > 0,
      },
    ],
    soldCount: 0,
    weight: input.weight,
    length: input.length,
    width: input.width,
    height: input.height,
  });

  await ProductVariant.create({
    _id: variantId,
    product: product._id,
    sku: input.sku.trim(),
    sizeName: 'Mặc định',
    price: priceDecimal,
    stockStatus:
      input.stock <= 0
        ? StockStatus.OUT_OF_STOCK
        : input.stock <= 5
          ? StockStatus.LOW
          : StockStatus.IN_STOCK,
    isActive: true,
    imageUrls: [],
  });

  if (input.stock > 0) {
    try {
      const warehouse = await getDefaultWarehouse();
      await StockLevel.create({
        warehouse: warehouse._id,
        productVariant: variantId,
        quantity: mongoose.Types.Decimal128.fromString(String(input.stock)),
        minThreshold: mongoose.Types.Decimal128.fromString('5'),
      });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 400) {
        // Allow product creation without warehouse; stock remains 0 in admin view
      } else {
        throw err;
      }
    }
  }

  return product;
};

export interface UpdateAdminProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

const resolvePrimaryVariant = async (productId: string) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

  const variantId = product.minifiedVariants[0]?.variantId?.toString();
  if (!variantId) throw new AppError('Sản phẩm chưa có biến thể', 400);

  const variant = await ProductVariant.findById(variantId);
  if (!variant) throw new AppError('Không tìm thấy biến thể sản phẩm', 404);

  return { product, variant };
};

export const updateAdminProduct = async (
  productId: string,
  input: UpdateAdminProductInput
): Promise<IProduct> => {
  const { product, variant } = await resolvePrimaryVariant(productId);

  if (input.categoryId) {
    const category = await Category.findById(input.categoryId);
    if (!category) throw new AppError('Không tìm thấy danh mục', 404);
    product.category = category._id as mongoose.Types.ObjectId;
  }

  if (input.name) {
    product.name = input.name.trim();
    product.slug = await ensureUniqueSlug(generateProductSlug(input.name));
  }
  if (input.description !== undefined) product.description = input.description.trim();
  if (input.status && Object.values(ProductStatus).includes(input.status)) {
    product.status = input.status;
    if (input.status === ProductStatus.ACTIVE) {
      variant.isActive = true;
    }
  }

  if (input.sku) variant.sku = input.sku.trim();
  if (input.price !== undefined) {
    const priceDecimal = mongoose.Types.Decimal128.fromString(String(input.price));
    variant.price = priceDecimal as mongoose.Types.Decimal128;
    if (product.minifiedVariants[0]) {
      product.minifiedVariants[0].price = priceDecimal as mongoose.Types.Decimal128;
    }
  }

  if (input.weight !== undefined) product.weight = input.weight;
  if (input.length !== undefined) product.length = input.length;
  if (input.width !== undefined) product.width = input.width;
  if (input.height !== undefined) product.height = input.height;

  if (input.stock !== undefined) {
    const stockQty = Math.max(0, input.stock);
    const inStock = stockQty > 0;
    if (product.minifiedVariants[0]) {
      product.minifiedVariants[0].inStock = inStock;
    }
    variant.stockStatus =
      stockQty <= 0
        ? StockStatus.OUT_OF_STOCK
        : stockQty <= 5
          ? StockStatus.LOW
          : StockStatus.IN_STOCK;

    try {
      const warehouse = await getDefaultWarehouse();
      let stockLevel = await StockLevel.findOne({
        warehouse: warehouse._id,
        productVariant: variant._id,
      });
      if (!stockLevel) {
        await StockLevel.create({
          warehouse: warehouse._id,
          productVariant: variant._id,
          quantity: mongoose.Types.Decimal128.fromString(String(stockQty)),
          minThreshold: mongoose.Types.Decimal128.fromString('5'),
        });
      } else {
        stockLevel.quantity = mongoose.Types.Decimal128.fromString(String(stockQty)) as mongoose.Types.Decimal128;
        await stockLevel.save();
      }
    } catch (err) {
      if (!(err instanceof AppError && err.statusCode === 400)) throw err;
    }
  }

  await variant.save();
  return product.save();
};

export const discontinueAdminProduct = async (productId: string): Promise<IProduct | null> => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

  if (product.status === ProductStatus.DISCONTINUED) {
    throw new AppError('Sản phẩm đã ngừng kinh doanh', 400);
  }

  const variants = await ProductVariant.find({ product: productId, isActive: true });
  await Promise.all(
    variants.map((v) =>
      ProductVariant.findByIdAndUpdate(v._id, {
        isActive: false,
        stockStatus: StockStatus.OUT_OF_STOCK,
      })
    )
  );

  product.status = ProductStatus.DISCONTINUED;
  product.minifiedVariants = product.minifiedVariants.map((mv) => ({
    ...mv,
    inStock: false,
  }));
  return product.save();
};
