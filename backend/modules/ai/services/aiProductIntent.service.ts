import { extractBudgetMaxFromText } from '../../catalog/utils/vietnameseText.util.js';

export interface ProductSearchIntent {
  keyword: string;
  originalQuery: string;
  occasionCategorySlug?: string;
  isGeneralConsultation: boolean;
  filters?: {
    style?: string;
    maxPrice?: number;
    minPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'sold';
  };
}

const PRODUCT_INTENT_PATTERN =
  /\b(tư vấn|tu van|gợi ý|goi y|đề xuất|de xuat|sản phẩm|san pham|mẫu hoa|mau hoa|muốn mua|muon mua|cần hoa|can hoa|chọn hoa|chon hoa|phong cách|phong cach|ngân sách|ngan sach|tầm|tam|dưới|duoi|khoảng|khoang|triệu|trieu|tr\d|bó hoa|bo hoa|bình hoa|binh hoa|quà tặng|qua tang|lãng mạn|lang man|sinh nhật|sinh nhat|khai trương|khai truong|đám cưới|dam cuoi|chúc mừng|chuc mung|chia buồn|chia buon|viếng|vien)\b/i;

const OTHER_SUGGESTION_PATTERN =
  /\b(gợi ý khác|goi y khac|mẫu khác|mau khac|sản phẩm khác|san pham khac|xem thêm|xem them|khác đi|khac di)\b/i;

const SPECIFIC_OCCASION_PATTERN =
  /\b(lãng mạn|lang man|sinh nhật|sinh nhat|khai trương|khai truong|đám cưới|dam cuoi|cưới|cuoi|chia buồn|chia buon|viếng|vien|sang trọng|sang trong|tối giản|toi gian)\b/i;

interface StyleKeywordEntry {
  pattern: RegExp;
  style: string;
  occasionCategorySlug?: string;
}

const STYLE_KEYWORDS: StyleKeywordEntry[] = [
  { pattern: /\b(lãng mạn|lang man|romantic)\b/i, style: 'lãng mạn', occasionCategorySlug: 'hoa-tinh-yeu' },
  { pattern: /\b(sang trọng|sang trong|luxury|cao cấp|cao cap)\b/i, style: 'sang trọng' },
  { pattern: /\b(tối giản|toi gian|minimal)\b/i, style: 'tối giản' },
  { pattern: /\b(vui tươi|vui tuoi|tươi sáng|tuoi sang)\b/i, style: 'vui tươi' },
  { pattern: /\b(sinh nhật|sinh nhat|birthday)\b/i, style: 'sinh nhật', occasionCategorySlug: 'hoa-sinh-nhat' },
  { pattern: /\b(khai trương|khai truong)\b/i, style: 'khai trương', occasionCategorySlug: 'hoa-khai-truong' },
  { pattern: /\b(đám cưới|dam cuoi|cưới|cuoi)\b/i, style: 'cưới', occasionCategorySlug: 'hoa-cuoi' },
  { pattern: /\b(chia buồn|chia buon|viếng|vien)\b/i, style: 'chia buồn', occasionCategorySlug: 'hoa-chia-buon' },
];

export const EMPTY_PRODUCT_SEARCH_REPLY =
  'Hiện chưa tìm thấy sản phẩm phù hợp trong shop. Bạn có thể mô tả thêm dịp tặng hoặc ngân sách để mình gợi ý lại nhé.';

export const PRODUCT_SEARCH_FAILED_REPLY =
  'Hệ thống tìm kiếm sản phẩm tạm thời gặp sự cố. Bạn thử lại sau giây lát hoặc bấm Gặp nhân viên để được hỗ trợ trực tiếp nhé.';

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value
  );

const hasProductIntentSignal = (content: string): boolean => {
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (PRODUCT_INTENT_PATTERN.test(trimmed)) return true;
  if (OTHER_SUGGESTION_PATTERN.test(trimmed)) return true;
  return extractBudgetMaxFromText(trimmed) !== undefined;
};

const buildIntentFromMergedText = (mergedText: string, originalQuery: string): ProductSearchIntent | null => {
  const trimmed = mergedText.trim();
  if (!trimmed) return null;
  if (!hasProductIntentSignal(trimmed)) return null;

  const styleMatch = STYLE_KEYWORDS.find((entry) => entry.pattern.test(trimmed));
  const maxPrice = extractBudgetMaxFromText(trimmed);
  const hasSpecificOccasion = SPECIFIC_OCCASION_PATTERN.test(trimmed);
  const isGeneralConsultation = !styleMatch && !hasSpecificOccasion;

  const keyword = styleMatch ? 'hoa' : 'hoa tươi';

  return {
    keyword,
    originalQuery,
    occasionCategorySlug: styleMatch?.occasionCategorySlug,
    isGeneralConsultation,
    filters: {
      style: styleMatch?.style,
      maxPrice,
      sortBy: maxPrice ? 'price_asc' : 'sold',
    },
  };
};

