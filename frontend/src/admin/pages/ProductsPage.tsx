import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm, CrudModal, FormField, FormInput, FormSelect, FormTextarea } from "../components/AdminUI";
import { StatCardWidget } from "../components/StatCard";
import {
  fetchManagedProducts,
  fetchProductManagementSummary,
  fetchCategories,
  createAdminProduct,
  updateAdminProduct,
  discontinueAdminProduct,
  buildCreatePayloadFromForm,
  buildUpdatePayloadFromForm,
  uploadProductImage,
  type ProductSummary,
  type CategoryOption,
} from "../services/productManagement.api";
import type { AdminProductRow } from "../services/mappers/product.mapper";

function ProductThumbnail({
  imageUrl,
  iconType,
  size = 42,
}: {
  imageUrl?: string;
  iconType: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(imageUrl?.trim()) && !imgError;

  return (
    <div
      className="admin-product-thumb"
      style={{
        width: size,
        height: size,
        borderRadius: size <= 36 ? "6px" : "8px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgError(true)}
        />
      ) : (
        getProductIcon(iconType)
      )}
    </div>
  );
}

function getProductIcon(iconType: string) {
  switch (iconType) {
    case "headphones":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      );
    case "sneaker":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v-2.5C4 12 5.5 10 7.5 10H14l3 3.5 3-.5v4H4z" />
          <path d="M14 10l-2-4H7L5 10" />
          <path d="M4 17h16" />
        </svg>
      );
    case "backpack":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M9 9V5a3 3 0 0 1 6 0v4" />
          <path d="M8 9h8" />
          <path d="M12 13v3" />
        </svg>
      );
    case "hoodie":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.37 11.13L21 17h-4v4H7v-4H3l.63-5.87A3 3 0 0 1 6.6 8.5h10.8a3 3 0 0 1 2.97 2.63z" />
          <path d="M9 3h6v3.5l-3 1.5-3-1.5z" />
          <path d="M12 8.5V13" />
        </svg>
      );
    case "keyboard":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4" />
        </svg>
      );
    case "mouse":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="7" />
          <path d="M12 2v10" />
          <path d="M5 12h14" />
        </svg>
      );
    case "earbuds":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v3c0 1.7-1.3 3-3 3h-2c-1.7 0-3-1.3-3-3v-2H9v2c0 1.7-1.3 3-3 3H4c-1.7 0-3-1.3-3-3v-3z" />
          <circle cx="7" cy="14" r="1.5" />
          <circle cx="17" cy="14" r="1.5" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
  }
}

