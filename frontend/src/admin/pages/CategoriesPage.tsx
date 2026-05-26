import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm, CrudModal, FormField, FormInput } from "../components/AdminUI";
import { AdminPagination } from "../components/AdminPagination";
import { StatCardWidget } from "../components/StatCard";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategory,
  deleteAdminCategory,
  slugifyCategoryName,
  type AdminCategoryRow,
} from "../services/adminCategories.api";
import { uploadAdminImage, resolveAssetUrl } from "../services/adminUpload.api";

export function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
    activeCount: 0,
    inactiveCount: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<AdminCategoryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { confirm, ModalEl } = useConfirm();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminCategories({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        isActive:
          statusFilter === "all"
            ? undefined
            : statusFilter === "active",
      });
      setCategories(result.items);
      setMeta(result.meta);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Không thể tải danh sách danh mục.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadCategories(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadCategories]);

  const statCards = [
    {
      id: "cat-total",
      label: "Tổng danh mục",
      value: meta.total,
      change: 0,
      changeLabel: "tổng số",
      icon: "products",
      color: "indigo" as const,
      tooltip: "Tổng số danh mục trong hệ thống",
      sparklinePoints: "M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    },
    {
      id: "cat-active",
      label: "Đang hiển thị",
      value: meta.activeCount,
      change: 0,
      changeLabel: "đang bật",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: "emerald" as const,
      tooltip: "Danh mục đang hiển thị trên cửa hàng",
      sparklinePoints: "M2 28L12 20L22 26L32 16L44 22L56 12L68 18L76 8",
    },
    {
      id: "cat-inactive",
      label: "Đang ẩn",
      value: meta.inactiveCount,
      change: 0,
      changeLabel: "đang tắt",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Danh mục đã ẩn khỏi cửa hàng",
      sparklinePoints: "M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16",
    },
    {
      id: "cat-products",
      label: "Tổng sản phẩm",
      value: meta.totalProducts,
      change: 0,
      changeLabel: "trong catalog",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
      color: "purple" as const,
      tooltip: "Tổng số sản phẩm thuộc các danh mục",
      sparklinePoints: "M2 22L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    },
  ];

  function openCreate() {
    setEditCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormImageUrl("");
    setSlugTouched(false);
    setSlideoverOpen(true);
  }

  function openEdit(category: AdminCategoryRow) {
    setEditCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description);
    setFormImageUrl(category.imageUrl);
    setSlugTouched(true);
    setSlideoverOpen(true);
  }

  async function handleImageSelect(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadAdminImage(file);
      setFormImageUrl(result.url);
    } catch (err) {
      console.error("Failed to upload category image:", err);
      setError("Không thể tải ảnh danh mục lên.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || slugifyCategoryName(formName),
        description: formDescription.trim(),
        imageUrl: formImageUrl,
      };
      if (editCategory) {
        await updateAdminCategory(editCategory.id, payload);
      } else {
        await createAdminCategory(payload);
      }
      setSlideoverOpen(false);
      setEditCategory(null);
      await loadCategories();
    } catch (err) {
      console.error("Failed to save category:", err);
      setError("Không thể lưu danh mục. Kiểm tra lại thông tin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(category: AdminCategoryRow) {
    try {
      await toggleAdminCategory(category.id, !category.isActive);
      await loadCategories();
    } catch (err) {
      console.error("Failed to toggle category:", err);
      setError("Không thể cập nhật trạng thái danh mục.");
    }
  }

  async function handleDelete(category: AdminCategoryRow) {
    if (category.productCount > 0) return;
    const ok = await confirm({
      title: "Xóa danh mục",
      message: `Xóa vĩnh viễn danh mục "${category.name}"? Hành động này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa",
    });
    if (!ok) return;
    try {
      await deleteAdminCategory(category.id);
      await loadCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
      setError("Không thể xóa danh mục. Danh mục có thể đang chứa sản phẩm.");
    }
  }

  return (
    <div className="admin-page">
      {ModalEl}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Danh mục</h2>
          <p className="admin-page-subtitle">Quản lý danh mục sản phẩm trên cửa hàng</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Thêm danh mục
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>{error}</div>
      )}

      <div className="admin-stat-grid" style={{ marginBottom: "24px" }}>
        {statCards.map((card) => (
          <StatCardWidget key={card.id} card={card} />
        ))}
      </div>

      <div className="admin-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Tìm theo tên hoặc slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "10px 14px",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13.5px",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setCurrentPage(1);
            }}
            style={{
              padding: "10px 14px",
              background: "rgba(13, 21, 38, 0.4)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13.5px",
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đang ẩn</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>Đang tải...</p>
        ) : categories.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}>Không có danh mục nào.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th>Slug</th>
                  <th>Sản phẩm</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {category.imageUrl ? (
                            <img
                              src={resolveAssetUrl(category.imageUrl)}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "12px" }}>—</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{category.name}</div>
                          {category.description && (
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                              {category.description.slice(0, 60)}
                              {category.description.length > 60 ? "..." : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", color: "#cbd5e1" }}>{category.slug}</code>
                    </td>
                    <td>{category.productCount}</td>
                    <td>
                      <span
                        className="admin-category-tag"
                        style={{
                          background: category.isActive
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: category.isActive ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {category.isActive ? "Hiển thị" : "Ẩn"}
                      </span>
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button className="admin-btn admin-btn-ghost" onClick={() => openEdit(category)}>
                          Sửa
                        </button>
                        <button className="admin-btn admin-btn-ghost" onClick={() => handleToggle(category)}>
                          {category.isActive ? "Ẩn" : "Hiện"}
                        </button>
                        <button
                          className="admin-btn admin-btn-ghost"
                          disabled={category.productCount > 0}
                          title={
                            category.productCount > 0
                              ? "Không thể xóa danh mục đang có sản phẩm"
                              : "Xóa danh mục"
                          }
                          onClick={() => handleDelete(category)}
                          style={{
                            color: category.productCount > 0 ? "#64748b" : "#f87171",
                            cursor: category.productCount > 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          Xóa
                        </button>
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
          totalPages={meta.pages}
          totalCount={meta.total}
          onPageChange={setCurrentPage}
          loading={loading}
          itemLabel="danh mục"
        />
      </div>

      <CrudModal
        isOpen={slideoverOpen}
        mode={editCategory ? "edit" : "create"}
        title={editCategory ? "Sửa danh mục" : "Thêm danh mục"}
        onClose={() => {
          setSlideoverOpen(false);
          setEditCategory(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editCategory ? "Cập nhật" : "Tạo danh mục"}
        size="lg"
      >
          <FormField label="Tên danh mục" required>
            <FormInput
              value={formName}
              onChange={(e) => {
                const value = e.target.value;
                setFormName(value);
                if (!slugTouched) {
                  setFormSlug(slugifyCategoryName(value));
                }
              }}
              required
            />
          </FormField>

          <FormField label="Slug" required>
            <FormInput
              value={formSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setFormSlug(e.target.value);
              }}
              required
            />
          </FormField>

          <FormField label="Mô tả">
            <FormInput
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Ảnh danh mục">
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
              {formImageUrl && (
                <img
                  src={resolveAssetUrl(formImageUrl)}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
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
                {uploadingImage ? "Đang tải..." : formImageUrl ? "Đổi ảnh" : "Tải ảnh lên"}
              </button>
            </div>
          </FormField>
      </CrudModal>
    </div>
  );
}
