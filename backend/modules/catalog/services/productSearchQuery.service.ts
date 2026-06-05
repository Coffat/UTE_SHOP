import mongoose from 'mongoose';
import type { IProduct } from '../models/Product.js';
import {
  buildAccentTolerantRegex,
  normalizeVietnameseText,
} from '../utils/vietnameseText.util.js';

export type ProductTextSearchMode = 'none' | 'keyword' | 'styleOnly';

export interface ProductTextSearchInput {
  mode: ProductTextSearchMode;
  keyword?: string;
  style?: string;
}

export interface BuildProductFilterInput {
  status?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  textSearch?: ProductTextSearchInput;
  excludeProductIds?: string[];
}

export const buildProductMongoFilter = (input: BuildProductFilterInput): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;

  if (input.excludeProductIds && input.excludeProductIds.length > 0) {
    const validIds = input.excludeProductIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (validIds.length > 0) {
      filter._id = { $nin: validIds };
    }
  }

  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (input.minPrice !== undefined) priceFilter.$gte = Number(input.minPrice);
    if (input.maxPrice !== undefined) priceFilter.$lte = Number(input.maxPrice);
    filter['minifiedVariants.price'] = priceFilter;
  }

  const textClauses: Record<string, unknown>[] = [];

  if (input.textSearch?.mode === 'keyword' && input.textSearch.keyword) {
    const pattern = buildAccentTolerantRegex(input.textSearch.keyword);
    textClauses.push({
      $or: [
        { name: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } },
        { slug: { $regex: pattern, $options: 'i' } },
      ],
    });
  }

  if (input.textSearch?.mode === 'styleOnly' && input.textSearch.style) {
    const pattern = buildAccentTolerantRegex(input.textSearch.style);
    textClauses.push({
      $or: [
        { name: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } },
      ],
    });
  }

  if (textClauses.length === 1) {
    Object.assign(filter, textClauses[0]);
  } else if (textClauses.length > 1) {
    filter.$and = textClauses;
  }

  return filter;
};

export const buildProductSearchBlob = (product: IProduct, categoryName?: string): string =>
  normalizeVietnameseText(
    [product.name, product.description, product.slug, categoryName ?? ''].filter(Boolean).join(' ')
  );

export const productMatchesNormalizedTerms = (
  product: IProduct,
  terms: string[],
  categoryName?: string
): boolean => {
  if (terms.length === 0) return true;
  const blob = buildProductSearchBlob(product, categoryName);
  return terms.every((term) => {
    const normalized = normalizeVietnameseText(term);
    return normalized.length > 0 && blob.includes(normalized);
  });
};
