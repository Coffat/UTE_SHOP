import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export const createProduct = async (data) => {
  const product = await Product.create(data);
  return product;
};

export const getProducts = async ({ status, categoryId, search, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (categoryId) filter.category = categoryId;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Product.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

export const getProductById = async (productId) => {
  return Product.findById(productId)
    .populate('category', 'name slug')
    .populate('tags', 'name slug');
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

export const getVariantsByProduct = async (productId) => {
  return ProductVariant.find({ product: productId, isActive: true });
};

export const updateVariant = async (variantId, data) => {
  return ProductVariant.findByIdAndUpdate(variantId, data, { new: true, runValidators: true });
};
