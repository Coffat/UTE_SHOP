import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMaterials, importStock, type MaterialItem } from "../../services/warehouse.api";

// Lấy warehouseId mặc định từ env hoặc dùng hardcode placeholder (1 kho duy nhất)
const DEFAULT_WAREHOUSE_ID = import.meta.env.VITE_DEFAULT_WAREHOUSE_ID || "";

type ItemType = "material" | "variant";

interface FormState {
  itemType: ItemType;
  materialId: string;
  variantId: string;
  quantity: string;
  reason: string;
}

const INITIAL_FORM: FormState = {
  itemType: "material",
  materialId: "",
  variantId: "",
  quantity: "",
  reason: "",
};

type ToastType = "success" | "error";
interface Toast { type: ToastType; message: string }

export function WarehouseImportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [warehouseId, setWarehouseId] = useState(DEFAULT_WAREHOUSE_ID);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetchMaterials()
      .then(setMaterials)
      .catch(() => showToast("error", "Không thể tải danh sách nguyên liệu"))
      .finally(() => setLoadingMaterials(false));
  }, [showToast]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId.trim()) {
      showToast("error", "Chưa cấu hình Warehouse ID. Vui lòng liên hệ Admin.");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      showToast("error", "Số lượng phải lớn hơn 0");
      return;
    }
    if (form.itemType === "material" && !form.materialId) {
      showToast("error", "Vui lòng chọn nguyên liệu");
      return;
    }
    if (form.itemType === "variant" && !form.variantId.trim()) {
      showToast("error", "Vui lòng nhập Variant ID");
      return;
    }

    setSubmitting(true);
    try {
      await importStock({
        warehouseId,
        ...(form.itemType === "material" ? { materialId: form.materialId } : { variantId: form.variantId.trim() }),
        quantity: Number(form.quantity),
        reason: form.reason || "Nhập kho thủ công",
      });
      showToast("success", "✅ Nhập kho thành công!");
      setForm(INITIAL_FORM);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Đã xảy ra lỗi khi nhập kho";
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
          <p className="admin-page-subtitle">Tạo phiếu nhập nguyên liệu hoặc thành phẩm vào kho</p>
        </div>
        <button
          onClick={() => navigate("/warehouse/transactions")}
          className="admin-btn admin-btn-ghost"
          style={{ border: "1px solid var(--adm-border)", padding: "9px 16px", borderRadius: "8px", fontSize: "13px", color: "var(--adm-text-dim)", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
        >
          Xem lịch sử
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        {/* Form chính */}
        <div className="admin-card" style={{ padding: "28px", background: "rgba(13,21,38,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--adm-border)", borderRadius: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: "0 0 24px 0" }}>Thông tin phiếu nhập</h3>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Loại hàng */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Loại hàng hóa</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {(["material", "variant"] as const).map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => handleChange("itemType", t)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${form.itemType === t ? "rgba(99,102,241,0.4)" : "var(--adm-border)"}`,
                      background: form.itemType === t ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                      color: form.itemType === t ? "#818cf8" : "var(--adm-text-dim)",
                      fontSize: "13.5px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {t === "material" ? "🌿 Nguyên liệu" : "📦 Thành phẩm"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn hàng */}
            {form.itemType === "material" ? (
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Nguyên liệu *</label>
                {loadingMaterials ? (
                  <div style={{ color: "var(--adm-text-dim)", fontSize: "13px" }}>Đang tải...</div>
                ) : (
                  <select
                    value={form.materialId}
                    onChange={(e) => handleChange("materialId", e.target.value)}
                    required
                    className="admin-form-select"
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: form.materialId ? "#e2e8f0" : "var(--adm-text-dim)", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", cursor: "pointer" }}
                  >
                    <option value="" style={{ background: "#0d1526" }}>-- Chọn nguyên liệu --</option>
                    {materials.map((m) => (
                      <option key={m._id} value={m._id} style={{ background: "#0d1526" }}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Variant ID *</label>
                <input
                  type="text"
                  value={form.variantId}
                  onChange={(e) => handleChange("variantId", e.target.value)}
                  placeholder="Nhập MongoDB ObjectId của ProductVariant"
                  required
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
                <p style={{ fontSize: "11px", color: "var(--adm-text-dim)", marginTop: "6px", margin: "6px 0 0 0" }}>
                  Tìm Variant ID trong trang Sản phẩm → chi tiết sản phẩm
                </p>
              </div>
            )}

            {/* Số lượng */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Số lượng nhập *</label>
              <input
                type="number" min="0.01" step="0.01"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="0"
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "16px", fontWeight: 600, boxSizing: "border-box", outline: "none" }}
              />
            </div>

            {/* Lý do */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--adm-text-dim)", display: "block", marginBottom: "8px" }}>Ghi chú / Lý do nhập</label>
              <textarea
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="VD: Nhập hàng tuần, Bổ sung cho dịp lễ 8/3..."
                rows={3}
                maxLength={255}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "13.5px", boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={submitting}
              style={{
                padding: "12px", borderRadius: "8px", border: "none", cursor: submitting ? "not-allowed" : "pointer",
                background: submitting ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#fff", fontSize: "14px", fontWeight: 600,
                boxShadow: submitting ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Đang xử lý..." : "✅ Xác nhận nhập kho"}
            </button>
          </form>
        </div>

        {/* Hướng dẫn */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="admin-card" style={{ padding: "20px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#818cf8", margin: "0 0 12px 0" }}>💡 Hướng dẫn nhập kho</h4>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12.5px", color: "var(--adm-text-dim)", lineHeight: 1.7 }}>
              <li>Chọn <strong style={{ color: "#fb923c" }}>Nguyên liệu</strong> cho hoa tươi, dây buộc, giấy gói...</li>
              <li>Chọn <strong style={{ color: "#818cf8" }}>Thành phẩm</strong> cho sản phẩm đã đóng gói sẵn</li>
              <li>Số lượng nhập sẽ được cộng vào tồn kho hiện tại</li>
              <li>Giao dịch sẽ được ghi lại trong lịch sử</li>
            </ul>
          </div>

          <div className="admin-card" style={{ padding: "20px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b", margin: "0 0 12px 0" }}>⚙️ Cấu hình</h4>
            <div>
              <label style={{ fontSize: "12px", color: "var(--adm-text-dim)", display: "block", marginBottom: "6px" }}>Warehouse ID</label>
              <input
                type="text" value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="MongoDB ObjectId của kho"
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--adm-border)", color: "#e2e8f0", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }}
              />
              <p style={{ fontSize: "11px", color: "var(--adm-text-dim)", marginTop: "4px", margin: "4px 0 0 0" }}>
                Hoặc cấu hình VITE_DEFAULT_WAREHOUSE_ID trong .env
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
