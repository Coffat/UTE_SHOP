import { useEffect, useState } from "react";
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

  const filteredRecipes = recipes.filter(r => {
    const variantObj = typeof r.productVariant === 'object' ? r.productVariant : null;
    const variantId = variantObj ? variantObj._id : r.productVariant;
    const sku = variantObj ? variantObj.sku : "";
    const productName = variantObj && typeof variantObj.product === 'object' && variantObj.product ? variantObj.product.name : "";
    return variantId.toLowerCase().includes(search.toLowerCase()) || 
           (sku && sku.toLowerCase().includes(search.toLowerCase())) ||
           (productName && productName.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Công thức (BOM)</h2>
          <p className="admin-page-subtitle">Quản lý định mức nguyên liệu cho các thành phẩm</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          + Thêm Công thức
        </button>
      </div>

      <div className="admin-card" style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div className="admin-search-box" style={{ width: "300px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: "12px", marginRight: "8px" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Variant ID hoặc SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", color: "#e2e8f0", outline: "none", width: "100%", fontSize: "14px" }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container" style={{ flex: 1, overflowY: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm / Variant</th>
                <th>SKU</th>
                <th>Số lượng Nguyên liệu</th>
                <th>Trạng thái</th>
                <th style={{ width: "100px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-dim)" }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-dim)" }}>
                    Không có công thức nào
                  </td>
                </tr>
              ) : (
                filteredRecipes.map((r) => {
                  const variantObj = typeof r.productVariant === 'object' ? r.productVariant : null;
                  const variantId = variantObj ? variantObj._id : r.productVariant;
                  const sku = variantObj ? variantObj.sku : "N/A";
                  const productName = variantObj && typeof variantObj.product === 'object' && variantObj.product ? variantObj.product.name : "";
                  return (
                    <tr key={r._id}>
                      <td style={{ fontFamily: "monospace", color: "#818cf8" }}>{productName ? `${productName}` : variantId}</td>
                      <td>{sku}</td>
                      <td>{r.ingredients.length} nguyên liệu</td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
                          background: r.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: r.isActive ? "#10b981" : "#ef4444"
                        }}>
                          {r.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => handleEdit(r)}
                          style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", padding: "4px" }}
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
