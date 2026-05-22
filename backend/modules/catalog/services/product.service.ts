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
  mapProductToAdminListItem,
  type AdminProductListItemDto,
} from '../../../shared/mappers/product.mapper.js';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export const createProduct = async (data: Partial<IProduct>): Promise<IProduct> => {
  const product = await Product.create(data);
  return product;
};

interface GetProductsParams {
  status?: string;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  color?: string;
  style?: string;
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
  minPrice,
  maxPrice,
  sortBy,
  page = 1,
  limit = 20
}: GetProductsParams = {}): Promise<PaginatedProducts> => {
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  
  if (categoryId) {
    filter.category = categoryId;
  } else if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (category) filter.category = category._id;
  }
  
  if (search) filter.name = { $regex: search, $options: 'i' };
  
  if (color) {
    filter.$or = [
      { name: { $regex: color, $options: 'i' } },
      { description: { $regex: color, $options: 'i' } }
    ];
  }
  
  if (style) {
    const styleRegex = { $regex: style, $options: 'i' };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: [{ name: styleRegex }, { description: styleRegex }] }];
      delete filter.$or;
    } else {
      filter.$or = [{ name: styleRegex }, { description: styleRegex }];
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['minifiedVariants.price'] = {};
    if (minPrice !== undefined) filter['minifiedVariants.price'].$gte = Number(minPrice);
    if (maxPrice !== undefined) filter['minifiedVariants.price'].$lte = Number(maxPrice);
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

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(String(value)) || 0;
};

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

const buildStockMaps = async (productIds: string[]) => {
  const products = await Product.find({ _id: { $in: productIds } })
    .select('minifiedVariants')
    .lean();

  const variantIds = products.flatMap((p) =>
    (p.minifiedVariants ?? []).map((mv) => mv.variantId.toString())
  );

  const [stockAgg, variants] = await Promise.all([
    StockLevel.aggregate<{ _id: mongoose.Types.ObjectId; totalQty: number }>([
      { $match: { productVariant: { $in: variantIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
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
};

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

export interface AdminProductSummary {
  total: number;
  active: number;
  lowStock: number;
  discontinued: number;
  categories: number;
  topCategories: AdminTopCategory[];
  lowStockAlerts: AdminLowStockAlert[];
}

const LOW_STOCK_THRESHOLD = 50;

export const getAdminTopCategories = async (limit = 6): Promise<AdminTopCategory[]> => {
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
};

export const getAdminLowStockAlerts = async (limit = 5): Promise<AdminLowStockAlert[]> => {
  const products = await Product.find({ status: { $ne: ProductStatus.DISCONTINUED } })
    .select('name description mainImageUrl minifiedVariants')
    .lean();

  const productIds = products.map((p) => p._id.toString());
  const { stockByProductId } = await buildStockMaps(productIds);

  const alerts = products
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

  return alerts;
};

export const getAdminProductSummary = async (): Promise<AdminProductSummary> => {
  const [total, active, discontinued, categoryIds, lowStockProducts, topCategories, lowStockAlerts] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: ProductStatus.ACTIVE }),
      Product.countDocuments({ status: ProductStatus.DISCONTINUED }),
      Product.distinct('category'),
      Product.find({ status: { $ne: ProductStatus.DISCONTINUED } })
        .select('_id minifiedVariants')
        .lean(),
      getAdminTopCategories(6),
      getAdminLowStockAlerts(5),
    ]);

  const productIds = lowStockProducts.map((p) => p._id.toString());
  const { stockByProductId } = await buildStockMaps(productIds);
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

interface GetAdminProductsParams {
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

export const getAdminProducts = async ({
  status,
  categoryId,
  search,
  stockFilter,
  page = 1,
  limit = 20,
}: GetAdminProductsParams = {}): Promise<PaginatedAdminProducts> => {
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
  const maps = await buildStockMaps(productIds);

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
};

export interface CreateAdminProductInput {
  name: string;
  description?: string;
  categoryId: string;
  sku: string;
  price: number;
  stock: number;
  status?: ProductStatus;
  mainImageUrl?: string;
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
  }

  if (input.sku) variant.sku = input.sku.trim();
  if (input.price !== undefined) {
    const priceDecimal = mongoose.Types.Decimal128.fromString(String(input.price));
    variant.price = priceDecimal as mongoose.Types.Decimal128;
    if (product.minifiedVariants[0]) {
      product.minifiedVariants[0].price = priceDecimal as mongoose.Types.Decimal128;
    }
  }

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
