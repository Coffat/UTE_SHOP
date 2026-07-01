import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchCategories } from "@/features/catalog/categoriesSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Categories() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: categories, loading, error } = useSelector(
    (state: RootState) => state.categories
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pure-ivory via-lavender-mist/10 to-pure-ivory pt-24 pb-16 md:pt-32">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1440px] px-2 md:px-6">
        
        {/* Header Section */}
        <section className="text-center max-w-2xl mx-auto mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-slogan text-3xl text-primary block mb-2"
          >
            Bộ sưu tập UTE_SHOP
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-section-title text-[44px] leading-tight text-deep-plum mb-4 md:text-[52px]"
          >
            Danh Mục <span className="text-primary italic font-serif font-normal">Nghệ Thuật</span> Hoa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-dusk-gray text-base leading-relaxed"
          >
            Khám phá thế giới hoa tươi đầy hương sắc, được chăm chút kỹ lưỡng bởi đội ngũ Florist chuyên nghiệp. Từ những đóa hoa chúc mừng hồng phát đến những combo hoa gấu ấm áp hay bình hoa nghệ thuật kiêu sa.
          </motion.p>
        </section>

        {/* Categories Section */}
        {loading && categories.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 opacity-75"></span>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        ) : error && categories.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-[32px] p-12 text-center border border-rose-200 bg-rose-50/10">
            <MaterialIcon name="error_outline" className="text-4xl text-rose-500 mb-3" />
            <h3 className="font-home-heading text-lg font-bold text-midnight-purple">Đã xảy ra lỗi tải danh mục</h3>
            <p className="text-xs text-dusk-gray mt-1 max-w-md">{error}</p>
            <button
              onClick={() => dispatch(fetchCategories())}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-bold text-pure-ivory shadow-md hover:bg-primary-dark transition-colors duration-300"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {categories.map((cat, index) => {
              const cardElement = (
                <Link
                  to={`/category/${cat.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-[24px] border border-crystal-border bg-pure-ivory/80 shadow-sm hover-lift hover:border-primary/25 z-10 h-full"
                >
                  {/* Image Container with Zoom effect */}
                  <div className="aspect-[4/3] w-full overflow-hidden border-b border-crystal-border/80 bg-lavender-mist relative">
                    <img
                      src={cat.imageUrl || "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600"}
                      alt={cat.name}
                      className="h-full w-full object-cover image-hover-zoom"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Category Card Floating Arrow Icon */}
                    <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 scale-90 rounded-full bg-pure-ivory/95 p-2 text-primary shadow-lg backdrop-blur-md transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100">
                      <MaterialIcon name="arrow_forward" className="text-[18px]" />
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-home-heading text-lg font-bold text-midnight-purple group-hover:text-primary transition-colors duration-200">
                      {cat.name}
                    </h3>
                    <p className="mt-2 flex-1 font-home-heading text-xs leading-relaxed text-dusk-gray group-hover:text-midnight-purple/80 transition-colors duration-200 line-clamp-3">
                      {cat.description || "Khám phá các sản phẩm hoa tươi được lựa chọn kỹ lượng, phù hợp cho mọi sự kiện."}
                    </p>
                    
                    {/* Footer link trigger visual decoration */}
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-primary group-hover:text-primary-dark transition-colors duration-200">
                      <span>Xem bộ sưu tập</span>
                      <MaterialIcon name="keyboard_arrow_right" className="text-[16px] transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );

              if (index < 12) {
                return (
                  <motion.div key={cat._id} variants={itemVariants}>
                    {cardElement}
                  </motion.div>
                );
              }

              return (
                <div key={cat._id}>
                  {cardElement}
                </div>
              );
            })}
          </motion.div>
        )}
        
      </div>
    </div>
  );
}
