import Category, { ICategory } from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../../../shared/utils/AppError.js';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── CategoryRepository ───────────────────────────────────────────────────────

export class CategoryRepository {
  async findAll(): Promise<ICategory[]> {
    return Category.find({ isActive: true }).sort('name');
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug });
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    return Category.create(data);
  }

  async updateById(
    id: string,
    data: Partial<ICategory>
  ): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async toggleActive(id: string, isActive: boolean): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, { isActive }, { new: true });
  }

  async deleteById(id: string): Promise<void> {
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new AppError('Không thể xóa danh mục đang có sản phẩm', 409);
    }
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Không tìm thấy danh mục', 404);
    }
  }

  async countProducts(categoryId: string): Promise<number> {
    return Product.countDocuments({ category: categoryId });
  }

  /**
   * Paginated admin category list with product count via aggregation.
   * Extracted from category.service.ts to keep the service layer free of
   * complex Mongoose queries.
   */
  async getAdminCategories(
    params: AdminCategoryListParams = {}
  ): Promise<AdminCategoryListResult> {
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
  }
}

export const categoryRepository = new CategoryRepository();
