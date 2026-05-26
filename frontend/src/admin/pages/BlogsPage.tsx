import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm, CrudModal, FormField, FormInput } from "../components/AdminUI";
import { AdminPagination } from "../components/AdminPagination";
import {
  fetchAdminBlogs,
  createAdminBlog,
  updateAdminBlog,
  deleteAdminBlog,
  type BlogPost,
} from "../services/adminBlogs.api";
import {
  fetchStaffBlogs,
  createStaffBlog,
  updateStaffBlog,
} from "../services/staffBlogs.api";
import { uploadAdminImage, resolveAssetUrl } from "../services/adminUpload.api";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogsPage() {
  const { user } = useAdminAuth();
  const isAdmin = user?.role === "ADMIN";

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");

  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTagsString, setFormTagsString] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const { confirm, ModalEl } = useConfirm();

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
      };
      const result = isAdmin
        ? await fetchAdminBlogs(params)
        : await fetchStaffBlogs(params);

      setBlogs(result.items);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      setError("Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => loadBlogs(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadBlogs]);

  function openCreate() {
    setEditBlog(null);
    setFormTitle("");
    setFormSlug("");
    setFormExcerpt("");
    setFormContent("");
    setFormCoverImage("");
    setFormCategory("");
    setFormTagsString("");
    setFormIsPublished(true);
    setSlugTouched(false);
    setSlideoverOpen(true);
  }

  function openEdit(blog: BlogPost) {
    setEditBlog(blog);
    setFormTitle(blog.title);
    setFormSlug(blog.slug);
    setFormExcerpt(blog.excerpt);
    setFormContent(blog.content);
    setFormCoverImage(blog.coverImage);
    setFormCategory(blog.category);
    setFormTagsString((blog.tags || []).join(", "));
    setFormIsPublished(blog.isPublished);
    setSlugTouched(true);
    setSlideoverOpen(true);
  }

  async function handleImageSelect(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadAdminImage(file);
      setFormCoverImage(result.url);
    } catch (err) {
      console.error("Failed to upload cover image:", err);
      setError("Không thể tải ảnh bìa lên.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tags = formTagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formTitle.trim(),
        slug: formSlug.trim() || slugify(formTitle),
        excerpt: formExcerpt.trim(),
        content: formContent.trim(),
        coverImage: formCoverImage,
        category: formCategory.trim(),
        tags,
        isPublished: formIsPublished,
      };

      if (editBlog) {
        if (isAdmin) {
          await updateAdminBlog(editBlog._id, payload);
        } else {
          await updateStaffBlog(editBlog._id, payload);
        }
      } else {
        if (isAdmin) {
          await createAdminBlog(payload);
        } else {
          await createStaffBlog(payload);
        }
      }
      setSlideoverOpen(false);
      setEditBlog(null);
      await loadBlogs();
    } catch (err) {
      console.error("Failed to save blog:", err);
      setError("Không thể lưu bài viết. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(blog: BlogPost) {
    if (!isAdmin) return;
    const ok = await confirm({
      title: "Xóa bài viết",
      message: `Bạn có chắc muốn xóa vĩnh viễn bài viết "${blog.title}"?`,
      variant: "danger",
      confirmLabel: "Xóa",
    });
    if (!ok) return;
    try {
      await deleteAdminBlog(blog._id);
      await loadBlogs();
    } catch (err) {
      console.error("Failed to delete blog:", err);
      setError("Không thể xóa bài viết.");
    }
  }

  return (
    <div className="admin-page">
      {ModalEl}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tin tức & Blog</h2>
          <p className="admin-page-subtitle">Quản lý bài viết tin tức, hướng dẫn trên cửa hàng</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Viết bài mới
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>{error}</div>
      )}

      <div className="admin-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input
            type="search"
            placeholder="Tìm theo tiêu đề hoặc danh mục..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13.5px",
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>Đang tải...</p>
        ) : blogs.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}>Không có bài viết nào.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Bài viết</th>
                  <th>Danh mục</th>
                  <th>Lượt xem</th>
                  <th>Trạng thái</th>
                  <th>Tác giả</th>
                  <th>Ngày đăng</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: 56,
                            height: 38,
                            borderRadius: "4px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            flexShrink: 0,
                          }}
                        >
                          {blog.coverImage ? (
                            <img
                              src={resolveAssetUrl(blog.coverImage)}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "10px" }}>No img</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{blog.title}</div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                            {blog.excerpt.slice(0, 80)}
                            {blog.excerpt.length > 80 ? "..." : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "rgba(255,255,255,0.06)",
                          color: "#cbd5e1",
                        }}
                      >
                        {blog.category}
                      </span>
                    </td>
                    <td>{blog.views}</td>
                    <td>
                      <span
                        className="admin-category-tag"
                        style={{
                          background: blog.isPublished
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: blog.isPublished ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {blog.isPublished ? "Đã đăng" : "Bản nháp"}
                      </span>
                    </td>
                    <td>{blog.author?.fullName || "Chưa rõ"}</td>
                    <td>
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button className="admin-btn admin-btn-ghost" onClick={() => openEdit(blog)}>
                          Sửa
                        </button>
                        {isAdmin && (
                          <button
                            className="admin-btn admin-btn-ghost"
                            onClick={() => handleDelete(blog)}
                            style={{ color: "#f87171" }}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalItems}
          onPageChange={setCurrentPage}
          loading={loading}
          itemLabel="bài viết"
        />
      </div>

      <CrudModal
        isOpen={slideoverOpen}
        mode={editBlog ? "edit" : "create"}
        title={editBlog ? "Sửa bài viết" : "Viết bài mới"}
        onClose={() => {
          setSlideoverOpen(false);
          setEditBlog(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editBlog ? "Cập nhật" : "Tạo bài viết"}
        size="lg"
      >
        <FormField label="Tiêu đề bài viết" required>
          <FormInput
            value={formTitle}
            onChange={(e) => {
              const val = e.target.value;
              setFormTitle(val);
              if (!slugTouched) {
                setFormSlug(slugify(val));
              }
            }}
            required
          />
        </FormField>

        <FormField label="Slug đường dẫn" required>
          <FormInput
            value={formSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setFormSlug(e.target.value);
            }}
            required
          />
        </FormField>

        <FormField label="Danh mục" required>
          <FormInput
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder="Ví dụ: Hướng dẫn, Đánh giá, Tin công nghệ"
            required
          />
        </FormField>

        <FormField label="Tóm tắt bài viết" required>
          <textarea
            value={formExcerpt}
            onChange={(e) => setFormExcerpt(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13.5px",
            }}
            placeholder="Mô tả ngắn hiển thị trên danh sách tin tức..."
            required
          />
        </FormField>

        <FormField label="Nội dung chi tiết" required>
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13.5px",
              fontFamily: "monospace",
            }}
            placeholder="Nội dung chi tiết (hỗ trợ văn bản thường)..."
            required
          />
        </FormField>

        <FormField label="Ảnh đại diện bài viết">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              void handleImageSelect(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {formCoverImage && (
              <img
                src={resolveAssetUrl(formCoverImage)}
                alt=""
                style={{
                  width: 80,
                  height: 48,
                  borderRadius: 6,
                  objectFit: "cover",
                  border: "1px solid var(--adm-border)",
                }}
              />
            )}
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? "Đang tải..." : formCoverImage ? "Đổi ảnh" : "Tải ảnh lên"}
            </button>
          </div>
        </FormField>

        <FormField label="Từ khóa (thẻ tags)">
          <FormInput
            value={formTagsString}
            onChange={(e) => setFormTagsString(e.target.value)}
            placeholder="Ngăn cách bằng dấu phẩy, ví dụ: sale, shoe, review"
          />
        </FormField>

        <FormField label="Chế độ hiển thị">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
            <input
              type="checkbox"
              checked={formIsPublished}
              onChange={(e) => setFormIsPublished(e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            Xuất bản ngay lập tức
          </label>
        </FormField>
      </CrudModal>
    </div>
  );
}
