import { parseDecimalPrice } from "@/lib/price";

export const isValidMongoObjectId = (value: string | undefined | null): boolean =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

type MinifiedVariantLike = {
  variantId?: string | { _id?: string };
  _id?: string;
  sizeName?: string;
  price?: number;
  inStock?: boolean;
  stock?: number;
};

export const resolvePrimaryVariant = (
  minifiedVariants?: MinifiedVariantLike[] | null
): {
  variantId: string | null;
  sizeName: string;
  price: number;
  stock: number;
} => {
  const primary = minifiedVariants?.[0];
  if (!primary) {
    return { variantId: null, sizeName: "Tiêu chuẩn", price: 0, stock: 0 };
  }

  let variantId: string | null = null;
  if (typeof primary.variantId === "string") {
    variantId = isValidMongoObjectId(primary.variantId) ? primary.variantId : null;
  } else if (primary.variantId && typeof primary.variantId === "object" && primary.variantId._id) {
    const id = String(primary.variantId._id);
    variantId = isValidMongoObjectId(id) ? id : null;
  } else if (isValidMongoObjectId(primary._id)) {
    variantId = primary._id ?? null;
  }

  return {
    variantId,
    sizeName: primary.sizeName ?? "Tiêu chuẩn",
    price: parseDecimalPrice(primary.price),
    stock: primary.stock ?? (primary.inStock === false ? 0 : 99),
  };
};

export const getProductCardVariantProps = (minifiedVariants?: MinifiedVariantLike[] | null) => {
  const primary = resolvePrimaryVariant(minifiedVariants);
  return {
    primaryVariantId: primary.variantId ?? undefined,
    primaryVariantName: primary.sizeName,
    primaryVariantPrice: primary.price,
    primaryVariantStock: primary.stock,
  };
};
