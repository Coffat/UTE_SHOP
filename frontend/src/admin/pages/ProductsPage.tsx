import { useState } from "react";
import { PRODUCTS } from "../data/mockData";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm, Slideover, FormField, FormInput, FormSelect, FormTextarea } from "../components/AdminUI";
import type { Product } from "../types/admin.types";

const STATUS_CFG = {
  active:       { label: "Đang bán",   color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  inactive:     { label: "Ngừng bán",  color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  out_of_stock: { label: "Hết hàng",   color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
};

function ProductStatusBadge({ status }: { status: Product["status"] }) {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className="admin-status-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
    >
      <span className="admin-status-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export function ProductsPage() {
  const { isAdmin } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const { confirm, ModalEl } = useConfirm();

  const categories = ["all", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleEdit(p: Product) {
    setEditProduct(p);
    setSlideoverOpen(true);
  }

  async function handleDelete(p: Product) {
    const ok = await confirm({
      title: "Xóa sản phẩm",
      message: `Bạn có chắc muốn xóa sản phẩm "${p.name}"? Thao tác này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa ngay",
    });
    if (ok) {
      console.log("Delete product", p.id);
    }
  }

  return (
    <div className="admin-page">
      {ModalEl}

      {/* Toolbar */}
      <div className="admin-page-toolbar">
        <div className="admin-search-box">
          <span className="admin-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "Tất cả danh mục" : c}</option>
          ))}
        </select>
        {isAdmin && (
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => { setEditProduct(null); setSlideoverOpen(true); }}
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Đã bán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="admin-table-row">
                  <td>
                    <div className="admin-table-product">
                      <div className="admin-product-thumb">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <div>
                        <p className="admin-product-name">{p.name}</p>
                        <p className="admin-table-muted">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="admin-category-tag">{p.category}</span></td>
                  <td><span className="admin-table-amount">{p.price.toLocaleString("vi-VN")} ₫</span></td>
                  <td>
                    <span className={p.stock === 0 ? "admin-table-zero" : "admin-table-mono"}>
                      {p.stock}
                    </span>
                  </td>
                  <td><span className="admin-table-mono">{p.sales.toLocaleString("vi-VN")}</span></td>
                  <td><ProductStatusBadge status={p.status} /></td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-btn view" title="Xem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="admin-action-btn edit" title="Sửa" onClick={() => handleEdit(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button className="admin-action-btn delete" title="Xóa" onClick={() => handleDelete(p)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '16px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Slideover */}
      <Slideover
        isOpen={slideoverOpen}
        title={editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        onClose={() => setSlideoverOpen(false)}
      >
        <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setSlideoverOpen(false); }}>
          <FormField label="Tên sản phẩm" required>
            <FormInput placeholder="Nhập tên sản phẩm..." defaultValue={editProduct?.name} />
          </FormField>
          <FormField label="Danh mục" required>
            <FormSelect defaultValue={editProduct?.category}>
              <option value="">-- Chọn danh mục --</option>
              <option>Hoa tươi</option>
              <option>Hoa lụa</option>
              <option>Cây cảnh</option>
              <option>Quà tặng</option>
            </FormSelect>
          </FormField>
          <div className="admin-form-row">
            <FormField label="Giá bán (₫)" required>
              <FormInput type="number" placeholder="0" defaultValue={editProduct?.price} />
            </FormField>
            <FormField label="Tồn kho" required>
              <FormInput type="number" placeholder="0" defaultValue={editProduct?.stock} />
            </FormField>
          </div>
          <FormField label="Mô tả sản phẩm">
            <FormTextarea placeholder="Nhập mô tả..." />
          </FormField>
          <FormField label="Trạng thái">
            <FormSelect defaultValue={editProduct?.status ?? "active"}>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
              <option value="out_of_stock">Hết hàng</option>
            </FormSelect>
          </FormField>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSlideoverOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </Slideover>
    </div>
  );
}
