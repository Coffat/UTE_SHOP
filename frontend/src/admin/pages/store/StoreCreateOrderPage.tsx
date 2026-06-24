import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { fetchCustomers } from "../../services/adminCustomers.api";
import { fetchManagedProducts } from "../../services/productManagement.api";
import { createStoreOrder } from "../../services/storeOrders.api";
import { normalizeVietnamesePhone, isValidVietnameseMobilePhone } from "@/lib/phone";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  variantId: string;
}

interface LineItemRow {
  key: string;
  variantId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface CustomerOption {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

export function StoreCreateOrderPage() {
  const navigate = useNavigate();

  // Search Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  // Search Product
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // Form Data
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOMO">("CASH");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced Customer Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!customerSearch.trim()) {
        setCustomerOptions([]);
        return;
      }
      try {
        const { items } = await fetchCustomers({ search: customerSearch.trim(), limit: 5, page: 1 });
        setCustomerOptions(
          (items as any[]).map((item) => ({
            id: String(item.id ?? item._id),
            fullName: String(item.fullName ?? ""),
            phone: item.phone ? String(item.phone) : undefined,
            email: item.email ? String(item.email) : undefined,
          }))
        );
      } catch {
        setCustomerOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounced Product Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!productSearch.trim()) {
        setProductOptions([]);
        return;
      }
      try {
        const result = await fetchManagedProducts(
          { search: productSearch.trim(), limit: 8, page: 1, status: "ACTIVE" },
          "STORE_STAFF"
        );
        setProductOptions(
          result.items
            .filter((p) => p.stock > 0 && p.primaryVariantId)
            .map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.stock,
              variantId: p.primaryVariantId as string,
            }))
        );
      } catch {
        setProductOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.fullName);
    setCustomerOptions([]);
    setFullName(customer.fullName);
    if (customer.phone) {
      setPhone(normalizeVietnamesePhone(customer.phone));
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setFullName("");
    setPhone("");
  };

  const handleAddProduct = (product: ProductOption) => {
    setLineItems((prev) => {
      const existing = prev.find((item) => item.variantId === product.variantId);
      if (existing) {
        return prev.map((item) =>
          item.variantId === product.variantId
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [
        ...prev,
        {
          key: product.variantId,
          variantId: product.variantId,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
        },
      ];
    });
    setProductSearch("");
    setProductOptions([]);
  };

  const handleQuantityChange = (key: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((row) => (row.key === key ? { ...row, quantity: Math.max(1, qty) } : row))
    );
  };

  const handleRemoveProduct = (key: string) => {
    setLineItems((prev) => prev.filter((row) => row.key !== key));
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lineItems.length === 0) {
      setError("Vui lòng thêm ít nhất 1 sản phẩm.");
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      setError("Vui lòng nhập Tên và Số điện thoại khách hàng.");
      return;
    }

    const normalizedPhone = normalizeVietnamesePhone(phone);
    if (!isValidVietnameseMobilePhone(normalizedPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      await createStoreOrder({
        customerId: selectedCustomer?.id || null,
        items: lineItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        recipientInfo: {
          fullName: fullName.trim(),
          phone: normalizedPhone,
          deliveryNote: "Nhận tại cửa hàng",
        },
        paymentMethod,
        note,
      });
      alert("Tạo đơn hàng thành công!");
      navigate("/store/orders");
    } catch (err: unknown) {
      let message = "Không thể tạo đơn hàng. Vui lòng thử lại.";
      if (isAxiosError(err)) {
        message = (err.response?.data as { message?: string })?.message || message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h2 className="admin-page-title">Tạo đơn tại quầy</h2>
          <p className="admin-page-subtitle">Tạo đơn hàng bán trực tiếp tại cửa hàng</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Left Col: Products */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: "16px" }}>1. Chọn sản phẩm</h3>
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Tìm sản phẩm (Tên, SKU)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
            />
            {productOptions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#1e293b", border: "1px solid var(--adm-border)", borderRadius: "8px", zIndex: 10, overflow: "hidden" }}>
                {productOptions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#e2e8f0", cursor: "pointer" }}
                  >
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      SKU: {p.sku} • {p.price.toLocaleString("vi-VN")}đ • Tồn: {p.stock}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {lineItems.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", border: "1px dashed var(--adm-border)", borderRadius: "8px" }}>
                Chưa có sản phẩm nào
              </div>
            )}
            {lineItems.map((item) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: "14px" }}>{item.productName}</div>
                  <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px" }}>{item.unitPrice.toLocaleString("vi-VN")}đ</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.key, Number(e.target.value))}
                    style={{ width: "60px", padding: "6px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "6px", color: "#fff", outline: "none", textAlign: "center" }}
                  />
                  <div style={{ width: "90px", textAlign: "right", color: "#fff", fontWeight: 600 }}>
                    {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                  </div>
                  <button onClick={() => handleRemoveProduct(item.key)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>✖</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Customer & Payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="admin-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: "16px" }}>2. Khách hàng</h3>
            
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Tìm khách hàng (tuỳ chọn)..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (selectedCustomer) handleClearCustomer();
                }}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
              {customerOptions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#1e293b", border: "1px solid var(--adm-border)", borderRadius: "8px", zIndex: 10, overflow: "hidden" }}>
                  {customerOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#e2e8f0", cursor: "pointer" }}
                    >
                      <strong>{c.fullName}</strong> {c.phone ? `- ${c.phone}` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Họ tên khách *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: "16px" }}>3. Thanh toán</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Phương thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "MOMO")}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="MOMO">MoMo / Chuyển khoản (Xác nhận ngoài hệ thống)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Ghi chú đơn hàng</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: "1px solid var(--adm-border)", borderRadius: "8px", color: "#fff", outline: "none", resize: "vertical" }}
                />
              </div>
              
              <div style={{ margin: "16px 0", padding: "16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                  <span>Tổng cộng:</span>
                  <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              {error && <div style={{ color: "#ef4444", fontSize: "13px", padding: "8px", background: "rgba(239,68,68,0.1)", borderRadius: "6px" }}>{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="admin-btn admin-btn-primary"
                style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600, justifyContent: "center" }}
              >
                {submitting ? "Đang xử lý..." : "TẠO ĐƠN HÀNG"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
