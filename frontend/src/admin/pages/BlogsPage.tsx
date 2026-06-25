import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
  fetchStaffBlogFilters,
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
  const [blogFilters, setBlogFilters] = useState<{ categories: string[]; tags: string[] }>({ categories: [], tags: [] });

  // Cropper states
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 100, height: 56.25, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    fetchStaffBlogFilters().then(setBlogFilters).catch(console.error);
  }, []);

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
    setCropSrc("");
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
    setCropSrc("");
    setSlideoverOpen(true);
  }

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop({ unit: "%", width: 100, height: 56.25, x: 0, y: 0 }); // 16:9 ratio default
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setCropSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  async function handleCropUpload() {
    if (!completedCrop || !cropImgRef.current) return;
    setUploadingImage(true);
    
    const canvas = document.createElement("canvas");
    const scaleX = cropImgRef.current.naturalWidth / cropImgRef.current.width;
    const scaleY = cropImgRef.current.naturalHeight / cropImgRef.current.height;
    
    // Pixel ratio for higher quality crop
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      cropImgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setUploadingImage(false);
        return;
      }
      const file = new File([blob], "cropped-cover.jpg", { type: "image/jpeg" });
      try {
        const result = await uploadAdminImage(file);
        setFormCoverImage(result.url);
        setCropSrc(""); // Reset cropper
      } catch (err) {
        console.error(err);
        setError("Không thể tải ảnh bìa lên.");
      } finally {
        setUploadingImage(false);
      }
    }, "image/jpeg", 0.95);
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

      <div className="admin-card" style={{ padding: "20px", flex: 1 }}>
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
        size="xxl"
      >
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          {/* LEFT: FORM */}
          <div className="admin-form-group" style={{ flex: 1, minWidth: 0, maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
            <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
            </div>

            <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <FormField label="Danh mục" required>
                <FormInput
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ví dụ: Hướng dẫn, Đánh giá, Tin công nghệ"
                  required
                />
                {blogFilters.categories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {blogFilters.categories.map(c => (
                      <span 
                        key={c}
                        onClick={() => setFormCategory(c)}
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: formCategory === c ? 'var(--adm-primary)' : 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: formCategory === c ? '#fff' : '#a5b4fc',
                          transition: 'all 0.2s'
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </FormField>
              
              <FormField label="Từ khóa (thẻ tags)">
                <FormInput
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                  placeholder="Ngăn cách bằng dấu phẩy, ví dụ: sale, shoe, review"
                />
                {blogFilters.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {blogFilters.tags.map(t => (
                      <span 
                        key={t}
                        onClick={() => {
                          const currentTags = formTagsString.split(',').map(s => s.trim()).filter(Boolean);
                          if (!currentTags.includes(t)) {
                            setFormTagsString(currentTags.length > 0 ? `${currentTags.join(', ')}, ${t}` : t);
                          }
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: formTagsString.split(',').map(s=>s.trim()).includes(t) ? 'var(--adm-primary)' : 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: formTagsString.split(',').map(s=>s.trim()).includes(t) ? '#fff' : '#a5b4fc',
                          transition: 'all 0.2s'
                        }}
                      >
                        +{t}
                      </span>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

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
              {cropSrc ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(13, 21, 38, 0.4)", padding: "16px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={16 / 9}
                  >
                    <img ref={cropImgRef} src={cropSrc} alt="Crop" style={{ maxHeight: "300px", width: "auto" }} />
                  </ReactCrop>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCropSrc("")}>
                      Hủy
                    </button>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={handleCropUpload} disabled={uploadingImage}>
                      {uploadingImage ? "Đang tải..." : "Cắt & Upload"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      onSelectFile(e);
                      e.target.value = "";
                    }}
                  />
                  <div 
                    className="admin-image-upload-zone" 
                    onClick={() => { if (!uploadingImage) imageInputRef.current?.click(); }}
                    style={{
                      height: "160px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: uploadingImage ? "wait" : "pointer",
                      ...(formCoverImage ? { padding: 0 } : {})
                    }}
                  >
                    {uploadingImage ? (
                      <span style={{ color: "#94a3b8" }}>Đang tải...</span>
                    ) : formCoverImage ? (
                      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "8px", overflow: "hidden" }}>
                        <img
                          src={resolveAssetUrl(formCoverImage)}
                          alt="Cover"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div 
                          style={{ 
                            position: "absolute", inset: 0, 
                            background: "rgba(0,0,0,0.4)", 
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                        >
                          <span style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>Thay đổi ảnh</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon" style={{ marginBottom: "12px", color: "#64748b" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500 }}>Nhấn để tải ảnh lên</span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Hỗ trợ JPG, PNG, WEBP</span>
                      </>
                    )}
                  </div>
                </>
              )}
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
          </div>

          {/* RIGHT: PREVIEW */}
          <div style={{ flex: 1, minWidth: 0, background: "#fff", borderRadius: "8px", padding: "24px", color: "#333", maxHeight: "70vh", overflowY: "auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "16px", color: "#111" }}>
              Xem trước bài viết
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", lineHeight: 1.3, margin: 0, color: "#111" }}>
                {formTitle || "Tiêu đề bài viết..."}
              </h1>
              
              <div style={{ display: "flex", gap: "8px", color: "#666", fontSize: "13px" }}>
                {formCategory && <span style={{ color: "#3b82f6", fontWeight: 500 }}>{formCategory}</span>}
                <span>•</span>
                <span>{new Date().toLocaleDateString("vi-VN")}</span>
              </div>
              
              {formCoverImage && (
                <div style={{ width: "100%", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9", background: "#f3f4f6" }}>
                  <img src={resolveAssetUrl(formCoverImage)} alt="Preview cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              
              {formExcerpt && (
                <p style={{ fontSize: "15px", color: "#444", fontStyle: "italic", lineHeight: 1.5, margin: 0, borderLeft: "3px solid #3b82f6", paddingLeft: "12px" }}>
                  {formExcerpt}
                </p>
              )}
              
              <div style={{ fontSize: "15px", color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {formContent || "Nội dung chi tiết bài viết sẽ hiển thị ở đây..."}
              </div>
              
              {formTagsString && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                  {formTagsString.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: "100px", fontSize: "12px", color: "#555" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CrudModal>
    </div>
  );
}