export const detectProductSearchIntent = (content: string): ProductSearchIntent | null =>
  buildIntentFromMergedText(content, content.trim());

export const detectProductSearchIntentFromHistory = (
  lastCustomerMessages: string[]
): ProductSearchIntent | null => {
  const recent = lastCustomerMessages
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(-5);
  if (recent.length === 0) return null;

  const latest = recent[recent.length - 1] ?? '';
  const originalQuery = recent.join(' | ');

  if (OTHER_SUGGESTION_PATTERN.test(latest) && recent.length > 1) {
    const prior = recent.slice(0, -1).join(' ');
    return buildIntentFromMergedText(`${prior} ${latest}`, originalQuery);
  }

  return buildIntentFromMergedText(recent.join(' '), originalQuery);
};

export const intentToSearchToolArguments = (intent: ProductSearchIntent) => ({
  keyword: intent.keyword,
  filters: {
    categorySlug: intent.occasionCategorySlug,
    style: intent.filters?.style,
    maxPrice: intent.filters?.maxPrice,
    minPrice: intent.filters?.minPrice,
    sortBy: intent.filters?.sortBy,
  },
});

export const buildProductSearchIntentFromToolArgs = (
  args: {
    keyword: string;
    filters?: {
      categorySlug?: string;
      style?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price_asc' | 'price_desc' | 'sold';
    };
  },
  originalQuery?: string
): ProductSearchIntent => {
  const merged = [args.keyword, args.filters?.style, args.filters?.categorySlug]
    .filter(Boolean)
    .join(' ');
  const styleMatch = STYLE_KEYWORDS.find((entry) =>
    args.filters?.style ? entry.style === args.filters.style : entry.pattern.test(merged)
  );
  const hasSpecificOccasion =
    Boolean(args.filters?.style) ||
    Boolean(args.filters?.categorySlug) ||
    SPECIFIC_OCCASION_PATTERN.test(merged);
  const isGeneralConsultation = !hasSpecificOccasion && args.keyword.trim() === 'hoa tươi';

  return {
    keyword: styleMatch || args.filters?.style ? 'hoa' : args.keyword.trim() || 'hoa tươi',
    originalQuery: originalQuery?.trim() || merged || args.keyword,
    occasionCategorySlug: args.filters?.categorySlug ?? styleMatch?.occasionCategorySlug,
    isGeneralConsultation,
    filters: {
      style: args.filters?.style ?? styleMatch?.style,
      maxPrice: args.filters?.maxPrice,
      minPrice: args.filters?.minPrice,
      sortBy: args.filters?.sortBy,
    },
  };
};

export interface ProductSuggestionCard {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  mainImageUrl?: string;
  priceFrom?: number;
  inStock?: boolean;
}

export interface ProductAdviceOptions {
  budgetRelaxed?: boolean;
}

export const buildProductAdviceFromSuggestions = (
  suggestions: ProductSuggestionCard[],
  customerHint?: string,
  options?: ProductAdviceOptions
): string => {
  if (suggestions.length === 0) {
    return EMPTY_PRODUCT_SEARCH_REPLY;
  }

  const intro = customerHint?.trim()
    ? 'Dựa trên nhu cầu của bạn, UTESHOP gợi ý các sản phẩm sau:'
    : 'UTEShop gợi ý cho bạn các sản phẩm sau:';

  const bullets = suggestions.slice(0, 5).map((item) => {
    const priceText =
      typeof item.priceFrom === 'number' && item.priceFrom > 0
        ? `giá từ ${formatVnd(item.priceFrom)}`
        : 'giá liên hệ';
    const stockText = item.inStock === false ? ' (tạm hết)' : '';
    return `• ${item.name} — ${priceText}${stockText}`;
  });

  const lines = [
    intro,
    ...bullets,
    'Bạn bấm vào thẻ sản phẩm bên dưới để xem chi tiết và đặt hàng nhé.',
  ];

  if (options?.budgetRelaxed) {
    lines.splice(
      1,
      0,
      'Có vài mẫu giá hơi vượt ngân sách bạn nêu, mình gợi ý sát nhất có trong shop.'
    );
  }

  return lines.join('\n');
};
