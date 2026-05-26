import Category, { ICategory } from '../models/Category.js';
import { slugify, ensureUniqueSlug } from '../../../shared/utils/slugify.js';
import { AppError } from '../../../shared/utils/AppError.js';
import { categoryRepository } from '../repositories/category.repository.js';

// Re-export types from repository so existing imports continue to work
export type { AdminCategoryListParams, AdminCategoryListResult, AdminCategoryRow } from '../repositories/category.repository.js';
import type { AdminCategoryListParams, AdminCategoryListResult } from '../repositories/category.repository.js';

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

export const getCategories = (): Promise<ICategory[]> => categoryRepository.findAll();

export const getCategoryById = (id: string): Promise<ICategory | null> =>
  categoryRepository.findById(id);

export const getCategoryBySlug = (slug: string): Promise<ICategory | null> =>
  categoryRepository.findBySlug(slug);

export const updateCategory = async (
  id: string,
  data: Partial<ICategory>
): Promise<ICategory | null> => {
  const payload = await normalizeCategoryPayload(data, id);
  return categoryRepository.updateById(id, payload);
};

export const toggleCategory = (id: string, isActive: boolean): Promise<ICategory | null> =>
  categoryRepository.toggleActive(id, isActive);

export const countProductsInCategory = (categoryId: string): Promise<number> =>
  categoryRepository.countProducts(categoryId);

export const deleteCategory = (id: string): Promise<void> =>
  categoryRepository.deleteById(id);

export const getAdminCategories = (
  params: AdminCategoryListParams = {}
): Promise<AdminCategoryListResult> => categoryRepository.getAdminCategories(params);
