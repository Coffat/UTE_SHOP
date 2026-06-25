import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMaterials, importStock, fetchRecipeByVariant, type MaterialItem, type RecipeItem } from "../../services/warehouse.api";
import { fetchManagedProducts } from "../../services/productManagement.api";
import type { AdminProductRow } from "../../services/mappers/product.mapper";
import { useAdminAuth } from "../../context/AdminAuthContext";

type ItemType = "material" | "variant";

interface FormState {
  itemType: ItemType;
  materialId: string;
  isNewMaterial: boolean;
  newMaterialName: string;
  newMaterialUnit: string;
  variantId: string;
  quantity: string;
  unitPrice: string;
  totalCost: string;
  reason: string;
}

const INITIAL_FORM: FormState = {
  itemType: "material",
  materialId: "",
  isNewMaterial: false,
  newMaterialName: "",
  newMaterialUnit: "",
  variantId: "",
  quantity: "",
  unitPrice: "",
  totalCost: "",
  reason: "",
};

type ToastType = "success" | "error";
interface Toast { type: ToastType; message: string }

export function WarehouseImportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // BOM State
  const [producedFromMaterials, setProducedFromMaterials] = useState(false);
  const [recipe, setRecipe] = useState<RecipeItem | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const { user } = useAdminAuth(); // Import useAdminAuth from context/AdminAuthContext

  useEffect(() => {
    if (!user) return;
    setLoadingMaterials(true);
    setLoadingProducts(true);
    Promise.all([
      fetchMaterials().then(setMaterials),
      fetchManagedProducts({ limit: 1000 }, user.role).then(res => setProducts(res.items))
    ])
    .catch(() => showToast("error", "Không thể tải dữ liệu danh mục"))
    .finally(() => {
      setLoadingMaterials(false);
      setLoadingProducts(false);
    });
  }, [showToast, user]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadRecipe = async () => {
    if (!form.variantId.trim()) {
      showToast("error", "Vui lòng nhập Variant ID để tải công thức");
      return;
    }
    setLoadingRecipe(true);
    setRecipe(null);
    setOverrides({});
    try {
      const data = await fetchRecipeByVariant(form.variantId.trim());
      setRecipe(data);
      showToast("success", "Tải công thức thành công");
    } catch (err) {
      showToast("error", "Không tìm thấy công thức cho thành phẩm này");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleOverrideChange = (materialId: string, val: string) => {
    setOverrides(prev => ({ ...prev, [materialId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.quantity || Number(form.quantity) <= 0) {
      showToast("error", "Số lượng phải lớn hơn 0");
      return;
    }
    if (form.itemType === "material") {
      if (!form.isNewMaterial && !form.materialId) {
        showToast("error", "Vui lòng chọn nguyên liệu");
        return;
      }
      if (form.isNewMaterial && !form.newMaterialName.trim()) {
        showToast("error", "Vui lòng nhập tên nguyên liệu mới");
        return;
      }
    }
    if (form.itemType === "variant") {
      if (!form.variantId.trim()) {
        showToast("error", "Vui lòng chọn thành phẩm");
        return;
      }
      if (producedFromMaterials && !recipe) {
        showToast("error", "Vui lòng tải công thức BOM trước khi nhập");
        return;
      }
    }

    setSubmitting(true);
    try {
      let overrideList: Array<{ materialId: string; amount: number }> | undefined = undefined;
      if (form.itemType === "variant" && producedFromMaterials && recipe) {
        overrideList = [];
        for (const [matId, val] of Object.entries(overrides)) {
          if (val !== "" && !isNaN(Number(val))) {
            overrideList.push({ materialId: matId, amount: Number(val) });
          }
        }
      }

      const payload: any = {
        quantity: Number(form.quantity),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        totalCost: form.totalCost ? Number(form.totalCost) : undefined,
        reason: form.reason || "Nhập kho thủ công",
        producedFromMaterials: form.itemType === "variant" ? producedFromMaterials : undefined,
        overrides: overrideList,
      };

      if (form.itemType === "material") {
        if (form.isNewMaterial) {
          payload.newMaterialName = form.newMaterialName.trim();
          payload.newMaterialUnit = form.newMaterialUnit.trim();
        } else {
          payload.materialId = form.materialId;
        }
      } else {
        payload.variantId = form.variantId.trim();
      }

      await importStock(payload);
      
      showToast("success", "✅ Nhập kho thành công!");
      setForm(INITIAL_FORM);
      setRecipe(null);
      setOverrides({});
      setProducedFromMaterials(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Đã xảy ra lỗi khi nhập kho";
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          padding: "14px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 500,
          background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          color: toast.type === "success" ? "#10b981" : "#ef4444",
          border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Nhập kho</h2>
          <p className="admin-page-subtitle">Tạo phiếu nhập nguyên liệu hoặc sản xuất thành phẩm</p>
        </div>
        <button
          onClick={() => navigate("/warehouse/transactions")}
          className="admin-btn admin-btn-ghost"
          style={{ border: "1px solid var(--adm-border)", padding: "9px 16px", borderRadius: "8px", fontSize: "13px", color: "var(--adm-text-dim)", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
        >
          Xem lịch sử
        </button>
      </div>

      <div style={{ width: "100%", paddingBottom: "40px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Form chính */}
        <div className="admin-card" style={{ padding: "32px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px", minHeight: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 24px 0" }}>Thông tin phiếu nhập</h3>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px", flex: 1 }}>
            
            {/* Hàng 1: Phân loại & Chọn hàng */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
              {/* Loại hàng hóa */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Loại hàng hóa</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {(["material", "variant"] as const).map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => {
                        handleChange("itemType", t);
                        if (t === "material") setProducedFromMaterials(false);
                      }}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${form.itemType === t ? "rgba(99,102,241,0.4)" : "var(--adm-border)"}`,
                        background: form.itemType === t ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                        color: form.itemType === t ? "#818cf8" : "var(--adm-text-dim)",
                        fontSize: "13.5px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {t === "material" ? "Nguyên liệu" : "Thành phẩm"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn hàng hóa */}
              <div>
              {form.itemType === "material" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)" }}>Nguyên liệu *</label>
                    <label style={{ fontSize: "13px", color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input 
                        type="checkbox" 
                        checked={form.isNewMaterial} 
                        onChange={e => setForm(prev => ({ ...prev, isNewMaterial: e.target.checked, newMaterialName: "", newMaterialUnit: "" }))}
                        style={{ accentColor: "#6366f1", width: "16px", height: "16px" }}
                      />
                      Nhập nguyên liệu mới
                    </label>
                  </div>

                  {form.isNewMaterial ? (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flex: 2 }}>
                        <input 
                          type="text" 
                          placeholder="Tên nguyên liệu mới (VD: Hoa hồng bạch)" 
                          value={form.newMaterialName}
                          onChange={e => handleChange("newMaterialName", e.target.value)}
                          required
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          placeholder="ĐVT (VD: Bông)" 
                          value={form.newMaterialUnit}
                          onChange={e => handleChange("newMaterialUnit", e.target.value)}
                          required
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  ) : (
                    loadingMaterials ? (
                      <div style={{ color: "var(--adm-text-dim)", fontSize: "13px", padding: "10px 0" }}>Đang tải...</div>
                    ) : (
                      <select
                        value={form.materialId}
                        onChange={(e) => handleChange("materialId", e.target.value)}
                        required
                        className="admin-form-select"
                        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: form.materialId ? "#e2e8f0" : "var(--adm-text-dim)", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", cursor: "pointer", boxSizing: "border-box" }}
                      >
                        <option value="" style={{ background: "#0d1526" }}>-- Chọn nguyên liệu --</option>
                        {materials.map((m) => (
                          <option key={m._id} value={m._id} style={{ background: "#0d1526" }}>
                            {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    )
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)" }}>Thành phẩm *</label>
                    <label style={{ fontSize: "13px", color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input 
                        type="checkbox" 
                        checked={producedFromMaterials} 
                        onChange={e => setProducedFromMaterials(e.target.checked)}
                        style={{ accentColor: "#6366f1", width: "16px", height: "16px" }} 
                      />
                      Sản xuất từ Nguyên liệu (Dựa theo Recipe)
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      {loadingProducts ? (
                        <div style={{ color: "var(--adm-text-dim)", fontSize: "13px", padding: "10px 0" }}>Đang tải...</div>
                      ) : (
                        <select
                          value={form.variantId}
                          onChange={(e) => handleChange("variantId", e.target.value)}
                          required
                          className="admin-form-select"
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: form.variantId ? "#e2e8f0" : "var(--adm-text-dim)", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", cursor: "pointer", boxSizing: "border-box" }}
                        >
                          <option value="" style={{ background: "#0d1526" }}>-- Chọn thành phẩm --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.primaryVariantId || ""} disabled={!p.primaryVariantId} style={{ background: "#0d1526" }}>
                              {p.name} {p.sku ? `(${p.sku})` : ''} {!p.primaryVariantId ? '(Chưa có Variant)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {producedFromMaterials && (
                      <button 
                        type="button" onClick={loadRecipe} disabled={loadingRecipe}
                        style={{ padding: "0 20px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", cursor: loadingRecipe ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500 }}
                      >
                        {loadingRecipe ? "..." : "Tải BOM"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Hàng 3: Số lượng và Giá */}
            <div style={{ display: "grid", gridTemplateColumns: producedFromMaterials ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Số lượng nhập *</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.quantity}
                  onChange={(e) => {
                    const newQty = e.target.value;
                    handleChange("quantity", newQty);
                    if (newQty && form.unitPrice) {
                      handleChange("totalCost", (Number(form.unitPrice) * Number(newQty)).toString());
                    } else if (newQty && form.totalCost) {
                      handleChange("unitPrice", (Number(form.totalCost) / Number(newQty)).toFixed(0));
                    }
                  }}
                  placeholder="0"
                  required
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
                />
              </div>

              {(!producedFromMaterials) && (
                <>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Đơn giá (VNĐ)</label>
                    <input
                      type="number" min="0" step="1000"
                      value={form.unitPrice}
                      onChange={(e) => {
                        handleChange("unitPrice", e.target.value);
                        if (e.target.value && form.quantity) {
                          handleChange("totalCost", (Number(e.target.value) * Number(form.quantity)).toString());
                        }
                      }}
                      placeholder="0"
                      style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Tổng tiền (VNĐ)</label>
                    <input
                      type="number" min="0" step="1000"
                      value={form.totalCost}
                      onChange={(e) => {
                        handleChange("totalCost", e.target.value);
                        if (e.target.value && form.quantity) {
                          handleChange("unitPrice", (Number(e.target.value) / Number(form.quantity)).toFixed(0));
                        }
                      }}
                      placeholder="0"
                      style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                </>
              )}
            </div>

                {/* Preview BOM trải dài */}
                {producedFromMaterials && recipe && form.quantity && Number(form.quantity) > 0 && (
                  <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "20px", marginTop: "4px" }}>
                    <h4 style={{ fontSize: "14px", margin: "0 0 16px 0", color: "#818cf8", fontWeight: 600 }}>Dự toán Nguyên liệu tiêu hao (Preview BOM)</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "12px", color: "var(--adm-text-dim)", textAlign: "left" }}>
                          <th style={{ padding: "8px" }}>Nguyên liệu</th>
                          <th style={{ padding: "8px" }}>Định mức / Đơn vị</th>
                          <th style={{ padding: "8px" }}>Hao hụt</th>
                          <th style={{ padding: "8px" }}>Tiêu chuẩn</th>
                          <th style={{ padding: "8px" }}>Ghi đè (Thực tế)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.ingredients.map((ing) => {
                          const matId = ing.material._id;
                          const baseAmt = typeof ing.amount === "object" ? Number((ing.amount as any).$numberDecimal) : Number(ing.amount);
                          const wp = typeof ing.wastePercent === "object" ? Number((ing.wastePercent as any).$numberDecimal) : Number(ing.wastePercent);
                          const qty = Number(form.quantity);
                          const stdReq = (baseAmt * qty) * (1 + wp / 100);

                          return (
                            <tr key={matId} style={{ fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                              <td style={{ padding: "10px 8px", color: "#e2e8f0" }}>{ing.material.name}</td>
                              <td style={{ padding: "10px 8px", color: "var(--adm-text-dim)" }}>{baseAmt} {ing.material.unit}</td>
                              <td style={{ padding: "10px 8px", color: "#f87171" }}>{wp}%</td>
                              <td style={{ padding: "10px 8px", color: "#34d399", fontWeight: 600 }}>{stdReq.toFixed(2)}</td>
                              <td style={{ padding: "10px 8px" }}>
                                <input 
                                  type="number" min="0" step="0.01"
                                  value={overrides[matId] !== undefined ? overrides[matId] : ""}
                                  onChange={e => handleOverrideChange(matId, e.target.value)}
                                  placeholder={stdReq.toFixed(2)}
                                  style={{ width: "100px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "6px 10px", color: "#fff", outline: "none", fontSize: "13px" }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "var(--adm-text-dim)" }}>* Cột tiêu chuẩn = Định mức x Số lượng x (1 + Hao hụt/100). Nhập giá trị vào ô Ghi đè nếu thực tế dùng khác đi.</p>
                  </div>
                )}

                {/* Lý do */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Ghi chú / Lý do nhập</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                    placeholder="VD: Nhập hàng tuần, Bổ sung cho dịp lễ 8/3..."
                    maxLength={255}
                    style={{ flex: 1, minHeight: "100px", width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "12px 14px", fontSize: "14px", boxSizing: "border-box", outline: "none", resize: "none", fontFamily: "inherit" }}
                  />
                </div>
                
            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="submit" disabled={submitting}
                style={{
                  padding: "12px 24px", borderRadius: "8px", border: "none", cursor: submitting ? "not-allowed" : "pointer",
                  background: submitting ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff", fontSize: "14px", fontWeight: 600,
                  boxShadow: submitting ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
                  transition: "all 0.2s",
                  minWidth: "200px"
                }}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận nhập kho"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
