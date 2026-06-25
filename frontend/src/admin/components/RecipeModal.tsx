import { useEffect, useState } from "react";
import { fetchMaterials, createRecipe, updateRecipe, type MaterialItem, type RecipeItem } from "../services/warehouse.api";
import { fetchManagedProducts } from "../services/productManagement.api";
import type { AdminProductRow } from "../services/mappers/product.mapper";
import { useAdminAuth } from "../context/AdminAuthContext";

interface RecipeModalProps {
  onClose: (saved: boolean) => void;
  initialData: RecipeItem | null;
}

interface IngredientRow {
  id: string; // temp id for UI
  materialId: string;
  amount: string;
  wastePercent: string;
}

export function RecipeModal({ onClose, initialData }: RecipeModalProps) {
  const isEditing = !!initialData;
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [variantId, setVariantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);

  const { user } = useAdminAuth();

  useEffect(() => {
    if (!user) return;
    fetchMaterials().then(setMaterials).catch(console.error);
    fetchManagedProducts({ limit: 1000 }, user.role).then(res => setProducts(res.items)).catch(console.error);
    
    if (initialData) {
      const vId = typeof initialData.productVariant === 'object' ? initialData.productVariant._id : initialData.productVariant;
      setVariantId(vId);
      setIsActive(initialData.isActive);
      
      const mappedIngs = initialData.ingredients.map(ing => {
        const matId = typeof ing.material === 'object' ? ing.material._id : ing.material;
        const baseAmt = typeof ing.amount === "object" ? Number((ing.amount as any).$numberDecimal) : Number(ing.amount);
        const wp = typeof ing.wastePercent === "object" ? Number((ing.wastePercent as any).$numberDecimal) : Number(ing.wastePercent);
        return {
          id: Math.random().toString(36).substr(2, 9),
          materialId: matId,
          amount: baseAmt.toString(),
          wastePercent: wp.toString()
        };
      });
      setIngredients(mappedIngs);
    } else {
      handleAddIngredient();
    }
  }, [initialData]);

  const handleAddIngredient = () => {
    setIngredients(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      materialId: "",
      amount: "1",
      wastePercent: "0"
    }]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleChangeIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!variantId.trim()) {
      setError("Vui lòng nhập Variant ID");
      return;
    }

    if (ingredients.length === 0) {
      setError("Cần ít nhất 1 nguyên liệu trong công thức");
      return;
    }

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      if (!ing.materialId) {
        setError(`Vui lòng chọn nguyên liệu ở dòng ${i + 1}`);
        return;
      }
      if (Number(ing.amount) <= 0) {
        setError(`Định mức ở dòng ${i + 1} phải lớn hơn 0`);
        return;
      }
      if (Number(ing.wastePercent) < 0) {
        setError(`Hao hụt ở dòng ${i + 1} không được âm`);
        return;
      }
    }

    const payloadIngredients = ingredients.map(i => ({
      material: i.materialId,
      amount: Number(i.amount),
      wastePercent: Number(i.wastePercent)
    }));

    setLoading(true);
    try {
      if (isEditing && initialData) {
        await updateRecipe(initialData._id, {
          ingredients: payloadIngredients,
          isActive
        });
      } else {
        await createRecipe({
          productVariant: variantId.trim(),
          ingredients: payloadIngredients,
          isActive
        });
      }
      onClose(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Đã xảy ra lỗi khi lưu công thức";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      paddingTop: "50px", zIndex: 9999, overflowY: "auto"
    }}>
      <div className="admin-card" style={{
        width: "100%", maxWidth: "700px", padding: "32px",
        background: "#0f172a", border: "1px solid var(--adm-border)", borderRadius: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>
            {isEditing ? "Chỉnh sửa Công thức (BOM)" : "Tạo Công thức mới"}
          </h2>
          <button onClick={() => onClose(false)} style={{ background: "transparent", border: "none", color: "var(--adm-text-dim)", cursor: "pointer", padding: "8px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Thành phẩm *</label>
              <select 
                value={variantId}
                onChange={e => setVariantId(e.target.value)}
                disabled={isEditing}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: isEditing ? "var(--adm-text-dim)" : (variantId ? "#e2e8f0" : "var(--adm-text-dim)"), borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none", cursor: isEditing ? "not-allowed" : "pointer" }}
              >
                <option value="" style={{ background: "#0d1526" }}>-- Chọn thành phẩm --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.primaryVariantId || ""} disabled={!p.primaryVariantId} style={{ background: "#0d1526" }}>
                    {p.name} {p.sku ? `(${p.sku})` : ''} {!p.primaryVariantId ? '(Chưa có Variant)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#e2e8f0", paddingBottom: "10px" }}>
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#10b981" }} 
              />
              Kích hoạt
            </label>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#fff", display: "block" }}>Thành phần Nguyên liệu</label>
              <button 
                type="button" onClick={handleAddIngredient}
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                + Thêm dòng
              </button>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "12px", color: "var(--adm-text-dim)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px" }}>Nguyên liệu</th>
                    <th style={{ padding: "12px 16px", width: "120px" }}>Định mức</th>
                    <th style={{ padding: "12px 16px", width: "100px" }}>% Hao hụt</th>
                    <th style={{ padding: "12px 16px", width: "60px", textAlign: "center" }}>Xoá</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--adm-text-dim)", fontSize: "13px" }}>
                        Chưa có nguyên liệu nào được thêm
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((ing, idx) => (
                      <tr key={ing.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <select 
                            value={ing.materialId}
                            onChange={e => handleChangeIngredient(ing.id, "materialId", e.target.value)}
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: ing.materialId ? "#fff" : "var(--adm-text-dim)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                          >
                            <option value="" style={{ background: "#0d1526" }}>-- Chọn --</option>
                            {materials.map(m => (
                              <option key={m._id} value={m._id} style={{ background: "#0d1526" }}>{m.name} ({m.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <input 
                            type="number" min="0.01" step="0.01"
                            value={ing.amount}
                            onChange={e => handleChangeIngredient(ing.id, "amount", e.target.value)}
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <input 
                            type="number" min="0" step="1"
                            value={ing.wastePercent}
                            onChange={e => handleChangeIngredient(ing.id, "wastePercent", e.target.value)}
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f87171", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveIngredient(ing.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button 
              type="button" onClick={() => onClose(false)}
              style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid var(--adm-border)", color: "#e2e8f0", fontWeight: 500, cursor: "pointer" }}
            >
              Hủy
            </button>
            <button 
              type="submit" disabled={loading}
              style={{ padding: "10px 24px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
            >
              {loading ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Tạo mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
