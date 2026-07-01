import { useEffect, useState, useMemo } from "react";
import { fetchAllRecipes, type RecipeItem } from "../../services/warehouse.api";
import { RecipeModal } from "../../components/RecipeModal";

export function WarehouseRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await fetchAllRecipes();
      setRecipes(data);
    } catch (error) {
      console.error("Lỗi khi tải công thức", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleCreate = () => {
    setEditingRecipe(null);
    setIsModalOpen(true);
  };

  const handleEdit = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = (saved: boolean) => {
    setIsModalOpen(false);
    if (saved) {
      loadRecipes();
    }
  };

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<string>("productName-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const processedRecipes = useMemo(() => {
    // 1. Filter
    const filtered = recipes.filter(r => {
      const variantObj = typeof r.productVariant === 'object' ? r.productVariant : null;
      const variantId = variantObj ? variantObj._id : r.productVariant;
      const sku = variantObj ? variantObj.sku : "";
      const productName = variantObj && typeof variantObj.product === 'object' && variantObj.product ? variantObj.product.name : "";
      
      const matchesSearch = variantId.toLowerCase().includes(search.toLowerCase()) || 
             (sku && sku.toLowerCase().includes(search.toLowerCase())) ||
             (productName && productName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "all" ||
             (statusFilter === "active" && r.isActive) ||
             (statusFilter === "inactive" && !r.isActive);

      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      const aVariant = typeof a.productVariant === 'object' ? a.productVariant : null;
      const bVariant = typeof b.productVariant === 'object' ? b.productVariant : null;

      const aName = aVariant && typeof aVariant.product === 'object' && aVariant.product ? aVariant.product.name : "";
      const bName = bVariant && typeof bVariant.product === 'object' && bVariant.product ? bVariant.product.name : "";

      const aSku = aVariant ? aVariant.sku : "";
      const bSku = bVariant ? bVariant.sku : "";

      switch (sortBy) {
        case "productName-asc":
          return aName.localeCompare(bName, 'vi');
        case "productName-desc":
          return bName.localeCompare(aName, 'vi');
        case "sku-asc":
          return aSku.localeCompare(bSku);
        case "sku-desc":
          return bSku.localeCompare(aSku);
        case "ingredients-asc":
          return a.ingredients.length - b.ingredients.length;
        case "ingredients-desc":
          return b.ingredients.length - a.ingredients.length;
        case "status-asc":
          return (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
        case "status-desc":
          return (a.isActive === b.isActive) ? 0 : a.isActive ? 1 : -1;
        default:
          return 0;
      }
    });
  }, [recipes, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(processedRecipes.length / itemsPerPage);
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedRecipes.slice(startIndex, startIndex + itemsPerPage);
  }, [processedRecipes, currentPage]);

  return (
    <div className="admin-page" style={{ paddingBottom: "40px" }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Công thức (BOM)</h2>
          <p className="admin-page-subtitle">Quản lý định mức nguyên liệu cho các thành phẩm</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          + Thêm Công thức
        </button>
      </div>

      <div className="admin-card" style={{ padding: "24px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div className="admin-search-box" style={{ flex: 1, minWidth: "240px", background: "rgba(255,255,255,0.03)" }}>
            <span className="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "transparent", color: "#e2e8f0", border: "none", outline: "none", fontSize: "13.5px" }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: "160px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer", outline: "none" }}
          >
            <option value="all" style={{ background: "#0d1526" }}>Tất cả trạng thái</option>
            <option value="active" style={{ background: "#0d1526" }}>Đang áp dụng</option>
            <option value="inactive" style={{ background: "#0d1526" }}>Tạm ngưng</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "180px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", height: "38px", cursor: "pointer", outline: "none" }}
          >
            <option value="productName-asc" style={{ background: "#0d1526" }}>Tên sản phẩm (A-Z)</option>
            <option value="productName-desc" style={{ background: "#0d1526" }}>Tên sản phẩm (Z-A)</option>
            <option value="sku-asc" style={{ background: "#0d1526" }}>SKU (A-Z)</option>
            <option value="sku-desc" style={{ background: "#0d1526" }}>SKU (Z-A)</option>
            <option value="ingredients-asc" style={{ background: "#0d1526" }}>Nguyên liệu (Ít nhất)</option>
            <option value="ingredients-desc" style={{ background: "#0d1526" }}>Nguyên liệu (Nhiều nhất)</option>
            <option value="status-asc" style={{ background: "#0d1526" }}>Trạng thái: Hoạt động trước</option>
            <option value="status-desc" style={{ background: "#0d1526" }}>Trạng thái: Tạm ngưng trước</option>
          </select>
        </div>

        {/* Table */}
        <div className="admin-table-wrap" style={{ borderRadius: "8px", border: "1px solid var(--adm-border)", overflowX: "auto", flex: 1, overflowY: "auto" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--adm-border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Sản phẩm / Variant</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>SKU</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Số lượng Nguyên liệu</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-dim)", width: "100px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "64px", color: "var(--adm-text-dim)", fontSize: "14px" }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedRecipes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "64px", color: "var(--adm-text-dim)", fontSize: "14px" }}>
                    Không có công thức nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedRecipes.map((r) => {
                  const variantObj = typeof r.productVariant === 'object' ? r.productVariant : null;
                  const variantId = variantObj ? variantObj._id : r.productVariant;
                  const sku = variantObj ? variantObj.sku : "N/A";
                  const productName = variantObj && typeof variantObj.product === 'object' && variantObj.product ? variantObj.product.name : "";
                  return (
                    <tr key={r._id} className="admin-table-row" style={{ borderBottom: "1px solid var(--adm-border)" }}>
                      <td style={{ padding: "12px 16px", color: "#fff", fontSize: "13.5px", fontWeight: 500 }}>
                        {productName ? productName : variantId}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--adm-text-dim)", fontFamily: "monospace" }}>{sku}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#e2e8f0" }}>{r.ingredients.length} nguyên liệu</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                          background: r.isActive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                          color: r.isActive ? "#10b981" : "#ef4444",
                          border: `1px solid ${r.isActive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
                        }}>
                          {r.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button 
                          onClick={() => handleEdit(r)}
                          style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", padding: "4px", fontSize: "13px", fontWeight: 500 }}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "var(--adm-text-dim)" }}>
              Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedRecipes.length)}</strong> trong <strong>{processedRecipes.length}</strong> công thức
            </div>
            
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--adm-border)", borderRadius: "6px", color: currentPage === 1 ? "var(--adm-text-dim)" : "#e2e8f0", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                if (p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1) {
                  return (
                    <button 
                      key={p} onClick={() => setCurrentPage(p)}
                      style={{ 
                        width: "32px", height: "32px", 
                        background: currentPage === p ? "rgba(99,102,241,0.15)" : "transparent", 
                        border: `1px solid ${currentPage === p ? "rgba(99,102,241,0.4)" : "var(--adm-border)"}`, 
                        borderRadius: "6px", 
                        color: currentPage === p ? "#818cf8" : "var(--adm-text-dim)", 
                        cursor: "pointer", fontSize: "13px", fontWeight: currentPage === p ? 600 : 400
                      }}
                    >
                      {p}
                    </button>
                  );
                } else if (Math.abs(currentPage - p) === 2 && (p > 1 && p < totalPages)) {
                  return <span key={p} style={{ padding: "4px 6px", color: "var(--adm-text-dim)", fontSize: "13px" }}>...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--adm-border)", borderRadius: "6px", color: currentPage === totalPages ? "var(--adm-text-dim)" : "#e2e8f0", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <RecipeModal 
          onClose={handleModalClose}
          initialData={editingRecipe}
        />
      )}
    </div>
  );
}
