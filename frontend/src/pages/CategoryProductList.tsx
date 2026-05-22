import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ProductCard } from "@/components/ui/ProductCard";
import { AppDispatch, RootState } from "@/store";
import {
  fetchProducts,
  fetchCategoryBySlug,
  clearSelectedCategory,
} from "@/features/catalog/catalogSlice";
import { getProductImage, formatVND, hasTag } from "./ProductList";

export function CategoryProductList() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const { products, loading, pagination, selectedCategory } = useSelector(
    (state: RootState) => state.catalog
  );

  const [page, setPage] = useState(1);

  // Reset page and trigger initial fetch when the category slug changes
  useEffect(() => {
    if (slug) {
      // 1. Immediately clear the old selectedCategory state (Premium UX - no text jumping/lag)
      dispatch(clearSelectedCategory());
      setPage(1);
      
      // 2. Fetch new category metadata
      void dispatch(fetchCategoryBySlug(slug));
    }
    
    return () => {
      dispatch(clearSelectedCategory());
    };
  }, [slug, dispatch]);

  // Fetch paginated products under the selected category
  useEffect(() => {
    if (slug) {
      void dispatch(fetchProducts({ page, limit: 12, categorySlug: slug }));
    }
  }, [slug, page, dispatch]);

  // Visual Skeleton Loading screen for premium user experience
  const showSkeleton = loading || !selectedCategory;

  return (
    <div className="min-h-screen bg-lavender-mist pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section (Glassmorphic Banner & Breadcrumb) */}
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <nav className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-dusk-gray/70">
            <a href="/" className="hover:text-deep-plum transition">Trang Chủ</a>
            <span>•</span>
            <span className="text-primary uppercase">Danh mục</span>
          </nav>

          {showSkeleton ? (
            // Shimmer Header
            <div className="w-full flex flex-col items-center justify-center animate-pulse">
              <div className="h-10 w-[60%] sm:w-[40%] rounded-2xl bg-surface-container-high/55 mb-4 sm:h-12"></div>
              <div className="h-4 w-[80%] sm:w-[50%] rounded-lg bg-surface-container-high/55"></div>
            </div>
          ) : (
            // Loaded Header Content
            <>
              <h1 className="mb-4 font-hero-display text-4xl font-bold text-deep-plum sm:text-5xl lg:text-6xl tracking-tight">
                {selectedCategory?.name}
              </h1>
              <p className="max-w-2xl text-lg text-dusk-gray font-body-standard leading-relaxed">
                {selectedCategory?.description ||
                  `Khám phá các bó hoa và quà tặng tuyệt đẹp được tuyển chọn kỹ lưỡng trong danh mục ${selectedCategory?.name}.`}
              </p>
            </>
          )}
        </div>

        {/* Product Grid / Skeleton State */}
        {showSkeleton ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`cat-skeleton-${idx}`}
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
        ) : products.length === 0 ? (
          // Empty State Design
          <div className="glass-panel mx-auto max-w-md rounded-3xl p-8 text-center border border-white/50 backdrop-blur-xl shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-soft-amethyst/30 text-primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-deep-plum">Danh mục này hiện chưa có sản phẩm</h3>
            <p className="mb-6 text-sm text-dusk-gray">
              Chúng tôi đang cập nhật các mẫu thiết kế hoa tươi mới nhất cho danh mục này. Xin vui lòng quay lại sau!
            </p>
            <a
              href="/products"
              className="inline-flex btn-hero-cta-gradient px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide"
            >
              Khám Phá Tất Cả Hoa
            </a>
          </div>
        ) : (
          // Dynamic Product Grid
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product) => {
              const primaryVariant = product.minifiedVariants?.[0];
              const priceStr = primaryVariant ? formatVND(primaryVariant.price) : "Liên hệ";
              const descShort =
                product.description.length > 50
                  ? product.description.substring(0, 50) + "..."
                  : product.description;

              return (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  description={descShort}
                  price={priceStr}
                  imageUrl={product.mainImageUrl || getProductImage(product.slug || product._id)}
                  imageAlt={product.name}
                  rating={product.reviewStats?.ratingAverage ?? 5}
                  soldCount={product.soldCount}
                  badge={
                    hasTag(product, "khuyen-mai") ? { label: "Khuyến mãi", tone: "pink" } :
                    hasTag(product, "ban-chay") ? { label: "Bán chạy", tone: "default" } :
                    hasTag(product, "moi-ve") ? { label: "Mới về", tone: "pink" } :
                    undefined
                  }
                />
              );
            })}
          </div>
        )}

        {/* Elegant Glassmorphic Pagination */}
        {!showSkeleton && pagination && pagination.totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-3">
            {/* Previous Button */}
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={!pagination.hasPrevPage}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-xl transition-[background-color,color,box-shadow,transform] duration-300 ${
                !pagination.hasPrevPage
                  ? "opacity-50 cursor-not-allowed text-dusk-gray"
                  : "hover:bg-white/70 hover:shadow-sm text-midnight-purple hover:text-deep-plum hover:-translate-x-0.5"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Numbers */}
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setPage(pageNum);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ${
                    pageNum === pagination.page
                      ? "bg-deep-plum text-white shadow-[0_0_0_4px_rgba(230,213,242,0.5)] border border-transparent"
                      : "border border-white/60 bg-white/40 text-midnight-purple backdrop-blur-xl hover:bg-white/70 hover:shadow-sm hover:text-deep-plum"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                setPage((p) => Math.min(pagination.totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={!pagination.hasNextPage}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-xl transition-[background-color,color,box-shadow,transform] duration-300 ${
                !pagination.hasNextPage
                  ? "opacity-50 cursor-not-allowed text-dusk-gray"
                  : "hover:bg-white/70 hover:shadow-sm text-midnight-purple hover:text-deep-plum hover:translate-x-0.5"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
