import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ProductCard } from "@/components/ui/ProductCard";
import { AppDispatch, RootState } from "@/store";
import { fetchProducts, BackendProduct } from "@/features/catalog/catalogSlice";
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
export const formatVND = (num: any): string => {
  let val = 0;
  if (typeof num === 'number') val = num;
  else if (typeof num === 'string') val = parseFloat(num);
  else if (num && num.$numberDecimal) val = parseFloat(num.$numberDecimal);
  
  if (isNaN(val)) val = 0;
  
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val);
};

export const hasTag = (product: BackendProduct, slug: string) => {
  if (!product.tags) return false;
  return product.tags.some((t: any) => 
    (typeof t === 'string' ? t === slug : t.slug === slug)
  );
};

export function ProductList() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, pagination } = useSelector((state: RootState) => state.catalog);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [priceRange, setPriceRange] = useState("Mức giá: Tất cả");
  const [color, setColor] = useState("Màu sắc: Tất cả");
  const [style, setStyle] = useState("Kiểu dáng: Tất cả");
  const [sortBy, setSortBy] = useState("Mới nhất");
  const [page, setPage] = useState(1);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, color, style, priceRange, sortBy]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const params: any = { page, limit: 12 };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    
    // Map category to slug for the backend to handle (or if backend accepts it)
    if (category !== "Tất cả") {
      if (category === "Hoa Kỷ Niệm") params.categorySlug = "hoa-ky-niem";
      else if (category === "Hoa Chúc Mừng") params.categorySlug = "hoa-chuc-mung";
      else if (category === "Hoa Cưới") params.categorySlug = "tiec-va-su-kien";
    }

    if (color !== "Màu sắc: Tất cả") params.color = color.replace("Tone ", "");
    if (style !== "Kiểu dáng: Tất cả") params.style = style;
    
    if (priceRange === "Dưới 500k") { params.maxPrice = 500000; }
    else if (priceRange === "500k - 1tr") { params.minPrice = 500000; params.maxPrice = 1000000; }
    else if (priceRange === "Trên 1tr") { params.minPrice = 1000000; }

    if (sortBy === "Giá thấp đến cao") params.sortBy = "price_asc";
    else if (sortBy === "Giá cao xuống thấp") params.sortBy = "price_desc";
    else if (sortBy === "Bán chạy") params.sortBy = "sold";
    else params.sortBy = "newest";

    dispatch(fetchProducts(params));
  }, [dispatch, debouncedSearch, category, color, style, priceRange, sortBy, page]);

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

        {/* Advanced Filters & Search (Unified Glassmorphism Toolbar) */}
        <div className="glass-panel mb-10 flex flex-col gap-5 rounded-3xl px-6 py-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] border border-white/50 backdrop-blur-xl">
          
          {/* Top row: Search & Category Pills */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Minimalist Search Bar with elegant SVG */}
            <div className="relative w-full md:w-[35%] group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-deep-plum/50 group-focus-within:text-primary transition-colors duration-300">
                {/* Custom Thin Minimalist Search Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="22" y1="22" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Khám phá hoa thiết kế..." 
                className="w-full rounded-full border border-crystal-border bg-white/40 py-2.5 pl-11 pr-4 text-sm font-medium text-midnight-purple placeholder-dusk-gray/60 outline-none transition-all duration-300 focus:border-primary/40 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(230,213,242,0.5)]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2 lg:gap-3">
              {["Tất cả", "Hoa Kỷ Niệm", "Hoa Chúc Mừng", "Hoa Cưới"].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                    category === cat 
                    ? "bg-deep-plum text-pure-ivory shadow-md ring-1 ring-deep-plum/20" 
                    : "bg-white/50 text-midnight-purple hover:bg-soft-amethyst hover:text-deep-plum border border-white/60 hover:border-transparent hover:shadow-sm"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-crystal-border/80 to-transparent opacity-60"></div>

          {/* Bottom row: Filter Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <span className="flex items-center text-xs font-semibold uppercase tracking-widest text-deep-plum/70 gap-2 mr-2">
                {/* Custom Elegant Slider Icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21v-7"></path><path d="M4 10V3"></path>
                  <path d="M12 21v-9"></path><path d="M12 8V3"></path>
                  <path d="M20 21v-5"></path><path d="M20 12V3"></path>
                  <path d="M1 14h6"></path><path d="M9 8h6"></path><path d="M17 16h6"></path>
                </svg>
                Lọc Theo
              </span>
              
              <div className="relative group/select">
                <select 
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="appearance-none rounded-xl border border-white/60 bg-white/40 pl-4 pr-10 py-2 text-sm font-medium text-midnight-purple outline-none transition-all duration-300 focus:bg-white/80 hover:bg-white/60 hover:shadow-sm cursor-pointer"
                >
                  <option>Mức giá: Tất cả</option>
                  <option value="Dưới 500k">Dưới 500.000đ</option>
                  <option value="500k - 1tr">500.000đ - 1.000.000đ</option>
                  <option value="Trên 1tr">Trên 1.000.000đ</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dusk-gray group-hover/select:text-primary transition-colors">
                  {/* Thin Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <div className="relative group/select">
                <select 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="appearance-none rounded-xl border border-white/60 bg-white/40 pl-4 pr-10 py-2 text-sm font-medium text-midnight-purple outline-none transition-all duration-300 focus:bg-white/80 hover:bg-white/60 hover:shadow-sm cursor-pointer"
                >
                  <option>Màu sắc: Tất cả</option>
                  <option value="Đỏ">Tone Đỏ</option>
                  <option value="Hồng">Tone Hồng</option>
                  <option value="Tím">Tone Tím</option>
                  <option value="Trắng">Tone Trắng</option>
                  <option value="Vàng">Tone Vàng</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dusk-gray group-hover/select:text-primary transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <div className="relative group/select">
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="appearance-none rounded-xl border border-white/60 bg-white/40 pl-4 pr-10 py-2 text-sm font-medium text-midnight-purple outline-none transition-all duration-300 focus:bg-white/80 hover:bg-white/60 hover:shadow-sm cursor-pointer"
                >
                  <option>Kiểu dáng: Tất cả</option>
                  <option value="Bó">Bó hoa</option>
                  <option value="Giỏ">Giỏ / Lẵng</option>
                  <option value="Bình">Bình hoa</option>
                  <option value="Hộp">Hộp hoa</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dusk-gray group-hover/select:text-primary transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
              <span className="flex items-center text-xs font-semibold uppercase tracking-widest text-deep-plum/70 gap-2">
                {/* Custom Elegant Sort Icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>
                </svg>
                Sắp xếp
              </span>
              <div className="relative group/select">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-xl border border-white/60 bg-white/60 pl-4 pr-10 py-2 text-sm font-semibold text-midnight-purple outline-none transition-all duration-300 focus:bg-white hover:bg-white hover:shadow-md cursor-pointer"
                >
                  <option value="Mới nhất">Mới nhất</option>
                  <option value="Bán chạy">Bán chạy nhất</option>
                  <option value="Giá thấp đến cao">Giá: Thấp đến Cao</option>
                  <option value="Giá cao xuống thấp">Giá: Cao xuống Thấp</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dusk-gray group-hover/select:text-primary transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
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
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  description={descShort}
                  price={priceStr}
                  imageUrl={product.mainImageUrl || getProductImage(product.slug || product._id)}
                  imageAlt={product.name}
                  rating={product.reviewStats?.ratingAverage ?? 5}
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

        {/* Pagination (Neo-Glassmorphism Style) */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-3">
            {/* Prev Button */}
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={!pagination.hasPrevPage}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-xl transition-all duration-300 ${
                !pagination.hasPrevPage 
                  ? "opacity-50 cursor-not-allowed text-dusk-gray" 
                  : "hover:bg-white/70 hover:shadow-sm text-midnight-purple hover:text-deep-plum hover:-translate-x-0.5"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
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
              onClick={() => { setPage(p => Math.min(pagination.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={!pagination.hasNextPage}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-xl transition-all duration-300 ${
                !pagination.hasNextPage 
                  ? "opacity-50 cursor-not-allowed text-dusk-gray" 
                  : "hover:bg-white/70 hover:shadow-sm text-midnight-purple hover:text-deep-plum hover:translate-x-0.5"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
