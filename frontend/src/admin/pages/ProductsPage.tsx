import { useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm, Slideover, FormField, FormInput, FormSelect } from "../components/AdminUI";
import { StatCardWidget } from "../components/StatCard";
import type { Product } from "../types/admin.types";

interface ExtendedProduct extends Product {
  subName: string;
  sku: string;
  iconType: "headphones" | "sneaker" | "backpack" | "hoodie" | "keyboard" | "mouse" | "earbuds";
}

const INITIAL_PRODUCTS: ExtendedProduct[] = [
  {
    id: "SP-001",
    name: "Tai nghe Bluetooth",
    subName: "Sony WH-1000XM5",
    sku: "SONY-WH1000XM5",
    category: "Tai nghe",
    price: 2990000,
    stock: 120,
    status: "active",
    sales: 248,
    iconType: "headphones"
  },
  {
    id: "SP-002",
    name: "Giày Thể Thao Nam",
    subName: "UltraBoost Light",
    sku: "UB-LIGHT-001",
    category: "Giày dép",
    price: 2350000,
    stock: 48,
    status: "active",
    sales: 210,
    iconType: "sneaker"
  },
  {
    id: "SP-003",
    name: "Balo Laptop 15.6 inch",
    subName: "Mark Ryden MR-9001",
    sku: "MR-9001-BLK",
    category: "Balo",
    price: 1250000,
    stock: 15,
    status: "active",
    sales: 156,
    iconType: "backpack"
  },
  {
    id: "SP-004",
    name: "Áo Hoodie Essentials",
    subName: "Unisex",
    sku: "HD-ESS-001-BLK",
    category: "Thời trang",
    price: 690000,
    stock: 200,
    status: "active",
    sales: 220,
    iconType: "hoodie"
  },
  {
    id: "SP-005",
    name: "Bàn phím cơ Keychron",
    subName: "K8 Pro RGB Brown",
    sku: "KBP-BRN-RGB",
    category: "Phụ kiện",
    price: 2190000,
    stock: 32,
    status: "active",
    sales: 198,
    iconType: "keyboard"
  },
  {
    id: "SP-006",
    name: "Chuột Gaming Logitech",
    subName: "G Pro X Superlight 2",
    sku: "LOGI-GPX2-BLK",
    category: "Phụ kiện",
    price: 2590000,
    stock: 68,
    status: "active",
    sales: 178,
    iconType: "mouse"
  },
  {
    id: "SP-007",
    name: "Tai nghe True Wireless",
    subName: "Samsung Galaxy Buds2 Pro",
    sku: "SS-BUDS2PRO",
    category: "Tai nghe",
    price: 2490000,
    stock: 0,
    status: "inactive",
    sales: 0,
    iconType: "earbuds"
  }
];

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
  const { isAdmin } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [products, setProducts] = useState<ExtendedProduct[]>(INITIAL_PRODUCTS);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ExtendedProduct | null>(null);
  const { confirm, ModalEl } = useConfirm();

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => p.status === "active" && p.stock > 0).length;
  const lowStockProductsCount = products.filter(p => p.stock <= 50).length;
  const categoriesCount = new Set(products.map(p => p.category)).size;

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

  const filtered = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchCat = categoryFilter === "all" || p.category === categoryFilter;

    let matchStock = true;
    if (stockFilter === "low_stock") {
      matchStock = p.stock > 0 && p.stock <= 50;
    } else if (stockFilter === "out_of_stock") {
      matchStock = p.stock === 0;
    } else if (stockFilter === "in_stock") {
      matchStock = p.stock > 0;
    }

    return matchSearch && matchCat && matchStock;
  });

  function handleEdit(p: ExtendedProduct) {
    setEditProduct(p);
    setSlideoverOpen(true);
  }

  async function handleDelete(p: ExtendedProduct) {
    const ok = await confirm({
      title: "Xóa sản phẩm",
      message: `Bạn có chắc muốn xóa sản phẩm "${p.name} - ${p.subName}"? Thao tác này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa ngay",
    });
    if (ok) {
      setProducts(products.filter((item) => item.id !== p.id));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const subName = formData.get("subName") as string || "Standard Edition";
    const sku = formData.get("sku") as string || `SP-${Date.now().toString().slice(-6)}`;
    const category = formData.get("category") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const status = formData.get("status") as Product["status"];

    if (editProduct) {
      setProducts(
        products.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name,
                subName,
                sku,
                category,
                price,
                stock,
                status,
              }
            : p
        )
      );
    } else {
      const newProduct: ExtendedProduct = {
        id: `SP-${(products.length + 1).toString().padStart(3, "0")}`,
        name,
        subName,
        sku,
        category,
        price,
        stock,
        status,
        sales: 0,
        iconType: "headphones",
      };
      setProducts([...products, newProduct]);
    }
    setSlideoverOpen(false);
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
            setSlideoverOpen(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm sản phẩm
        </button>
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
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Categories filter selector */}
                <div className="admin-filter-select-wrapper" style={{ height: "36px", padding: "0 10px", background: "rgba(13, 21, 38, 0.3)" }}>
                  <select
                    className="admin-filter-select"
                    style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: "12.5px", outline: "none", cursor: "pointer", paddingRight: "15px" }}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} style={{ background: "#0d1526", color: "#fff" }}>
                        {c === "all" ? "Tất cả danh mục" : c}
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
                    onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <option value="all" style={{ background: "#0d1526", color: "#fff" }}>Tất cả tồn kho</option>
                    <option value="in_stock" style={{ background: "#0d1526", color: "#fff" }}>Còn hàng</option>
                    <option value="low_stock" style={{ background: "#0d1526", color: "#fff" }}>Sắp hết hàng (≤50)</option>
                    <option value="out_of_stock" style={{ background: "#0d1526", color: "#fff" }}>Hết hàng</option>
                  </select>
                </div>

                {/* Export Excel Button */}
                <button
                  className="admin-action-btn options"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "36px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  title="Xuất danh sách ra Excel"
                  onClick={() => alert("Đang xuất danh sách sản phẩm ra file Excel...")}
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
                  {filtered.map((p) => {
                    const statusStyle = getProductStatusStyle(p.stock, p.status);
                    const statusLabel = getProductStatusLabel(p.stock, p.status);

                    return (
                      <tr key={p.id} className="admin-table-row">
                        <td>
                          <div className="admin-table-product" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {/* Product Thumbnail Wrapper */}
                            <div
                              className="admin-product-thumb"
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "8px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {getProductIcon(p.iconType)}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                              <p className="admin-product-name" style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>
                                {p.name}
                              </p>
                              <p className="admin-table-muted" style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>
                                {p.subName}
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
                            {isAdmin && (
                              <button
                                className="admin-action-btn delete"
                                title="Xóa"
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
                Hiển thị 1 đến {filtered.length} trong tổng số 1,248 sản phẩm
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
              {/* Category Item 1: Tai nghe */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Tai nghe</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>248 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>19.9%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "19.9%" }} />
                </div>
              </div>

              {/* Category Item 2: Giày dép */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Giày dép</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>210 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>16.9%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "16.9%" }} />
                </div>
              </div>

              {/* Category Item 3: Balo */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Balo</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>156 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>12.5%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "12.5%" }} />
                </div>
              </div>

              {/* Category Item 4: Phụ kiện */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Phụ kiện</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>198 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>15.9%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "15.9%" }} />
                </div>
              </div>

              {/* Category Item 5: Thời trang */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Thời trang</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>220 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>17.7%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "17.7%" }} />
                </div>
              </div>

              {/* Category Item 6: Khác */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Khác</span>
                  <div style={{ display: "flex", gap: "8px", fontFamily: "var(--adm-mono)" }}>
                    <span style={{ color: "#64748b" }}>216 sản phẩm</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>17.3%</span>
                  </div>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-fill" style={{ width: "17.3%" }} />
                </div>
              </div>
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
                href="#all-categories"
                style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
                onClick={(e) => { e.preventDefault(); alert("Đang chuyển hướng tới trang quản lý tất cả danh mục..."); }}
              >
                Xem tất cả danh mục &gt;
              </a>
            </div>
          </div>

          {/* Widget 2: Cảnh báo tồn kho */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>Cảnh báo tồn kho</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Item 1: Samsung Buds */}
              <div className="widget-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getProductIcon("earbuds")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Tai nghe True Wireless</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Samsung Galaxy Buds2 Pro</span>
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#f43f5e",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--adm-mono)",
                  }}
                >
                  Tồn: 0
                </span>
              </div>

              {/* Item 2: Balo Mark Ryden */}
              <div className="widget-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getProductIcon("backpack")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Balo Laptop 15.6 inch</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Mark Ryden MR-9001</span>
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#f43f5e",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--adm-mono)",
                  }}
                >
                  Tồn: 15
                </span>
              </div>

              {/* Item 3: Giày UltraBoost */}
              <div className="widget-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getProductIcon("sneaker")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Giày Thể Thao Nam</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>UltraBoost Light</span>
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--adm-mono)",
                  }}
                >
                  Tồn: 48
                </span>
              </div>

              {/* Item 4: Bàn phím Keychron */}
              <div className="widget-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getProductIcon("keyboard")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Bàn phím cơ Keychron</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>K8 Pro RGB Brown</span>
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--adm-mono)",
                  }}
                >
                  Tồn: 32
                </span>
              </div>

              {/* Item 5: Ốp lưng Spigen */}
              <div className="widget-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Ốp lưng iPhone 15 Pro Max</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Spigen Liquid Air</span>
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#f43f5e",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--adm-mono)",
                  }}
                >
                  Tồn: 9
                </span>
              </div>
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
                onClick={(e) => { e.preventDefault(); alert("Đang chuyển hướng tới bộ lọc tồn kho thấp..."); setStockFilter("low_stock"); }}
              >
                Xem tất cả cảnh báo &gt;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Slideover */}
      <Slideover
        isOpen={slideoverOpen}
        title={editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        onClose={() => setSlideoverOpen(false)}
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          <FormField label="Tên sản phẩm" required>
            <FormInput name="name" placeholder="Nhập tên sản phẩm..." defaultValue={editProduct?.name} required />
          </FormField>
          <FormField label="Phiên bản / Loại sản phẩm">
            <FormInput name="subName" placeholder="Ví dụ: Sony WH-1000XM5" defaultValue={editProduct?.subName} />
          </FormField>
          <FormField label="Mã SKU">
            <FormInput name="sku" placeholder="Ví dụ: SONY-WH1000XM5" defaultValue={editProduct?.sku} />
          </FormField>
          <FormField label="Danh mục" required>
            <FormSelect name="category" defaultValue={editProduct?.category} required>
              <option value="">-- Chọn danh mục --</option>
              <option value="Tai nghe">Tai nghe</option>
              <option value="Giày dép">Giày dép</option>
              <option value="Balo">Balo</option>
              <option value="Phụ kiện">Phụ kiện</option>
              <option value="Thời trang">Thời trang</option>
            </FormSelect>
          </FormField>
          <div className="admin-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="Giá bán (₫)" required>
              <FormInput name="price" type="number" placeholder="0" defaultValue={editProduct?.price} required />
            </FormField>
            <FormField label="Tồn kho" required>
              <FormInput name="stock" type="number" placeholder="0" defaultValue={editProduct?.stock} required />
            </FormField>
          </div>
          <FormField label="Trạng thái">
            <FormSelect name="status" defaultValue={editProduct?.status ?? "active"}>
              <option value="active">Đang bán</option>
              <option value="inactive">Ẩn</option>
            </FormSelect>
          </FormField>
          <div className="admin-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSlideoverOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" style={{ background: "#6366f1", border: "none" }}>
              {editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </Slideover>
    </div>
  );
}
