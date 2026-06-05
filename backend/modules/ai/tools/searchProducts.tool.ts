import {
  buildProductSearchIntentFromToolArgs,
} from '../services/aiProductIntent.service.js';
import { searchProductsForAi } from '../services/productSearchForAi.service.js';
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

    const intent = buildProductSearchIntentFromToolArgs(args);
    const searchOutcome = await searchProductsForAi(intent);

    if (!searchOutcome.ok) {
      return {
        toolName: 'searchProducts',
        status: 'FAILED',
        result: {
          returnedCount: 0,
          ...searchOutcome.debug,
        },
        errorCode: searchOutcome.errorCode,
        errorMessage: searchOutcome.errorMessage,
        handoffReason: null,
      };
    }

    const { items, debug } = searchOutcome;

    return {
      toolName: 'searchProducts',
      status: 'SUCCESS',
      result: {
        total: items.length,
        returnedCount: debug.returnedCount,
        items,
        searchStrategy: debug.searchStrategy,
        originalQuery: debug.originalQuery,
        normalizedQuery: debug.normalizedQuery,
        detectedStyle: debug.detectedStyle,
        detectedBudget: debug.detectedBudget,
        originalMaxPrice: debug.originalMaxPrice,
        effectiveMaxPrice: debug.effectiveMaxPrice,
        budgetRelaxed: debug.budgetRelaxed,
      },
      errorCode: null,
      errorMessage: null,
      handoffReason: null,
    };
  },
};
