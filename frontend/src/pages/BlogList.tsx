import { useEffect, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContext";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  views: number;
  publishedAt: string;
  author: {
    fullName: string;
    email: string;
  };
}

const CATEGORIES = ["Tất cả", "Cẩm nang hoa", "Ý nghĩa hoa", "Sự kiện & Lễ hội", "Phong cách sống"];

export function BlogList() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, startTransition] = useTransition();

  // Search input debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery);
      });
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCategory !== "Tất cả") {
          params.category = selectedCategory;
        }
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        const { data } = await api.get("/api/v1/blogs", { params });
        if (data.success) {
          setPosts(data.data.items || []);
        } else {
          showToast(data.message || "Không tải được danh sách bài viết", "error");
        }
      } catch (err: any) {
        console.error(err);
        showToast("Lỗi kết nối máy chủ khi tải bài viết.", "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogs();
  }, [selectedCategory, debouncedSearch, showToast]);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile pt-28 pb-16 md:max-w-[1600px] md:px-margin-desktop md:pt-32 lg:pt-36 2xl:max-w-[1760px]">
      
      {/* 1. Header Section */}
      <section className="text-center max-w-2xl mx-auto mb-12">
        <motion.span 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-slogan text-3xl text-primary block mb-2"
        >
          Cẩm nang & Phong cách sống
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-section-title text-[44px] leading-tight text-deep-plum mb-4 md:text-[52px]"
        >
          UTE SHOP Insights
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-sans text-dusk-gray text-base leading-relaxed"
        >
          Nơi sẻ chia nghệ thuật cắm hoa nghệ thuật, thông điệp ẩn giấu sau từng đóa hoa rực rỡ và những xu hướng cắm hoa tinh tế nhất.
        </motion.p>
      </section>

      {/* 2. Control Bar (Filters + Search) */}
      <section className="glass-panel rounded-[24px] p-4 mb-10 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none shrink-0">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`relative rounded-full px-4 py-1.5 text-xs font-bold font-home-heading transition-all duration-300 ${
                  active 
                    ? "text-pure-ivory" 
                    : "text-midnight-purple hover:bg-soft-amethyst/30"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-primary rounded-full z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative flex items-center rounded-full border border-crystal-border bg-pure-ivory/60 px-4 py-2 w-full md:max-w-[320px] transition-focus-within focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
          <MaterialIcon name="search" className="text-dusk-gray mr-2 text-[20px]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            className="w-full bg-transparent text-sm text-midnight-purple placeholder:text-dusk-gray focus:outline-none"
            aria-label="Tìm kiếm bài viết"
          />
        </div>
      </section>

      {/* 3. Cards Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-24"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-crystal-border border-t-primary" />
              <p className="text-sm font-semibold text-dusk-gray font-home-heading">Đang kết nối thư viện hoa...</p>
            </div>
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-[32px] text-center py-16 px-6"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-soft-amethyst/30 text-primary mb-4">
              <MaterialIcon name="menu_book" className="text-[28px]" />
            </div>
            <h3 className="font-home-heading text-lg font-bold text-deep-plum mb-1">Chưa có bài viết nào</h3>
            <p className="text-sm text-dusk-gray max-w-sm mx-auto">
              Không tìm thấy kết quả phù hợp cho "{searchQuery}" trong danh mục {selectedCategory}. Hãy thử từ khóa khác!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {posts.map((post) => (
              <motion.article
                key={post._id}
                variants={{
                  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
                  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 200, damping: 20 } }
                }}
                className="glass-panel group overflow-hidden rounded-[24px] shadow-[0_10px_40px_rgba(74,59,82,0.02)] transition-all hover:-translate-y-1.5 hover:shadow-[0_15px_45px_rgba(123,65,180,0.06)] flex flex-col h-full"
              >
                {/* Cover image wrapper */}
                <Link to={`/blogs/${post.slug}`} className="relative block h-52 overflow-hidden bg-lavender-mist shrink-0">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category pill */}
                  <span className="absolute top-4 left-4 bg-pure-ivory/90 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 rounded-full border border-crystal-border shadow-sm">
                    {post.category}
                  </span>
                </Link>

                {/* Content section */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Excerpt */}
                  <h3 className="font-home-heading text-lg font-bold text-midnight-purple group-hover:text-primary transition-colors duration-250 mb-2.5 leading-snug">
                    <Link to={`/blogs/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-sm text-dusk-gray line-clamp-3 mb-5 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  {/* Metadata bottom row */}
                  <div className="flex items-center justify-between border-t border-crystal-border/80 pt-4 text-xs font-semibold text-dusk-gray font-home-heading mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-soft-amethyst/40 flex items-center justify-center text-primary border border-crystal-border">
                        <MaterialIcon name="person" className="text-xs" />
                      </div>
                      <span>{post.author?.fullName || "UTE SHOP"}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <MaterialIcon name="calendar_today" className="text-[13px]" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MaterialIcon name="visibility" className="text-[13px]" />
                        <span>{post.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
