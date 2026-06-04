import ProductStatus from '../../../shared/enums/ProductStatus.js';
import { getProducts } from '../../catalog/services/product.service.js';
import type { AiToolExecutionResult, AiToolHandler } from './tool.types.js';

interface SearchProductsArguments {
  keyword: string;
  filters?: {
    categorySlug?: string;
    color?: string;
    style?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'sold';
  };
}

const MAX_SEARCH_RESULTS = 8;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value === 'object' && '$numberDecimal' in (value as Record<string, unknown>)) {
    return Number((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(value) || 0;
};

export const searchProductsTool: AiToolHandler<SearchProductsArguments> = {
  name: 'searchProducts',
  async execute(args): Promise<AiToolExecutionResult> {
    const trimmedKeyword = args.keyword.trim();
    if (!trimmedKeyword) {
      return {
        toolName: 'searchProducts',
        status: 'INVALID_REQUEST',
        result: null,
        errorCode: 'INVALID_KEYWORD',
        errorMessage: 'Keyword tìm kiếm không hợp lệ.',
        handoffReason: null,
      };
    }

    const result = await getProducts({
      status: ProductStatus.ACTIVE,
      search: trimmedKeyword,
      categorySlug: args.filters?.categorySlug,
      color: args.filters?.color,
      style: args.filters?.style,
      minPrice: args.filters?.minPrice,
      maxPrice: args.filters?.maxPrice,
      sortBy: args.filters?.sortBy,
      page: 1,
      limit: MAX_SEARCH_RESULTS,
    });

    const sanitizedItems = result.items.slice(0, MAX_SEARCH_RESULTS).map((product) => {
      const lowestPrice = product.minifiedVariants.length > 0
        ? Math.min(...product.minifiedVariants.map((variant) => toNumber(variant.price)))
        : 0;
      return {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        mainImageUrl: product.mainImageUrl || '',
        category:
          product.category && typeof product.category === 'object' && 'name' in product.category
            ? {
                name: String((product.category as { name?: string }).name ?? ''),
                slug: String((product.category as { slug?: string }).slug ?? ''),
              }
            : null,
        priceFrom: lowestPrice,
        inStock: product.minifiedVariants.some((variant) => variant.inStock),
      };
    });

    return {
      toolName: 'searchProducts',
      status: 'SUCCESS',
      result: {
        total: sanitizedItems.length,
        items: sanitizedItems,
      },
      errorCode: null,
      errorMessage: null,
      handoffReason: null,
    };
  },
};
