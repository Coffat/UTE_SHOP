import ProductStatus from '../../../shared/enums/ProductStatus.js';
import { getProducts } from '../../catalog/services/product.service.js';
import {
  productMatchesNormalizedTerms,
  type ProductTextSearchInput,
} from '../../catalog/services/productSearchQuery.service.js';
import { normalizeVietnameseText } from '../../catalog/utils/vietnameseText.util.js';
import type { ProductSearchIntent } from './aiProductIntent.service.js';

export type SearchStrategy =
  | 'primary'
  | 'style_or_occasion_budget'
  | 'category_budget'
  | 'budget_only'
  | 'budget_relaxed'
  | 'top_sold_general';

export interface SearchProductsDebugMeta {
  searchStrategy: SearchStrategy;
  originalQuery: string;
  normalizedQuery: string;
  detectedStyle: string | null;
  detectedBudget: number | null;
  originalMaxPrice: number | null;
  effectiveMaxPrice: number | null;
  budgetRelaxed: boolean;
  returnedCount: number;
}

export interface SanitizedProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  mainImageUrl: string;
  category: { name: string; slug: string } | null;
  priceFrom: number;
  inStock: boolean;
}

export interface SearchProductsForAiSuccess {
  ok: true;
  items: SanitizedProductItem[];
  debug: SearchProductsDebugMeta;
}

export interface SearchProductsForAiFailure {
  ok: false;
  errorCode: 'DB_ERROR' | 'SEARCH_ERROR' | 'TIMEOUT';
  errorMessage: string;
  debug: Partial<SearchProductsDebugMeta>;
}

export type SearchProductsForAiResult = SearchProductsForAiSuccess | SearchProductsForAiFailure;

