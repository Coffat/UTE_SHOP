import ProductStatus from '../../../shared/enums/ProductStatus.js';
import { getProductById, getVariantsByProduct } from '../../catalog/services/product.service.js';
import type { AiToolExecutionResult, AiToolHandler } from './tool.types.js';

interface GetProductDetailArguments {
  productId: string;
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value === 'object' && '$numberDecimal' in (value as Record<string, unknown>)) {
    return Number((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(value) || 0;
};

export const getProductDetailTool: AiToolHandler<GetProductDetailArguments> = {
  name: 'getProductDetail',
  async execute(args): Promise<AiToolExecutionResult> {
    const productId = args.productId.trim();
    if (!productId) {
      return {
        toolName: 'getProductDetail',
        status: 'INVALID_REQUEST',
        result: null,
        errorCode: 'INVALID_PRODUCT_ID',
        errorMessage: 'productId không hợp lệ.',
        handoffReason: null,
      };
    }

    const product = await getProductById(productId);
    if (!product || product.status !== ProductStatus.ACTIVE) {
      return {
        toolName: 'getProductDetail',
        status: 'DENIED',
        result: null,
        errorCode: 'PRODUCT_NOT_PUBLIC',
        errorMessage: 'Sản phẩm không tồn tại hoặc không khả dụng.',
        handoffReason: null,
      };
    }

    const variants = await getVariantsByProduct(productId);
    const activeVariants = variants
      .filter((variant) => variant.isActive)
      .slice(0, 10)
      .map((variant) => ({
        id: variant._id.toString(),
        sizeName: variant.sizeName || 'Mặc định',
        price: toNumber(variant.price),
        stockStatus: variant.stockStatus,
        imageUrls: variant.imageUrls.slice(0, 4),
      }));

    const sanitizedResult = {
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
      variants: activeVariants,
    };

    return {
      toolName: 'getProductDetail',
      status: 'SUCCESS',
      result: sanitizedResult,
      errorCode: null,
      errorMessage: null,
      handoffReason: null,
    };
  },
};