function getProductStatusStyle(stock: number, status: string) {
  if (status === "inactive" || stock === 0) {
    return { background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", border: "1px solid rgba(255, 255, 255, 0.08)" };
  }
  if (stock > 0 && stock <= 50) {
    return { background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)" };
  }
  return { background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" };
}

function getProductStatusLabel(stock: number, status: string) {
  if (status === "inactive" || stock === 0) {
    return "Ẩn";
  }
  if (stock > 0 && stock <= 50) {
    return "Sắp hết";
  }
  return "Đang bán";
}

export function ProductsPage() {
  const navigate = useNavigate();
  const { role, isAdmin } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProductRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const { confirm, ModalEl } = useConfirm();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, summaryResult] = await Promise.all([
        fetchManagedProducts(
          {
            page: currentPage,
            limit: 10,
            search: search.trim() || undefined,
            categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
            stockFilter:
              stockFilter === "all"
                ? undefined
                : (stockFilter as "in_stock" | "low_stock" | "out_of_stock"),
            status: statusFilter === "all" ? undefined : (statusFilter as any),
          },
          role
        ),
        fetchProductManagementSummary(role),
      ]);
      setProducts(listResult.items);
      setSummary({
        ...summaryResult,
        topCategories: summaryResult.topCategories ?? [],
        lowStockAlerts: summaryResult.lowStockAlerts ?? [],
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Không thể tải danh sách sản phẩm.");
      setProducts([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryFilter, stockFilter, statusFilter, role]);

  useEffect(() => {
    fetchCategories()
      .then(setCategoryOptions)
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const categories = [
    { id: "all", name: "Tất cả danh mục" },
    ...categoryOptions.map((c) => ({ id: c.id, name: c.name })),
  ];

  const totalProductsCount = summary?.total ?? products.length;
  const activeProductsCount = summary?.active ?? products.filter((p) => p.status === "active" && p.stock > 0).length;
  const lowStockProductsCount = summary?.lowStock ?? products.filter((p) => p.stock <= 50).length;
  const categoriesCount = summary?.categories ?? new Set(products.map((p) => p.category)).size;

  const statCards = [
    {
      id: "prod-total",
      label: "Tổng sản phẩm",
      value: totalProductsCount,
      change: 12.4,
      changeLabel: "so với tuần trước",
      icon: "products",
      color: "indigo" as const,
      tooltip: "Tổng số sản phẩm trong hệ thống",
      sparklinePoints: "M2 24L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    },
    {
      id: "prod-active",
      label: "Đang kinh doanh",
      value: activeProductsCount,
      change: 4.8,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "emerald" as const,
      tooltip: "Sản phẩm đang hiển thị bán trên website",
      sparklinePoints: "M2 28L12 20L22 26L32 16L44 22L56 12L68 18L76 8",
    },
    {
      id: "prod-low",
      label: "Hết hàng / Tồn thấp",
      value: lowStockProductsCount,
      change: -2.3,
      changeLabel: "so với tuần trước",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: "rose" as const,
      tooltip: "Sản phẩm có lượng tồn kho dưới 50 hoặc hết hàng",
      sparklinePoints: "M2 18L12 26L22 14L32 20L44 10L56 22L68 12L76 16",
    },
    {
      id: "prod-cats",
      label: "Danh mục sản phẩm",
      value: categoriesCount,
      change: 0.0,
      changeLabel: "Không thay đổi",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      color: "amber" as const,
      tooltip: "Số lượng danh mục sản phẩm khác nhau",
      sparklinePoints: "M2 22L12 18L22 26L32 14L44 22L56 8L68 18L76 4",
    },
  ];

  const filtered = products;

  function handleEdit(p: AdminProductRow) {
    setEditProduct(p);
    setImageUrl(p.mainImageUrl || "");
    setSlideoverOpen(true);
  }

  async function handleDelete(p: AdminProductRow) {
    if (!isAdmin) return;
    const ok = await confirm({
      title: "Ngừng kinh doanh",
      message: `Ngừng kinh doanh sản phẩm "${p.name}"? Sản phẩm vẫn giữ lịch sử đơn hàng.`,
      variant: "danger",
      confirmLabel: "Ngừng KD",
    });
    if (!ok) return;
    try {
      await discontinueAdminProduct(p.id);
      await loadProducts();
    } catch (err) {
      console.error("Failed to discontinue product:", err);
      setError("Không thể ngừng kinh doanh sản phẩm.");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Không thể tải ảnh lên.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const sku = (formData.get("sku") as string) || `SKU-${Date.now().toString().slice(-6)}`;
    const categoryId = formData.get("categoryId") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const status = formData.get("status") as AdminProductRow["status"];
    
    // Shipping fields
    const weight = Number(formData.get("weight")) || 1000;
    const length = Number(formData.get("length")) || 30;
    const width = Number(formData.get("width")) || 30;
    const height = Number(formData.get("height")) || 30;

    setSubmitting(true);
    try {
      if (editProduct) {
        await updateAdminProduct(
          editProduct.id,
          buildUpdatePayloadFromForm({ name, description, sku, categoryId, price, stock, status, mainImageUrl: imageUrl, weight, length, width, height })
        );
      } else {
        await createAdminProduct(
          buildCreatePayloadFromForm({ name, description, sku, categoryId, price, stock, status, mainImageUrl: imageUrl, weight, length, width, height })
        );
      }
      setSlideoverOpen(false);
      setEditProduct(null);
      await loadProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
      setError("Không thể lưu sản phẩm. Kiểm tra lại thông tin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page">
      {ModalEl}
      <style>{`
        /* Scoped Widget Progress bars */
        .cat-progress-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 6px;
        }
        .cat-progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
          transition: width 0.4s ease;
        }
        
        /* Interactive widget items hover */
        .widget-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin-left: -12px;
          margin-right: -12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .widget-list-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        /* Custom options dots button styling */
        .admin-action-btn.options {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .admin-action-btn.options:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        /* Responsive custom columns */
        .admin-product-grid {
          display: grid;
          grid-template-columns: 3fr 1.25fr;
          gap: 20px;
          width: 100%;
          align-items: start;
        }
        @media (max-width: 1200px) {
          .admin-product-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Block */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Sản phẩm</h2>
          <p className="admin-page-subtitle">Quản lý danh mục, tồn kho và trạng thái sản phẩm</p>
        </div>
        {isAdmin && (
          <button
            className="admin-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#6366f1",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onClick={() => {
              setEditProduct(null);
              setImageUrl("");
              setSlideoverOpen(true);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Stats Cards Row */}
      <div
        className="admin-stats-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        {statCards.map((card) => (
          <StatCardWidget key={card.id} card={card} />
        ))}
      </div>

      {/* Main Grid Double Column Container */}
      <div className="admin-product-grid">
        {/* Left Column: Danh sách sản phẩm */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="admin-card" style={{ padding: 0 }}>
            {/* Toolbar Header of Table */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: 0 }}>Danh sách sản phẩm</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Search Box */}
                <div className="admin-search-box" style={{ width: "220px", height: "36px", background: "rgba(13, 21, 38, 0.3)" }}>
                  <span className="admin-search-icon" style={{ left: "10px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="admin-search-input"
                    style={{ paddingLeft: "32px", fontSize: "12.5px" }}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Categories filter selector */}
                <div className="admin-filter-select-wrapper" style={{ height: "36px", padding: "0 10px", background: "rgba(13, 21, 38, 0.3)" }}>
                  <select
                    className="admin-filter-select"
                    style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: "12.5px", outline: "none", cursor: "pointer", paddingRight: "15px" }}
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: "#0d1526", color: "#fff" }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock filter selector */}
                <div className="admin-filter-select-wrapper" style={{ height: "36px", padding: "0 10px", background: "rgba(13, 21, 38, 0.3)" }}>
                  <select
                    className="admin-filter-select"
                    style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: "12.5px", outline: "none", cursor: "pointer", paddingRight: "15px" }}
                    value={stockFilter}
                    onChange={(e) => {
                      setStockFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all" style={{ background: "#0d1526", color: "#fff" }}>Tất cả tồn kho</option>
                    <option value="in_stock" style={{ background: "#0d1526", color: "#fff" }}>Còn hàng</option>
                    <option value="low_stock" style={{ background: "#0d1526", color: "#fff" }}>Sắp hết hàng (≤50)</option>
                    <option value="out_of_stock" style={{ background: "#0d1526", color: "#fff" }}>Hết hàng</option>
                  </select>
                </div>

                {/* Status filter selector */}
                <div className="admin-filter-select-wrapper" style={{ height: "36px", padding: "0 10px", background: "rgba(13, 21, 38, 0.3)" }}>
                  <select
                    className="admin-filter-select"
                    style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: "12.5px", outline: "none", cursor: "pointer", paddingRight: "15px" }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all" style={{ background: "#0d1526", color: "#fff" }}>Tất cả trạng thái</option>
                    <option value="active" style={{ background: "#0d1526", color: "#fff" }}>Đang bán</option>
                    <option value="inactive" style={{ background: "#0d1526", color: "#fff" }}>Ngừng bán</option>
                    <option value="draft" style={{ background: "#0d1526", color: "#fff" }}>Nháp</option>
                  </select>
                </div>

                {/* Export Excel Button */}
                <button
                  className="admin-btn admin-btn-outline"
                  style={{ height: "36px", display: "flex", alignItems: "center", gap: "6px" }}
                  title="Xuất danh sách ra Excel"
                  onClick={() => {
                    if (products.length === 0) {
                      alert("Không có dữ liệu để xuất!");
                      return;
                    }
                    const wsData = products.map(p => ({
                      "Sản phẩm": p.name,
                      "SKU": p.sku,
                      "Danh mục": p.category,
                      "Giá bán": p.price,
                      "Tồn kho": p.stock,
                      "Trạng thái": p.status === "active" ? "Đang bán" : p.status === "inactive" ? "Ngừng bán" : "Nháp"
                    }));
                    const ws = XLSX.utils.json_to_sheet(wsData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Products");
                    XLSX.writeFile(wb, "danh_sach_san_pham.xlsx");
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* Custom Admin Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: "right", paddingRight: "20px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                        Đang tải sản phẩm...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#f43f5e" }}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.map((p) => {
                    const statusStyle = getProductStatusStyle(p.stock, p.status);
                    const statusLabel = getProductStatusLabel(p.stock, p.status);

                    return (
                      <tr key={p.id} className="admin-table-row">
                        <td>
                          <div className="admin-table-product" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <ProductThumbnail
                              imageUrl={p.mainImageUrl}
                              iconType={p.iconType}
                              size={42}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                              <p className="admin-product-name" style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>
                                {p.name}
                              </p>
                              <p className="admin-table-muted" style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>
                                {p.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="admin-table-mono"
                            style={{
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "#e2e8f0",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontFamily: "var(--adm-mono)",
                            }}
                          >
                            {p.sku}
                          </span>
                        </td>
                        <td>
                          <span className="admin-category-tag" style={{ background: "rgba(255, 255, 255, 0.04)", color: "#cbd5e1" }}>
                            {p.category}
                          </span>
                        </td>
                        <td>
                          <span className="admin-table-amount" style={{ color: "#fff", fontWeight: 600 }}>
                            {p.price.toLocaleString("vi-VN")} đ
                          </span>
                        </td>
                        <td>
                          <span
                            className="admin-table-mono"
                            style={{
                              color: p.stock <= 15 ? "#f43f5e" : "#e2e8f0",
                              fontWeight: p.stock <= 15 ? 700 : 500,
                              fontFamily: "var(--adm-mono)",
                            }}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <span
                            className="admin-status-badge"
                            style={{
                              color: statusStyle.color,
                              background: statusStyle.background,
                              borderColor: statusStyle.border.split(" ")[2],
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <span className="admin-status-dot" style={{ background: statusStyle.color, width: "5px", height: "5px" }} />
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions" style={{ justifyContent: "flex-end", paddingRight: "8px", gap: "8px" }}>
                            {isAdmin && (
                            <button
                              className="admin-action-btn edit"
                              title="Sửa"
                              style={{ width: "32px", height: "32px", borderRadius: "6px" }}
                              onClick={() => handleEdit(p)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            )}
                            {isAdmin && p.backendStatus !== "DISCONTINUED" && (
                              <button
                                className="admin-action-btn delete"
                                title="Ngừng kinh doanh"
                                style={{ width: "32px", height: "32px", borderRadius: "6px" }}
                                onClick={() => handleDelete(p)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="admin-empty-state" style={{ padding: "40px 0" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: "16px" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ color: "#64748b", margin: 0 }}>Không tìm thấy sản phẩm nào phù hợp</p>
                </div>
              )}
            </div>

            {/* Detailed Table Pagination Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Hiển thị {filtered.length} / {totalProductsCount.toLocaleString("vi-VN")} sản phẩm
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Previous Page Button */}
                <button
                  className="admin-action-btn options"
                  style={{ width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  disabled
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Page Indicators */}
                <button
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  1
                </button>
                <button
                  className="admin-action-btn options"
                  style={{ width: "32px", height: "32px", borderRadius: "6px", color: "#94a3b8", border: "none", background: "transparent", fontSize: "13px" }}
                >
                  2
                </button>
                <button
                  className="admin-action-btn options"
                  style={{ width: "32px", height: "32px", borderRadius: "6px", color: "#94a3b8", border: "none", background: "transparent", fontSize: "13px" }}
                >
                  3
                </button>
                <span style={{ color: "#64748b", padding: "0 4px", fontSize: "13px" }}>...</span>
                <button
                  className="admin-action-btn options"
                  style={{ width: "32px", height: "32px", borderRadius: "6px", color: "#94a3b8", border: "none", background: "transparent", fontSize: "13px" }}
                >
                  125
                </button>

                {/* Next Page Button */}
                <button
                  className="admin-action-btn options"
                  style={{ width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Widget 1: Danh mục nổi bật */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Danh mục nổi bật</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {(summary?.topCategories ?? []).length === 0 && (
                <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Chưa có dữ liệu danh mục.</p>
              )}
              {(summary?.topCategories ?? []).map((cat) => (
                <div key={cat.categoryId}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{cat.categoryName}</span>
                    <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                      <span style={{ color: "#64748b" }}>{cat.productCount} sản phẩm</span>
                      <span style={{ color: "#3b82f6", fontWeight: 600 }}>{cat.percentage}%</span>
                    </div>
                  </div>
                  <div className="cat-progress-bg">
                    <div className="cat-progress-fill" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                marginTop: "16px",
                paddingTop: "12px",
                textAlign: "center",
              }}
            >
              {isAdmin && (
                <button
                  type="button"
                  style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => navigate("/admin/categories")}
                >
                  Xem tất cả danh mục &gt;
                </button>
              )}
            </div>
          </div>

          {/* Widget 2: Cảnh báo tồn kho */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Cảnh báo tồn kho</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(summary?.lowStockAlerts ?? []).length === 0 && (
                <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Không có cảnh báo tồn kho.</p>
              )}
              {(summary?.lowStockAlerts ?? []).map((item) => {
                const isOut = item.stock === 0;
                const badgeStyle = isOut
                  ? {
                      background: "rgba(244, 63, 94, 0.12)",
                      color: "#f43f5e",
                      border: "1px solid rgba(244, 63, 94, 0.25)",
                    }
                  : {
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                    };

                return (
                  <div key={item.id} className="widget-list-item">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <ProductThumbnail imageUrl={item.mainImageUrl} iconType="default" size={36} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {item.description || "—"}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        ...badgeStyle,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        fontFamily: "var(--adm-mono)",
                      }}
                    >
                      Tồn: {item.stock}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                marginTop: "16px",
                paddingTop: "12px",
                textAlign: "center",
              }}
            >
              <a
                href="#all-alerts"
                style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
                onClick={(e) => {
                  e.preventDefault();
                  setStockFilter("low_stock");
                  setCurrentPage(1);
                }}
              >
                Xem tất cả cảnh báo &gt;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {isAdmin && (
      <CrudModal
        isOpen={slideoverOpen}
        mode={editProduct ? "edit" : "create"}
        title={editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        onClose={() => setSlideoverOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
        size="xl"
      >
          <div className="admin-form-row">
            <FormField label="Tên sản phẩm" required>
              <FormInput name="name" placeholder="Nhập tên sản phẩm..." defaultValue={editProduct?.name} required />
            </FormField>
            <FormField label="Mã SKU">
              <FormInput name="sku" placeholder="VD: SKU-12345" defaultValue={editProduct?.sku} />
            </FormField>
          </div>

          <FormField label="Mô tả sản phẩm">
            <FormTextarea name="description" placeholder="Nhập mô tả..." defaultValue={editProduct?.description} />
          </FormField>

          <FormField label="Ảnh sản phẩm">
            <div className="admin-image-upload-zone">
              {imageUrl ? (
                <div className="admin-image-preview">
                  <img src={imageUrl} alt="Preview" />
                  <button type="button" className="admin-image-remove" onClick={() => setImageUrl("")}>X</button>
                </div>
              ) : (
                <label className="admin-image-upload-label">
                  <input type="file" accept="image/*" className="admin-image-file-input" onChange={handleImageUpload} disabled={uploadingImage} />
                  <span>{uploadingImage ? "Đang tải lên..." : "Tải ảnh lên"}</span>
                </label>
              )}
            </div>
          </FormField>

          <div className="admin-form-row">
            <FormField label="Danh mục" required>
              <FormSelect name="categoryId" defaultValue={editProduct?.categoryId} required>
                <option value="">-- Chọn danh mục --</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Trạng thái" required>
              <FormSelect name="status" defaultValue={editProduct?.status || "active"}>
                <option value="active">Đang kinh doanh</option>
                <option value="inactive">Ẩn</option>
              </FormSelect>
            </FormField>
          </div>

          <div className="admin-form-row">
            <FormField label="Giá (VNĐ)" required>
              <FormInput type="number" name="price" min="0" step="1000" defaultValue={editProduct?.price} required />
            </FormField>
            <FormField label="Tồn kho" required>
              <FormInput type="number" name="stock" min="0" defaultValue={editProduct?.stock ?? 10} required />
            </FormField>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '12px' }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thông số Vận chuyển (GHN)</h4>
            <div className="admin-form-row">
              <FormField label="Khối lượng (gram)" required>
                <FormInput type="number" name="weight" min="1" defaultValue={editProduct?.weight || 1000} required />
              </FormField>
              <FormField label="Chiều dài (cm)" required>
                <FormInput type="number" name="length" min="1" defaultValue={editProduct?.length || 30} required />
              </FormField>
            </div>
            <div className="admin-form-row" style={{ marginTop: '16px' }}>
              <FormField label="Chiều rộng (cm)" required>
                <FormInput type="number" name="width" min="1" defaultValue={editProduct?.width || 30} required />
              </FormField>
              <FormField label="Chiều cao (cm)" required>
                <FormInput type="number" name="height" min="1" defaultValue={editProduct?.height || 30} required />
              </FormField>
            </div>
          </div>
      </CrudModal>
      )}
    </div>
  );
}
