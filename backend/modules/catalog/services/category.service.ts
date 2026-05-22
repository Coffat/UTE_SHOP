import Category, { ICategory } from '../models/Category.js';
import Product from '../models/Product.js';
import { slugify, ensureUniqueSlug } from '../../../shared/utils/slugify.js';
import { AppError } from '../../../shared/utils/AppError.js';

export interface AdminCategoryListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminCategoryRow {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCategoryListResult {
  items: AdminCategoryRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    activeCount: number;
    inactiveCount: number;
    totalProducts: number;
  };
}

const normalizeCategoryPayload = async (
  data: Partial<ICategory>,
  excludeId?: string
): Promise<Partial<ICategory>> => {
  const payload: Partial<ICategory> = { ...data };

  if (payload.name !== undefined) {
    payload.name = payload.name.trim();
  }

  if (payload.slug !== undefined) {
    payload.slug = slugify(payload.slug);
  } else if (payload.name && !payload.slug) {
    payload.slug = slugify(payload.name);
  }

  if (payload.slug) {
    const duplicate = await Category.findOne({
      slug: payload.slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (duplicate) {
      throw new AppError('Slug danh mục đã tồn tại', 409);
    }
  }

  return payload;
};

export const createCategory = async (data: Partial<ICategory>): Promise<ICategory> => {
  const payload = await normalizeCategoryPayload(data);
  if (!payload.slug && payload.name) {
    const existingSlugs = (await Category.find({}, 'slug').lean()).map((c) => c.slug);
    payload.slug = ensureUniqueSlug(slugify(payload.name), existingSlugs);
  }
  if (!payload.slug) {
    throw new AppError('Slug danh mục là bắt buộc', 400);
  }
  return Category.create(payload);
};

export const getCategories = async (): Promise<ICategory[]> =>
  Category.find({ isActive: true }).sort('name');

export const getCategoryById = async (id: string): Promise<ICategory | null> =>
  Category.findById(id);

export const getCategoryBySlug = async (slug: string): Promise<ICategory | null> =>
  Category.findOne({ slug });

export const updateCategory = async (
  id: string,
  data: Partial<ICategory>
): Promise<ICategory | null> => {
  const payload = await normalizeCategoryPayload(data, id);
  return Category.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

export const toggleCategory = async (id: string, isActive: boolean): Promise<ICategory | null> =>
  Category.findByIdAndUpdate(id, { isActive }, { new: true });

export const countProductsInCategory = async (categoryId: string): Promise<number> =>
  Product.countDocuments({ category: categoryId });

export const deleteCategory = async (id: string): Promise<void> => {
  const productCount = await countProductsInCategory(id);
  if (productCount > 0) {
    throw new AppError('Không thể xóa danh mục đang có sản phẩm', 409);
  }
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Không tìm thấy danh mục', 404);
  }
};

export const getAdminCategories = async (
  params: AdminCategoryListParams = {}
): Promise<AdminCategoryListResult> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (params.isActive !== undefined) {
    filter.isActive = params.isActive;
  }
  if (params.search?.trim()) {
    const regex = new RegExp(params.search.trim(), 'i');
    filter.$or = [{ name: regex }, { slug: regex }];
  }

  const [items, total, activeCount, inactiveCount, totalProducts] = await Promise.all([
    Category.aggregate([
      { $match: filter },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: { $size: '$products' },
        },
      },
    ]),
    Category.countDocuments(filter),
    Category.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: false }),
    Product.countDocuments(),
  ]);

  return {
    items: items as AdminCategoryRow[],
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      activeCount,
      inactiveCount,
      totalProducts,
    },
  };
};
