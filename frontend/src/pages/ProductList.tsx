import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { AppDispatch, RootState } from "@/store";
import { fetchProducts, BackendProduct } from "@/features/catalog/catalogSlice";
import { fetchCategories } from "@/features/catalog/categoriesSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
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
  const categories = useSelector((state: RootState) => state.categories?.items || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("Tất cả"); // Holds "Tất cả" or the selected category's slug
  const [priceRange, setPriceRange] = useState("Mức giá: Tất cả");
  const [color, setColor] = useState("Màu sắc: Tất cả");
  const [style, setStyle] = useState("Kiểu dáng: Tất cả");
  const [sortBy, setSortBy] = useState("Mới nhất");
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch categories if not already loaded
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

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
    
    // Pass category slug directly if not all
    if (category !== "Tất cả") {
      params.categorySlug = category;
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

  // Prevent scroll when mobile bottom sheet is open
  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isMobileFilterOpen]);

  const activeCategoryObject = categories.find(c => c.slug === category);
  const activeCategoryName = activeCategoryObject ? activeCategoryObject.name : "Tất cả";

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategory("Tất cả");
    setPriceRange("Mức giá: Tất cả");
    setColor("Màu sắc: Tất cả");
    setStyle("Kiểu dáng: Tất cả");
    setSortBy("Mới nhất");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pure-ivory via-lavender-mist/10 to-pure-ivory pt-24 pb-16 md:pt-32">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1440px] px-2 md:px-6">
        
        {/* 1. Header Section */}
        <section className="text-center max-w-2xl mx-auto mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-slogan text-3xl text-primary block mb-2"
          >
            Cửa hàng UTE_SHOP
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-section-title text-[44px] leading-tight text-deep-plum mb-4 md:text-[52px]"
          >
            Sắc Hoa <span className="text-primary italic font-serif font-normal">Yêu Thương</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-dusk-gray text-base leading-relaxed"
          >
            Khám phá những thiết kế hoa độc bản được tạo nên từ cảm hứng thiên nhiên ngọt ngào. Mỗi bó hoa là một tác phẩm nghệ thuật gửi gắm trọn vẹn tình cảm chân thành nhất.
          </motion.p>
        </section>

        {/* Layout Grid: Sidebar on Desktop, Content on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 1. Desktop Vertical Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            
            {/* Search Panel */}
            <div className="glass-panel rounded-3xl p-5 border border-crystal-border/80 bg-pure-ivory/80 shadow-sm relative group">
              <h3 className="font-home-heading text-[12px] font-bold uppercase tracking-wider text-deep-plum mb-3">Tìm Kiếm</h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập tên hoa..."
                  className="w-full rounded-2xl border border-crystal-border bg-white/40 py-2.5 pl-10 pr-4 text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none transition-all duration-300 focus:border-primary/40 focus:bg-white/70"
                />
                <MaterialIcon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dusk-gray text-[18px]" />
              </div>
            </div>

            {/* Dynamic Categories Selection panel */}
            <div className="glass-panel rounded-3xl p-5 border border-crystal-border/80 bg-pure-ivory/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-crystal-border/60">
                <h3 className="font-home-heading text-[12px] font-bold uppercase tracking-wider text-deep-plum">Danh mục</h3>
                {category !== "Tất cả" && (
                  <button onClick={() => setCategory("Tất cả")} className="text-[10px] font-extrabold text-primary hover:underline">
                    Xóa chọn
                  </button>
                )}
              </div>
              <ul className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                <li>
                  <button
                    onClick={() => setCategory("Tất cả")}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                      category === "Tất cả"
                        ? "bg-primary text-pure-ivory shadow-sm"
                        : "text-midnight-purple hover:bg-soft-amethyst/30"
                    }`}
                  >
                    <span>Tất cả sản phẩm</span>
                    {category === "Tất cả" && <MaterialIcon name="check" className="text-[14px]" />}
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      onClick={() => setCategory(cat.slug)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 text-left ${
                        category === cat.slug
                          ? "bg-primary text-pure-ivory shadow-sm"
                          : "text-midnight-purple hover:bg-soft-amethyst/30"
                      }`}
                    >
                      <span className="truncate pr-1">{cat.name}</span>
                      {category === cat.slug && <MaterialIcon name="check" className="text-[14px]" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advanced Filters Panel */}
            <div className="glass-panel rounded-3xl p-5 border border-crystal-border/80 bg-pure-ivory/80 shadow-sm space-y-6">
              
              {/* Filter price */}
              <div>
                <h4 className="font-home-heading text-[12px] font-bold uppercase tracking-wider text-deep-plum mb-3">Mức Giá</h4>
                <div className="space-y-2">
                  {["Mức giá: Tất cả", "Dưới 500k", "500k - 1tr", "Trên 1tr"].map((range) => (
                    <label key={range} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-midnight-purple hover:text-primary transition-colors">
                      <input
                        type="radio"
                        name="price-range-desktop"
                        checked={priceRange === range}
                        onChange={() => setPriceRange(range)}
                        className="h-4 w-4 rounded-full border-crystal-border text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <span>{range === "Mức giá: Tất cả" ? "Tất cả khoảng giá" : range}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter color */}
              <div>
                <h4 className="font-home-heading text-[12px] font-bold uppercase tracking-wider text-deep-plum mb-3">Tone Màu</h4>
                <div className="space-y-2">
                  {["Màu sắc: Tất cả", "Đỏ", "Hồng", "Tím", "Trắng", "Vàng"].map((c) => (
                    <label key={c} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-midnight-purple hover:text-primary transition-colors">
                      <input
                        type="radio"
                        name="color-desktop"
                        checked={color === (c === "Màu sắc: Tất cả" ? c : `Tone ${c}`)}
                        onChange={() => setColor(c === "Màu sắc: Tất cả" ? c : `Tone ${c}`)}
                        className="h-4 w-4 rounded-full border-crystal-border text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <span>{c === "Màu sắc: Tất cả" ? "Tất cả màu sắc" : `Tone màu ${c}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter style */}
              <div>
                <h4 className="font-home-heading text-[12px] font-bold uppercase tracking-wider text-deep-plum mb-3">Kiểu Dáng</h4>
                <div className="space-y-2">
                  {["Kiểu dáng: Tất cả", "Bó", "Giỏ", "Bình", "Hộp"].map((s) => {
                    const labelText = s === "Kiểu dáng: Tất cả" ? "Tất cả kiểu dáng" : s === "Bó" ? "Bó hoa" : s === "Giỏ" ? "Giỏ / Lẵng hoa" : s === "Bình" ? "Bình hoa nghệ thuật" : "Hộp hoa thiết kế";
                    return (
                      <label key={s} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-midnight-purple hover:text-primary transition-colors">
                        <input
                          type="radio"
                          name="style-desktop"
                          checked={style === (s === "Kiểu dáng: Tất cả" ? s : s)}
                          onChange={() => setStyle(s)}
                          className="h-4 w-4 rounded-full border-crystal-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <span>{labelText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Clear filters trigger */}
              <button
                onClick={clearAllFilters}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-crystal-border bg-white/40 py-2.5 text-xs font-bold text-deep-plum hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300"
              >
                <MaterialIcon name="filter_alt_off" className="text-[16px]" />
                <span>Đặt lại bộ lọc</span>
              </button>

            </div>
          </aside>

          {/* 2. Product Listings (Desktop right 3/4, Mobile full) */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* Control Bar: Filter status & Sort option */}
            <div className="glass-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl px-5 py-4 border border-crystal-border bg-pure-ivory/80 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-dusk-gray font-semibold">
                  Hiển thị {products.length} sản phẩm
                </span>
                {category !== "Tất cả" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft-amethyst/30 border border-crystal-border/60 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    Danh mục: {activeCategoryName}
                    <button onClick={() => setCategory("Tất cả")}>
                      <MaterialIcon name="close" className="text-[12px] font-black hover:text-rose-600 transition-colors" />
                    </button>
                  </span>
                )}
                {(priceRange !== "Mức giá: Tất cả" || color !== "Màu sắc: Tất cả" || style !== "Kiểu dáng: Tất cả" || searchTerm !== "") && (
                  <button onClick={clearAllFilters} className="text-[10px] font-extrabold text-primary hover:underline ml-2">
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex lg:hidden items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-extrabold text-pure-ivory shadow-sm hover:bg-primary-dark transition-all duration-200"
                >
                  <MaterialIcon name="filter_list" className="text-[16px]" />
                  <span>Bộ lọc</span>
                </button>

                {/* Sorting Select Option */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70">Sắp xếp</span>
                  <div className="relative group/select select-container">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none rounded-2xl border border-crystal-border bg-white/50 pl-4 pr-9 py-2 text-xs font-bold text-midnight-purple outline-none transition-all duration-300 hover:bg-white cursor-pointer shadow-sm"
                    >
                      <option value="Mới nhất">Mới nhất</option>
                      <option value="Bán chạy">Bán chạy nhất</option>
                      <option value="Giá thấp đến cao">Giá: Thấp đến Cao</option>
                      <option value="Giá cao xuống thấp">Giá: Cao xuống Thấp</option>
                    </select>
                    <MaterialIcon name="expand_more" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-dusk-gray text-[16px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            {loading && products.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 opacity-75"></span>
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-panel rounded-[32px] p-12 text-center border border-crystal-border bg-pure-ivory/60 flex flex-col items-center justify-center">
                <MaterialIcon name="search_off" className="text-4xl text-dusk-gray mb-3" />
                <h3 className="font-home-heading text-base font-bold text-midnight-purple">Không tìm thấy sản phẩm nào</h3>
                <p className="text-xs text-dusk-gray mt-1 max-w-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc nâng cao.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-pure-ivory shadow-md hover:bg-primary-dark transition-all duration-300"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const primaryVariant = product.minifiedVariants?.[0];
                  const priceStr = primaryVariant ? formatVND(primaryVariant.price) : "Liên hệ";
                  const descShort = product.description.length > 60 
                    ? product.description.substring(0, 60) + "..." 
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

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={!pagination.hasPrevPage}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-crystal-border bg-pure-ivory/70 transition-all duration-300 ${
                    !pagination.hasPrevPage 
                      ? "opacity-40 cursor-not-allowed text-dusk-gray" 
                      : "hover:bg-primary hover:text-pure-ivory hover:shadow-md text-midnight-purple"
                  }`}
                >
                  <MaterialIcon name="chevron_left" className="text-[20px]" />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        pageNum === pagination.page
                          ? "bg-primary text-pure-ivory shadow-md border border-transparent"
                          : "border border-crystal-border bg-pure-ivory/70 text-midnight-purple hover:bg-soft-amethyst/30"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setPage(p => Math.min(pagination.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={!pagination.hasNextPage}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-crystal-border bg-pure-ivory/70 transition-all duration-300 ${
                    !pagination.hasNextPage 
                      ? "opacity-40 cursor-not-allowed text-dusk-gray" 
                      : "hover:bg-primary hover:text-pure-ivory hover:shadow-md text-midnight-purple"
                  }`}
                >
                  <MaterialIcon name="chevron_right" className="text-[20px]" />
                </button>
              </div>
            )}

          </main>
        </div>

      </div>

      {/* 3. Mobile Slide-Up Bottom Sheet Drawer */}
      {isMobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-midnight-purple/40 backdrop-blur-xs transition-opacity duration-300 ease-out"
          onClick={() => setIsMobileFilterOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div
        className={`fixed inset-x-0 bottom-0 z-55 max-h-[85vh] overflow-y-auto rounded-t-[32px] border-t border-crystal-border bg-pure-ivory/98 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-350 ease-out lg:hidden ${
          isMobileFilterOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Bottom Sheet Header */}
        <div className="flex items-center justify-between border-b border-crystal-border/80 pb-4 mb-5">
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="tune" className="text-primary text-[20px]" />
            <h3 className="font-home-heading text-base font-extrabold text-midnight-purple">Bộ lọc sản phẩm</h3>
          </div>
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-amethyst/30 text-midnight-purple hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <MaterialIcon name="close" className="text-[18px]" />
          </button>
        </div>

        {/* Bottom Sheet Body */}
        <div className="space-y-6 pb-20">
          
          {/* Mobile Search */}
          <div>
            <h4 className="font-home-heading text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70 mb-2">Tìm kiếm</h4>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full rounded-2xl border border-crystal-border bg-white/40 py-2.5 pl-10 pr-4 text-xs font-semibold text-midnight-purple outline-none focus:bg-white"
              />
              <MaterialIcon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dusk-gray text-[18px]" />
            </div>
          </div>

          {/* Mobile Categories Selector Grid */}
          <div>
            <h4 className="font-home-heading text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70 mb-2">Danh mục ({categories.length + 1})</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
              <button
                onClick={() => setCategory("Tất cả")}
                className={`rounded-2xl px-3 py-2.5 text-xs font-semibold border transition-all text-left truncate flex items-center justify-between ${
                  category === "Tất cả"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white/40 border-crystal-border text-midnight-purple"
                }`}
              >
                <span>Tất cả</span>
                {category === "Tất cả" && <MaterialIcon name="check" className="text-[14px]" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setCategory(cat.slug)}
                  className={`rounded-2xl px-3 py-2.5 text-xs font-semibold border transition-all text-left truncate flex items-center justify-between ${
                    category === cat.slug
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "bg-white/40 border-crystal-border text-midnight-purple"
                  }`}
                >
                  <span className="truncate pr-1">{cat.name}</span>
                  {category === cat.slug && <MaterialIcon name="check" className="text-[14px]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Price */}
          <div>
            <h4 className="font-home-heading text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70 mb-2">Khoảng giá</h4>
            <div className="grid grid-cols-3 gap-2">
              {["Mức giá: Tất cả", "Dưới 500k", "500k - 1tr", "Trên 1tr"].map((range) => {
                const active = priceRange === range;
                const labelText = range === "Mức giá: Tất cả" ? "Tất cả" : range;
                return (
                  <button
                    key={range}
                    onClick={() => setPriceRange(range)}
                    className={`rounded-xl py-2 px-1 text-center text-[10px] font-bold border transition-all truncate ${
                      active
                        ? "bg-primary border-primary text-pure-ivory"
                        : "bg-white/40 border-crystal-border text-midnight-purple"
                    }`}
                  >
                    {labelText}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Colors */}
          <div>
            <h4 className="font-home-heading text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70 mb-2">Tone màu</h4>
            <div className="flex flex-wrap gap-2">
              {["Màu sắc: Tất cả", "Đỏ", "Hồng", "Tím", "Trắng", "Vàng"].map((c) => {
                const active = color === (c === "Màu sắc: Tất cả" ? c : `Tone ${c}`);
                const labelText = c === "Màu sắc: Tất cả" ? "Tất cả" : c;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c === "Màu sắc: Tất cả" ? c : `Tone ${c}`)}
                    className={`rounded-full py-1.5 px-4 text-xs font-bold border transition-all ${
                      active
                        ? "bg-primary border-primary text-pure-ivory"
                        : "bg-white/40 border-crystal-border text-midnight-purple"
                    }`}
                  >
                    {labelText}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Styles */}
          <div>
            <h4 className="font-home-heading text-[11px] font-extrabold uppercase tracking-wider text-deep-plum/70 mb-2">Kiểu dáng</h4>
            <div className="grid grid-cols-2 gap-2">
              {["Kiểu dáng: Tất cả", "Bó", "Giỏ", "Bình", "Hộp"].map((s) => {
                const active = style === s;
                const labelText = s === "Kiểu dáng: Tất cả" ? "Tất cả" : s === "Bó" ? "Bó hoa" : s === "Giỏ" ? "Giỏ / Lẵng" : s === "Bình" ? "Bình hoa" : "Hộp hoa";
                return (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-xl py-2 px-3 text-center text-xs font-bold border transition-all truncate ${
                      active
                        ? "bg-primary border-primary text-pure-ivory"
                        : "bg-white/40 border-crystal-border text-midnight-purple"
                    }`}
                  >
                    {labelText}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Mobile Sticky Footer inside sheet */}
        <div className="absolute bottom-0 inset-x-0 bg-pure-ivory/95 p-4 border-t border-crystal-border/80 flex items-center gap-3 backdrop-blur-md">
          <button
            onClick={() => {
              clearAllFilters();
              setIsMobileFilterOpen(false);
            }}
            className="flex-1 rounded-full border border-crystal-border py-3 text-xs font-bold text-deep-plum hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            Đặt lại
          </button>
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="flex-[2] rounded-full bg-primary py-3 text-xs font-extrabold text-pure-ivory shadow-md hover:bg-primary-dark transition-all"
          >
            Áp dụng bộ lọc
          </button>
        </div>

      </div>

    </div>
  );
}
