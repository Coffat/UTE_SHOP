import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ui/ProductCard";
import { AppDispatch, RootState } from "@/store";
import { fetchProducts } from "@/features/catalog/catalogSlice";
import { images } from "@/lib/images";

const { products: imgProducts } = images;

// Helper giải quyết ảnh cho hoa kể cả từ database hoặc mock
export const getProductImage = (slugOrId: string): string => {
  const key = slugOrId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  if (key in imgProducts) {
    return imgProducts[key as keyof typeof imgProducts].src;
  }
  if (slugOrId.includes("lavender") || slugOrId.includes("oai-huong")) return imgProducts.lavenderDream.src;
  if (slugOrId.includes("blush") || slugOrId.includes("tulip")) return imgProducts.blushWhisper.src;
  if (slugOrId.includes("purple") || slugOrId.includes("cat-tuong")) return imgProducts.purpleSymphony.src;
  if (slugOrId.includes("pure") || slugOrId.includes("lan-ho-diep")) return imgProducts.pureElegance.src;
  return imgProducts.lavenderDream.src;
};

// Định dạng giá tiền Việt Nam Đồng
export const formatVND = (num: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

export function ProductList() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector((state: RootState) => state.catalog);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-lavender-mist pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <span className="mb-3 rounded-full bg-soft-amethyst/50 px-4 py-1 text-sm font-semibold tracking-wider text-deep-plum backdrop-blur-md">
            BỘ SƯU TẬP
          </span>
          <h1 className="mb-4 font-hero-display text-4xl font-bold text-deep-plum sm:text-5xl lg:text-6xl">
            Sắc Tím Yêu Thương
          </h1>
          <p className="max-w-2xl text-lg text-dusk-gray font-body-standard">
            Khám phá những thiết kế hoa độc bản được tạo nên từ cảm hứng mùa xuân. Mỗi bó hoa là một câu chuyện riêng, gửi gắm trọn vẹn chân tình.
          </p>
        </div>

        {/* Filters (Glassmorphism bar) */}
        <div className="glass-panel mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-deep-plum px-5 py-2 text-sm font-medium text-pure-ivory transition hover:bg-primary">
              Tất cả
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Kỷ Niệm
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Chúc Mừng
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Cưới
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-dusk-gray">Sắp xếp:</span>
            <select className="rounded-lg border border-crystal-border bg-pure-ivory/80 px-3 py-1.5 text-sm text-midnight-purple outline-none focus:border-dreamy-purple">
              <option>Mới nhất</option>
              <option>Bán chạy</option>
              <option>Giá thấp đến cao</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-crystal-border border-t-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product) => {
              const primaryVariant = product.minifiedVariants?.[0];
              const priceStr = primaryVariant ? formatVND(primaryVariant.price) : "Liên hệ";
              const descShort = product.description.length > 50 
                ? product.description.substring(0, 50) + "..." 
                : product.description;

              return (
                <div key={product._id} className="relative group cursor-pointer">
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    description={descShort}
                    price={priceStr}
                    imageUrl={getProductImage(product.slug || product._id)}
                    imageAlt={product.name}
                    rating={product.reviewStats?.ratingAverage ?? 5}
                    badge={product.tags?.includes("ban-chay") ? { label: "Bán chạy", tone: "default" } : undefined}
                  />
                  <Link to={`/product/${product._id}`} className="absolute inset-0 z-10" aria-label={`Xem chi tiết ${product.name}`}></Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        <div className="mt-16 flex justify-center">
          <button className="btn-hero-cta-gradient rounded-full px-8 py-3 text-base font-medium shadow-lg hover:-translate-y-1 transition-transform">
            Xem thêm thiết kế
          </button>
        </div>

      </div>
    </div>
  );
}
