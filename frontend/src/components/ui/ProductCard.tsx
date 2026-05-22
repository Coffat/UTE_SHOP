import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AppDispatch, RootState } from "@/store";
import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { addToCart } from "@/features/cart/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/features/wishlist/wishlistSlice";
import { useToast } from "@/components/ui/ToastContext";

export type ProductBadge = {
  label: string;
  tone?: "default" | "pink";
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  badge?: ProductBadge;
  /** Số sao hiển thị 1–5, mặc định 5 */
  rating?: number;
  soldCount?: number;
  className?: string;
};

const BADGE_PILL_BASE =
  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm font-home-heading sm:px-3 sm:py-1 sm:text-xs";

const BADGE_TONE: Record<NonNullable<ProductBadge["tone"]>, string> = {
  default: "bg-primary/90 text-pure-ivory border-primary/20",
  pink: "bg-petal-pink text-deep-plum border-petal-pink/80",
};

/** Tag giá trên ảnh — khác tone badge trạng thái (tím đặc / hồng). */
const PRICE_TAG_ON_IMAGE =
  "border-primary/30 bg-pure-ivory/92 text-primary shadow-sm";

function StarRow({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="flex gap-0.5" aria-label={`${n} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <MaterialIcon
          key={`star-${i}`}
          name="star"
          filled={i < n}
          className={`text-[12px] sm:text-[13px] ${i < n ? "text-star-rating" : "text-dusk-gray/45"}`}
        />
      ))}
    </div>
  );
}

function PriceOnImageTag({ price }: { price: string }) {
  return (
    <div
      className={`absolute right-2.5 top-2.5 z-[1] max-w-[calc(100%-5rem)] text-right sm:right-3 sm:top-3 ${BADGE_PILL_BASE} ${PRICE_TAG_ON_IMAGE}`}
      title={price}
    >
      <span className="block truncate">{price}</span>
    </div>
  );
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  imageAlt,
  badge,
  rating = 5,
  soldCount,
  className = "",
}: Product) {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.profile);
  const wishlistItems = useSelector((state: RootState) => state.wishlist?.items || []);
  const isFavorited = wishlistItems.some((item) => item._id === id);
  const { showToast } = useToast();

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!profile) {
      showToast("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích của bạn.", "warning");
      return;
    }

    if (isFavorited) {
      dispatch(removeFromWishlist(id));
    } else {
      const numericPrice = parseInt(price.replace(/[^0-9]/g, "")) || 0;
      dispatch(
        addToWishlist({
          _id: id,
          name,
          description,
          mainImageUrl: imageUrl,
          status: "ACTIVE",
          minifiedVariants: [
            {
              _id: "default",
              sizeName: "Tiêu chuẩn",
              price: numericPrice,
              stock: 99,
            },
          ],
        } as any)
      );
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const numericPrice = parseInt(price.replace(/[^0-9]/g, "")) || 0;
    dispatch(
      addToCart({
        productId: id,
        variantId: "default",
        name,
        variantName: "Tiêu chuẩn",
        price: numericPrice,
        imageUrl,
        quantity: 1,
        stock: 99,
      })
    );
    showToast(`Đã thêm "${name}" vào giỏ hàng thành công!`, "success");
  };

  return (
    <article
      className={`group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-crystal-border bg-pure-ivory shadow-[0_8px_28px_rgba(49,27,146,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(49,27,146,0.1)] sm:rounded-[1.35rem] ${className}`.trim()}
    >
      <Link
        to={`/product/${id}`}
        className="relative block aspect-[4/5] w-full shrink-0 overflow-hidden rounded-t-2xl bg-surface-container sm:rounded-t-[1.35rem]"
      >
        <BgImage
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {badge ? (
          <div
            className={`absolute left-2.5 top-2.5 z-[1] sm:left-3 sm:top-3 ${BADGE_PILL_BASE} ${BADGE_TONE[badge.tone ?? "default"]}`}
          >
            {badge.label}
          </div>
        ) : null}
        <PriceOnImageTag price={price} />

        {/* Favorite Button (Floating glassmorphic circle with heart icon) */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          aria-label={isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          className="absolute left-2.5 bottom-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-pure-ivory/70 backdrop-blur-md shadow-[0_4px_12px_rgba(49,27,146,0.06)] transition-all duration-300 hover:bg-rose-50/80 active:scale-90 sm:left-3 sm:bottom-3 sm:h-9 sm:w-9 group/fav"
        >
          <MaterialIcon
            name="favorite"
            filled={isFavorited}
            className={`text-[16px] sm:text-[18px] transition-all duration-300 ${
              isFavorited
                ? "text-rose-500 scale-110"
                : "text-deep-plum/60 group-hover/fav:text-rose-400 group-hover/fav:scale-110"
            }`}
          />
        </button>
      </Link>

      <div className="flex min-h-0 flex-1 flex-row items-stretch gap-2 border-t border-crystal-border/45 px-2.5 pb-2.5 pt-2 sm:gap-3 sm:px-3 sm:pb-3 sm:pt-2.5">
        <Link
          to={`/product/${id}`}
          className="flex w-[min(100%,10.25rem)] max-w-[10.25rem] shrink-0 flex-col gap-1 sm:w-[min(100%,11.25rem)] sm:max-w-[11.25rem] hover:opacity-85 transition-opacity"
        >
          <h3 className="font-home-heading line-clamp-2 text-sm font-bold leading-tight text-on-surface sm:text-[0.9375rem] group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StarRow rating={rating} />
            {soldCount !== undefined && soldCount > 0 && (
              <span className="text-[10px] text-dusk-gray font-semibold">
                • Đã bán {soldCount}
              </span>
            )}
          </div>
          <p className="font-home-heading line-clamp-2 text-[10px] leading-snug text-dusk-gray sm:text-[11px]">{description}</p>
        </Link>

        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-end pr-0.5">
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Thêm ${name} vào giỏ`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-pure-ivory shadow-sm transition hover:bg-deep-plum sm:h-10 sm:w-10 active:scale-95"
          >
            <MaterialIcon name="shopping_bag" filled={false} className="text-[16px] sm:text-[17px]" />
          </button>
        </div>
      </div>
    </article>
  );
}