const MAX_RESULTS = 8;
const BUDGET_RELAX_FACTOR = 1.15;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value === 'object' && '$numberDecimal' in (value as Record<string, unknown>)) {
    return Number((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(value) || 0;
};

const sanitizeProducts = (products: Awaited<ReturnType<typeof getProducts>>['items']) =>
  products.slice(0, MAX_RESULTS).map((product) => {
    const category =
      product.category && typeof product.category === 'object' && 'name' in product.category
        ? {
            name: String((product.category as { name?: string }).name ?? ''),
            slug: String((product.category as { slug?: string }).slug ?? ''),
          }
        : null;
    const lowestPrice =
      product.minifiedVariants.length > 0
        ? Math.min(...product.minifiedVariants.map((variant) => toNumber(variant.price)))
        : 0;
    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      mainImageUrl: product.mainImageUrl || '',
      category,
      priceFrom: lowestPrice,
      inStock: product.minifiedVariants.some((variant) => variant.inStock),
    };
  });

interface LadderStep {
  strategy: SearchStrategy;
  categorySlug?: string;
  textSearch?: ProductTextSearchInput;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'sold';
  postFilterTerms?: string[];
}

const buildLadderSteps = (intent: ProductSearchIntent): LadderStep[] => {
  const originalMaxPrice = intent.filters?.maxPrice;
  const style = intent.filters?.style;
  const categorySlug = intent.occasionCategorySlug;
  const shortKeyword = intent.keyword?.trim();
  const postTerms = [style, shortKeyword].filter((t): t is string => Boolean(t && t.length > 0));

  const steps: LadderStep[] = [
    {
      strategy: 'primary',
      categorySlug,
      textSearch: style
        ? { mode: 'styleOnly', style }
        : shortKeyword
          ? { mode: 'keyword', keyword: shortKeyword }
          : undefined,
      maxPrice: originalMaxPrice,
      sortBy: intent.filters?.sortBy ?? (originalMaxPrice ? 'price_asc' : 'sold'),
      postFilterTerms: postTerms,
    },
    {
      strategy: 'style_or_occasion_budget',
      categorySlug,
      textSearch: style ? { mode: 'styleOnly', style } : undefined,
      maxPrice: originalMaxPrice,
      sortBy: originalMaxPrice ? 'price_asc' : 'sold',
      postFilterTerms: style ? [style] : [],
    },
    {
      strategy: 'category_budget',
      categorySlug,
      maxPrice: originalMaxPrice,
      sortBy: originalMaxPrice ? 'price_asc' : 'sold',
      postFilterTerms: [],
    },
    {
      strategy: 'budget_only',
      maxPrice: originalMaxPrice,
      sortBy: 'price_asc',
      postFilterTerms: [],
    },
  ];

  if (originalMaxPrice) {
    steps.push({
      strategy: 'budget_relaxed',
      categorySlug,
      textSearch: style ? { mode: 'styleOnly', style } : undefined,
      maxPrice: Math.round(originalMaxPrice * BUDGET_RELAX_FACTOR),
      sortBy: 'price_asc',
      postFilterTerms: style ? [style] : [],
    });
  }

  if (intent.isGeneralConsultation) {
    steps.push({
      strategy: 'top_sold_general',
      sortBy: 'sold',
      postFilterTerms: [],
    });
  }

  return steps;
};

const runLadderStep = async (
  step: LadderStep,
  excludeProductIds?: string[]
): Promise<SanitizedProductItem[]> => {
  const result = await getProducts({
    status: ProductStatus.ACTIVE,
    categorySlug: step.categorySlug,
    textSearch: step.textSearch,
    minPrice: undefined,
    maxPrice: step.maxPrice,
    sortBy: step.sortBy,
    excludeProductIds,
    page: 1,
    limit: Math.max(MAX_RESULTS * 3, 24),
  });

  const filtered = result.items.filter((product) => {
    const categoryName =
      product.category && typeof product.category === 'object' && 'name' in product.category
        ? String((product.category as { name?: string }).name ?? '')
        : undefined;
    return productMatchesNormalizedTerms(product, step.postFilterTerms ?? [], categoryName);
  });

  return sanitizeProducts(filtered);
};

const buildNormalizedQuery = (intent: ProductSearchIntent): string => {
  const parts = [intent.keyword, intent.filters?.style, intent.occasionCategorySlug].filter(Boolean);
  return normalizeVietnameseText(parts.join(' '));
};

export const searchProductsForAi = async (
  intent: ProductSearchIntent,
  options?: { excludeProductIds?: string[] }
): Promise<SearchProductsForAiResult> => {
  const originalMaxPrice = intent.filters?.maxPrice ?? null;
  const baseDebug: Partial<SearchProductsDebugMeta> = {
    originalQuery: intent.originalQuery,
    normalizedQuery: buildNormalizedQuery(intent),
    detectedStyle: intent.filters?.style ?? null,
    detectedBudget: originalMaxPrice,
    originalMaxPrice,
    effectiveMaxPrice: originalMaxPrice,
    budgetRelaxed: false,
    returnedCount: 0,
  };

  try {
    const steps = buildLadderSteps(intent);
    for (const step of steps) {
      const items = await runLadderStep(step, options?.excludeProductIds);
      if (items.length > 0) {
        const budgetRelaxed = step.strategy === 'budget_relaxed';
        return {
          ok: true,
          items,
          debug: {
            searchStrategy: step.strategy,
            originalQuery: intent.originalQuery,
            normalizedQuery: buildNormalizedQuery(intent),
            detectedStyle: intent.filters?.style ?? null,
            detectedBudget: originalMaxPrice,
            originalMaxPrice,
            effectiveMaxPrice: step.maxPrice ?? originalMaxPrice,
            budgetRelaxed,
            returnedCount: items.length,
          },
        };
      }
    }

    return {
      ok: true,
      items: [],
      debug: {
        searchStrategy: steps[steps.length - 1]?.strategy ?? 'primary',
        originalQuery: intent.originalQuery,
        normalizedQuery: buildNormalizedQuery(intent),
        detectedStyle: intent.filters?.style ?? null,
        detectedBudget: originalMaxPrice,
        originalMaxPrice,
        effectiveMaxPrice: originalMaxPrice,
        budgetRelaxed: false,
        returnedCount: 0,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Product search failed';
    return {
      ok: false,
      errorCode: 'DB_ERROR',
      errorMessage: message,
      debug: baseDebug,
    };
  }
};
