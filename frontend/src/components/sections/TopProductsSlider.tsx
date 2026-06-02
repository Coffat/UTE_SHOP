import { useId, useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCard, type Product } from "@/components/ui/ProductCard";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type TopProductsSliderProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  isLoading?: boolean;
  viewAllHref?: string;
};

function SliderArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopProductsSlider({
  title,
  subtitle,
  products,
  isLoading = false,
  viewAllHref = "/products",
}: TopProductsSliderProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationId = useId().replace(/:/g, "");

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
        {/* Header Skeleton */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10 animate-pulse">
          <div>
            <div className="h-8 w-64 rounded bg-surface-container-high/40 sm:h-10"></div>
            <div className="mt-2 h-4 w-96 rounded bg-surface-container-high/40"></div>
          </div>
          <div className="mt-2 h-5 w-24 rounded bg-surface-container-high/40 sm:mt-0"></div>
        </div>

        {/* Slider Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex h-[360px] flex-col overflow-hidden rounded-2xl border border-crystal-border bg-pure-ivory/50 p-2 shadow-sm animate-pulse"
            >
              <div className="aspect-[4/5] w-full rounded-2xl bg-surface-container-high/50"></div>
              <div className="flex flex-col gap-3 p-3">
                <div className="h-4 w-3/4 rounded bg-surface-container-high/50"></div>
                <div className="h-3 w-1/2 rounded bg-surface-container-high/50"></div>
                <div className="h-6 w-full rounded-full bg-surface-container-high/50"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <h2 className="font-home-heading text-2xl font-bold text-primary sm:text-3xl md:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="font-home-heading mt-1 max-w-2xl text-sm text-dusk-gray md:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link
            to={viewAllHref}
            className="font-home-heading flex items-center gap-1 text-sm font-semibold text-primary hover:text-deep-plum transition-colors"
          >
            Xem tất cả
            <MaterialIcon name="chevron_right" className="text-[18px]" />
          </Link>
        </div>
      </div>

      {/* Swiper Container with conditional loading guard */}
      <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <button
          ref={prevRef}
          className="prev-btn hidden h-10 w-10 items-center justify-center rounded-full border border-crystal-border bg-white/90 shadow-sm text-primary transition-[color,background-color,box-shadow,transform,opacity] duration-300 hover:bg-white hover:text-deep-plum hover:shadow active:scale-90 disabled:opacity-45 md:flex"
          aria-label="Previous slide"
        >
          <SliderArrowIcon className="rotate-180" />
        </button>

        <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-[0_12px_44px_rgba(49,27,146,0.04)]">
          <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // Re-assign navigation elements correctly on swiper initialization
            if (swiper.params.navigation && typeof swiper.params.navigation === "object") {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }
          }}
          pagination={{
            el: `#${paginationId}`,
            clickable: true,
            dynamicBullets: false,
          }}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            480: {
              slidesPerView: 1.5,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          className="pb-1"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <ProductCard {...product} />
            </SwiperSlide>
          ))}
        </Swiper>
        <div
          id={paginationId}
          className="swiper-pagination mt-4 flex justify-center [&_.swiper-pagination-bullet]:mx-1 [&_.swiper-pagination-bullet]:h-2.5 [&_.swiper-pagination-bullet]:w-2.5 [&_.swiper-pagination-bullet]:bg-dusk-gray/35 [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet-active]:bg-primary"
        />
        </div>

        <button
          ref={nextRef}
          className="next-btn hidden h-10 w-10 items-center justify-center rounded-full border border-crystal-border bg-white/90 shadow-sm text-primary transition-[color,background-color,box-shadow,transform,opacity] duration-300 hover:bg-white hover:text-deep-plum hover:shadow active:scale-90 disabled:opacity-45 md:flex"
          aria-label="Next slide"
        >
          <SliderArrowIcon />
        </button>
      </div>
    </section>
  );
}
