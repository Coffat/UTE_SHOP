import Product, { IProduct } from '../models/Product.js';
import ProductVariant, { IProductVariant } from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import mongoose from 'mongoose';

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
