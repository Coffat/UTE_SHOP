import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

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
  className?: string;
};

const BADGE_TONE: Record<NonNullable<ProductBadge["tone"]>, string> = {
  default: "bg-pure-ivory/80",
  pink: "bg-petal-pink/80",
};

export function ProductCard({
  name,
  description,
  price,
  imageUrl,
  imageAlt,
  badge,
  className = "",
}: Product) {
  return (
    <article
      className={`glass-panel p-4 rounded-3xl group hover:-translate-y-2 transition-transform duration-300 shadow-[0_10px_40px_rgba(168,85,247,0.05)] ${className}`}
    >
      <div className="relative h-[240px] sm:h-[280px] lg:h-[300px] xl:h-[340px] 3xl:h-[400px] w-full rounded-2xl overflow-hidden mb-4 bg-surface-container">
        <BgImage
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 w-10 h-10 glass-panel rounded-full flex items-center justify-center text-dusk-gray hover:text-petal-pink transition-colors"
        >
          <MaterialIcon name="favorite" className="text-[20px]" />
        </button>
        {badge ? (
          <div
            className={`absolute bottom-3 left-3 ${BADGE_TONE[badge.tone ?? "default"]} backdrop-blur-md px-3 py-1 rounded-full border border-pure-ivory text-xs font-ui-label text-deep-plum`}
          >
            {badge.label}
          </div>
        ) : null}
      </div>

      <div className="px-2">
        <h3 className="font-sub-heading text-[20px] text-deep-plum mb-1 truncate">
          {name}
        </h3>
        <p className="font-body-standard text-sm text-dusk-gray mb-3 truncate">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-price-display text-deep-plum">{price}</span>
          <button
            type="button"
            aria-label={`Add ${name} to cart`}
            className="w-10 h-10 bg-soft-amethyst/30 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-pure-ivory transition-colors"
          >
            <MaterialIcon name="add_shopping_cart" className="text-[20px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
