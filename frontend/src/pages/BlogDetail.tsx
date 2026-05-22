import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContext";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
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

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/api/v1/blogs/${slug}`);
        if (data.success && data.data) {
          setPost(data.data);
          
          // Fetch related articles from same category
          const category = data.data.category;
          const { data: listData } = await api.get("/api/v1/blogs", {
            params: { category, limit: 4 }
          });
          if (listData.success) {
            const filtered = (listData.data.items || []).filter(
              (p: BlogPost) => p._id !== data.data._id
            );
            setRelatedPosts(filtered.slice(0, 3));
          }
        } else {
          showToast(data.message || "Không tải được bài viết.", "error");
          navigate("/blogs", { replace: true });
        }
      } catch (err: unknown) {
        console.error(err);
        showToast("Lỗi kết nối khi tải bài viết.", "error");
        navigate("/blogs", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogPost();
  }, [slug, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-48">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-crystal-border border-t-primary" />
          <p className="text-sm font-semibold text-dusk-gray font-home-heading">Đang lật mở trang cẩm nang...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-28 pb-16 md:px-6 md:pt-32 lg:pt-36">
      
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition font-home-heading group"
        >
          <MaterialIcon
            name="arrow_back"
            className="text-[18px] transition-transform group-hover:-translate-x-1"
          />
          Quay lại danh sách blog
        </Link>
      </motion.div>

      {/* Main Article Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel overflow-hidden rounded-[32px] shadow-[0_12px_45px_rgba(74,59,82,0.03)] border border-crystal-border"
      >
        {/* Cover image banner */}
        <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden bg-lavender-mist">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          
          {/* Cover Floating Pill */}
          <span className="absolute bottom-6 left-6 bg-primary text-pure-ivory text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-primary/20 shadow-md">
            {post.category}
          </span>
        </div>

        {/* Article text and meta */}
        <div className="px-6 py-8 md:px-10 md:py-12">
          <header className="mb-8 border-b border-crystal-border/80 pb-6">
            <h1 className="font-section-title text-[32px] md:text-[44px] leading-tight text-deep-plum mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-dusk-gray font-home-heading">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-soft-amethyst/50 flex items-center justify-center text-primary border border-crystal-border">
                  <MaterialIcon name="person" className="text-sm" />
                </div>
                <span className="text-midnight-purple font-bold">
                  {post.author?.fullName || "UTE SHOP Staff"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MaterialIcon name="calendar_today" className="text-[14px]" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MaterialIcon name="visibility" className="text-[14px]" />
                <span>{post.views} lượt xem</span>
              </div>
            </div>
          </header>

          {/* Render Rich Body */}
          <div
            className="prose prose-purple max-w-none font-sans text-[16px] md:text-[17px] text-midnight-purple/90 leading-relaxed space-y-6 
              prose-headings:font-home-heading prose-headings:font-bold prose-headings:text-deep-plum prose-headings:mt-8 prose-headings:mb-3
              prose-h3:text-lg md:prose-h3:text-xl prose-p:mb-4 prose-strong:text-deep-plum"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags Footer */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-crystal-border/80 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-dusk-gray font-home-heading uppercase mr-2">Thẻ tags:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-soft-amethyst/30 border border-crystal-border text-primary text-[11px] font-bold px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.article>

      {/* 4. Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-section-title text-[28px] text-deep-plum mb-6 text-center md:text-[34px]">
            Bài viết liên quan
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((rPost) => (
              <article
                key={rPost._id}
                className="glass-panel overflow-hidden rounded-[20px] shadow-[0_6px_24px_rgba(74,59,82,0.02)] border border-crystal-border hover-lift flex flex-col h-full group"
              >
                <Link to={`/blogs/${rPost.slug}`} className="block h-36 overflow-hidden bg-lavender-mist shrink-0">
                  <img
                    src={rPost.coverImage}
                    alt={rPost.title}
                    className="h-full w-full object-cover image-hover-zoom"
                  />
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                    {rPost.category}
                  </span>
                  <h4 className="font-home-heading text-sm font-bold text-midnight-purple line-clamp-2 leading-snug hover:text-primary transition flex-1">
                    <Link to={`/blogs/${rPost.slug}`}>
                      {rPost.title}
                    </Link>
                  </h4>
                  <div className="text-[11px] text-dusk-gray font-semibold font-home-heading mt-3 border-t border-crystal-border/80 pt-2.5 flex items-center justify-between">
                    <span>{formatDate(rPost.publishedAt)}</span>
                    <span className="flex items-center gap-0.5 text-primary group-hover:underline">
                      Đọc thêm <MaterialIcon name="arrow_forward" className="text-xs" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
