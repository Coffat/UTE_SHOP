import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { isValidVietnameseMobilePhone, normalizeVietnamesePhone } from "@/lib/phone";
import { CrudModal, FormField, FormInput, FormSelect, FormTextarea } from "./AdminUI";
import { fetchCustomers, fetchCustomerById } from "../services/adminCustomers.api";
import { fetchManagedProducts } from "../services/productManagement.api";
import {
  createAdminOrder,
  previewAdminOrder,
  type AdminOrderLineItem,
  type AdminOrderPreviewResult,
} from "../services/adminOrders.api";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface CustomerOption {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  variantId: string;
}

interface LineItemRow extends AdminOrderLineItem {
  key: string;
  productName: string;
  unitPrice: number;
}

const EMPTY_PREVIEW: AdminOrderPreviewResult = {
  subTotal: 0,
  shippingFee: 0,
  voucherDiscount: 0,
  pointsDiscount: 0,
  finalTotal: 0,
  pointsUsed: 0,
};

export function CreateOrderModal({ isOpen, onClose, onCreated }: CreateOrderModalProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerPoints, setCustomerPoints] = useState(0);

  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [orderType, setOrderType] = useState<"ONLINE" | "AT_STORE">("AT_STORE");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CASH" | "MOMO" | "VNPAY">("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<number | "">("");
  const [pointsApplied, setPointsApplied] = useState(0);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const [preview, setPreview] = useState<AdminOrderPreviewResult>(EMPTY_PREVIEW);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setCustomerSearch("");
    setCustomerOptions([]);
    setSelectedCustomer(null);
    setCustomerPoints(0);
    setProductSearch("");
    setProductOptions([]);
    setLineItems([]);
    setFullName("");
    setPhone("");
    setDeliveryNote("");
    setOrderType("AT_STORE");
    setPaymentMethod("COD");
    setVoucherCode("");
    setVoucherApplied(false);
    setVoucherError(null);
    setPointsInput("");
    setPointsApplied(0);
    setPointsError(null);
    setNote("");
    setPreview(EMPTY_PREVIEW);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      if (!customerSearch.trim()) {
        setCustomerOptions([]);
        return;
      }
      try {
        const { items } = await fetchCustomers({ search: customerSearch.trim(), limit: 8, page: 1 });
        setCustomerOptions(
          (items as Record<string, unknown>[]).map((item) => ({
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
  }, [customerSearch, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      if (!productSearch.trim()) {
        setProductOptions([]);
        return;
      }
      try {
        const result = await fetchManagedProducts(
          { search: productSearch.trim(), limit: 8, page: 1, status: "ACTIVE" },
          "ADMIN"
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
  }, [productSearch, isOpen]);

  useEffect(() => {
    if (!selectedCustomer || lineItems.length === 0) {
      setPreview(EMPTY_PREVIEW);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await previewAdminOrder(
          {
            customerId: selectedCustomer.id,
            items: lineItems.map(({ variantId, quantity }) => ({ variantId, quantity })),
            voucherCode: voucherApplied ? voucherCode.trim() : undefined,
            pointsToUse: pointsApplied > 0 ? pointsApplied : undefined,
          },
          abortController.signal
        );
        if (!abortController.signal.aborted) {
          setPreview(result);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setPreview(EMPTY_PREVIEW);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [selectedCustomer, lineItems, voucherApplied, voucherCode, pointsApplied]);

  const handleSelectCustomer = async (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.fullName);
    setCustomerOptions([]);
    setFullName(customer.fullName);
    if (customer.phone) {
      setPhone(normalizeVietnamesePhone(customer.phone));
    }
    try {
      const detail = await fetchCustomerById(customer.id);
      const points = Number((detail as { points?: number }).points ?? 0);
      setCustomerPoints(points);
      if (!customer.phone && (detail as { phone?: string }).phone) {
        setPhone(normalizeVietnamesePhone(String((detail as { phone?: string }).phone)));
      }
    } catch {
      setCustomerPoints(0);
    }
  };

  const handleAddProduct = (product: ProductOption) => {
    if (!product.variantId) return;
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
          quantity: 1,
          productName: product.name,
          unitPrice: product.price,
        },
      ];
    });
    setProductSearch("");
    setProductOptions([]);
  };

  const maxPointsAllowed = Math.floor((preview.subTotal * 0.5) / 1000);
  const maxPointsCanUse = Math.min(customerPoints, maxPointsAllowed);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !selectedCustomer) return;
    setVoucherError(null);
    try {
      const response = await api.post("/api/v1/vouchers/validate", {
        code: voucherCode.trim(),
        orderTotal: preview.subTotal || lineItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      });
      if (response.data.success) {
        setVoucherApplied(true);
      } else {
        setVoucherError(response.data.message || "Mã không hợp lệ.");
      }
    } catch (err: unknown) {
      let message = "Mã giảm giá không hợp lệ hoặc đã hết hạn.";
      if (isAxiosError(err)) {
        message = (err.response?.data as { message?: string })?.message || message;
      }
      setVoucherError(message);
      setVoucherApplied(false);
    }
  };

  const handleApplyPoints = () => {
    setPointsError(null);
    const pts = Number(pointsInput);
    if (!pts || pts <= 0) {
      setPointsError("Vui lòng nhập số điểm hợp lệ.");
      return;
    }
    if (pts > customerPoints) {
      setPointsError(`Khách chỉ có ${customerPoints} điểm.`);
      return;
    }
    if (pts > maxPointsCanUse) {
      setPointsError(`Tối đa ${maxPointsCanUse} điểm cho đơn này.`);
      return;
    }
    setPointsApplied(pts);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomer) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !deliveryNote.trim()) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    const normalizedPhone = normalizeVietnamesePhone(phone);
    if (!isValidVietnameseMobilePhone(normalizedPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createAdminOrder({
        customerId: selectedCustomer.id,
        items: lineItems.map(({ variantId, quantity }) => ({ variantId, quantity })),
        recipientInfo: {
          fullName: fullName.trim(),
          phone: normalizedPhone,
          deliveryNote: deliveryNote.trim(),
        },
        orderType,
        paymentMethod,
        voucherCode: voucherApplied ? voucherCode.trim() : undefined,
        pointsToUse: pointsApplied > 0 ? pointsApplied : undefined,
        note: note.trim() || undefined,
      });

      const orderId = String(order._id ?? order.id ?? "");

      if (paymentMethod === "MOMO" || paymentMethod === "VNPAY") {
        const endpoint =
          paymentMethod === "MOMO" ? "/api/v1/payments/momo/create" : "/api/v1/payments/vnpay/create";
        const payResponse = await api.post(endpoint, { orderId });
        const payUrl = payResponse.data.data?.payUrl || payResponse.data.data?.paymentUrl;
        if (payUrl) {
          window.open(payUrl, "_blank", "noopener,noreferrer");
        }
      }

      onCreated();
      onClose();
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
    <CrudModal
      isOpen={isOpen}
      mode="create"
      title="Tạo đơn hàng"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Tạo đơn"
      size="lg"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {error && (
          <p style={{ margin: 0, color: "#f43f5e", fontSize: "13px" }}>{error}</p>
        )}

        <FormField label="Khách hàng" required>
          <FormInput
            placeholder="Tìm theo tên, email, SĐT..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              if (selectedCustomer && e.target.value !== selectedCustomer.fullName) {
                setSelectedCustomer(null);
                setCustomerPoints(0);
              }
            }}
          />
          {customerOptions.length > 0 && (
            <div
              style={{
                marginTop: "6px",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {customerOptions.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--adm-border)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <strong>{customer.fullName}</strong>
                  {customer.email ? ` · ${customer.email}` : ""}
                </button>
              ))}
            </div>
          )}
          {selectedCustomer && (
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Điểm khả dụng: {customerPoints.toLocaleString("vi-VN")}
            </p>
          )}
        </FormField>

        <FormField label="Sản phẩm" required>
          <FormInput
            placeholder="Tìm sản phẩm để thêm..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            disabled={!selectedCustomer}
          />
          {productOptions.length > 0 && (
            <div
              style={{
                marginTop: "6px",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {productOptions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAddProduct(product)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--adm-border)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {product.name} · {product.price.toLocaleString("vi-VN")}đ · Còn {product.stock}
                </button>
              ))}
            </div>
          )}
          {lineItems.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {lineItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ flex: 1, fontSize: "13px", color: "#e2e8f0" }}>{item.productName}</span>
                  <FormInput
                    type="number"
                    min={1}
                    value={item.quantity}
                    style={{ width: "72px" }}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value) || 1);
                      setLineItems((prev) =>
                        prev.map((row) =>
                          row.key === item.key ? { ...row, quantity: qty } : row
                        )
                      );
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setLineItems((prev) => prev.filter((row) => row.key !== item.key))}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#f43f5e",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FormField label="Người nhận" required>
            <FormInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </FormField>
          <FormField label="Số điện thoại" required>
            <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Địa chỉ giao hàng" required>
          <FormTextarea
            rows={2}
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
          />
        </FormField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FormField label="Loại đơn">
            <FormSelect
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as "ONLINE" | "AT_STORE")}
            >
              <option value="AT_STORE">Tại cửa hàng</option>
              <option value="ONLINE">Online</option>
            </FormSelect>
          </FormField>
          <FormField label="Thanh toán" required>
            <FormSelect
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            >
              <option value="COD">COD</option>
              <option value="CASH">Tiền mặt</option>
              <option value="MOMO">MoMo</option>
              <option value="VNPAY">VNPay</option>
            </FormSelect>
          </FormField>
        </div>

        <FormField label="Mã giảm giá">
          <div style={{ display: "flex", gap: "8px" }}>
            <FormInput
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value);
                setVoucherApplied(false);
                setVoucherError(null);
              }}
              disabled={!selectedCustomer}
            />
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleApplyVoucher}
              disabled={!selectedCustomer || !voucherCode.trim()}
            >
              Áp dụng
            </button>
          </div>
          {voucherError && <p style={{ margin: "4px 0 0", color: "#f43f5e", fontSize: "12px" }}>{voucherError}</p>}
        </FormField>

        <FormField label="Điểm thưởng">
          <div style={{ display: "flex", gap: "8px" }}>
            <FormInput
              type="number"
              min={0}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={!selectedCustomer}
            />
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleApplyPoints}
              disabled={!selectedCustomer}
            >
              Dùng điểm
            </button>
          </div>
          {pointsError && <p style={{ margin: "4px 0 0", color: "#f43f5e", fontSize: "12px" }}>{pointsError}</p>}
        </FormField>

        <FormField label="Ghi chú">
          <FormTextarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>

        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            fontSize: "13px",
            color: "#e2e8f0",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Tổng đơn {previewLoading ? "(đang tính...)" : ""}</p>
          <p style={{ margin: "2px 0" }}>Tạm tính: {preview.subTotal.toLocaleString("vi-VN")}đ</p>
          <p style={{ margin: "2px 0" }}>Phí ship: {preview.shippingFee.toLocaleString("vi-VN")}đ</p>
          <p style={{ margin: "2px 0" }}>Giảm voucher: -{preview.voucherDiscount.toLocaleString("vi-VN")}đ</p>
          <p style={{ margin: "2px 0" }}>Giảm điểm: -{preview.pointsDiscount.toLocaleString("vi-VN")}đ</p>
          <p style={{ margin: "8px 0 0", fontWeight: 700, color: "#fff" }}>
            Thanh toán: {preview.finalTotal.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>
    </CrudModal>
  );
}
