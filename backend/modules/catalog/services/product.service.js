import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import mongoose from 'mongoose';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export const createProduct = async (data) => {
  const product = await Product.create(data);
  return product;
};

export const getProducts = async ({ status, categoryId, categorySlug, search, color, style, minPrice, maxPrice, sortBy, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  
  if (categoryId) filter.category = categoryId;
  else if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (category) filter.category = category._id;
  }
  
  if (search) filter.name = { $regex: search, $options: 'i' };
  
  if (color) {
    // Assuming color might be part of tags or name. For simplicity, match against name or a mock tag search.
    filter.$or = [
      { name: { $regex: color, $options: 'i' } },
      { description: { $regex: color, $options: 'i' } }
    ];
  }
  
  if (style) {
    // Similarly for style
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

  let sortOption = { createdAt: -1 };
  if (sortBy === 'price_asc') sortOption = { 'minifiedVariants.price': 1 };
  if (sortBy === 'price_desc') sortOption = { 'minifiedVariants.price': -1 };
  if (sortBy === 'sold') sortOption = { 'reviewStats.totalReviews': -1 }; // Mocking sold with totalReviews for now

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

export const getProductById = async (idOrSlug) => {
  let query = mongoose.Types.ObjectId.isValid(idOrSlug) 
    ? { _id: idOrSlug } 
    : { slug: idOrSlug };
    
  return Product.findOne(query)
    .populate('category', 'name slug')
    .populate('tags', 'name slug');
};

export const getRelatedProducts = async (idOrSlug, limit = 4) => {
  let query = mongoose.Types.ObjectId.isValid(idOrSlug) 
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

export const updateProduct = async (productId, data) => {
  return Product.findByIdAndUpdate(productId, data, { new: true, runValidators: true });
};

export const publishProduct = async (productId) => {
  return Product.findByIdAndUpdate(
    productId,
    { status: ProductStatus.ACTIVE },
    { new: true }
  );
};

export const discontinueProduct = async (productId) => {
  return Product.findByIdAndUpdate(
    productId,
    { status: ProductStatus.DISCONTINUED },
    { new: true }
  );
};

// ─── Variant CRUD ─────────────────────────────────────────────────────────────

export const createVariant = async (productId, variantData) => {
  return ProductVariant.create({ product: productId, ...variantData });
};

export const getVariantsByProduct = async (idOrSlug) => {
  let productId = idOrSlug;
  if (!mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const product = await Product.findOne({ slug: idOrSlug });
    if (!product) return [];
    productId = product._id;
  }
  return ProductVariant.find({ product: productId, isActive: true });
};

export const updateVariant = async (variantId, data) => {
  return ProductVariant.findByIdAndUpdate(variantId, data, { new: true, runValidators: true });
};
