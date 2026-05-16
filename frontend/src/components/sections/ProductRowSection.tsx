import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCard, type Product } from "@/components/ui/ProductCard";

type ProductRowSectionProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
};

export function ProductRowSection({
  title,
  subtitle,
  products,
  viewAllHref = "#",
}: ProductRowSectionProps) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <h2 className="font-home-heading text-2xl font-bold text-primary sm:text-3xl md:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="font-home-heading mt-1 max-w-2xl text-sm text-dusk-gray md:text-base">{subtitle}</p>
          ) : null}
        </div>
        <Link
          to={viewAllHref}
          className="font-home-heading mt-2 flex items-center gap-1 self-start text-sm font-semibold text-primary hover:text-deep-plum sm:mt-0 sm:self-auto"
        >
          Xem tất cả
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
