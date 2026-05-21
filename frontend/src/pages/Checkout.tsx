import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RootState, AppDispatch } from "@/store";
import { clearCart } from "@/features/cart/cartSlice";
import { formatVND } from "./ProductList";
import { api } from "@/lib/api";

export function Checkout() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal } = useSelector((state: RootState) => state.cart);
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO">("COD");

  // Flow states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cấu hình định mức
  const SHIPPING_THRESHOLD = 1000000;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : 30000;
  const finalPrice = subtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sync cart to backend
      const syncedItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
      
      const syncResponse = await api.post("/api/v1/orders/cart/sync", {
        items: syncedItems,
      });
      
      const { cartId } = syncResponse.data.data;

      // 2. Place order
      const orderResponse = await api.post("/api/v1/orders", {
        cartId,
        recipientInfo: {
          fullName,
          phone,
          deliveryNote: address,
        },
        paymentMethod: paymentMethod === "MOMO" ? "MOMO" : "COD",
        note: giftNote,
      });

      const orderData = orderResponse.data.data;
      const orderId = orderData._id;

      // 3. Fetch associated payment record
      const paymentResponse = await api.get(`/api/v1/payments/order/${orderId}`);
      const payments = paymentResponse.data.data;
      if (!payments || payments.length === 0) {
        throw new Error("Không tìm thấy thông tin giao dịch thanh toán.");
      }
      const paymentId = payments[0]._id;

      // 4. Process payment strategy
      const processResponse = await api.post(`/api/v1/payments/${paymentId}/process`);
      const processResult = processResponse.data.data;

      if (paymentMethod === "MOMO") {
        if (processResult.redirectUrl) {
          navigate(processResult.redirectUrl);
        } else {
          throw new Error("Không thể tạo liên kết thanh toán MoMo.");
        }
      } else {
        dispatch(clearCart());
        navigate(`/order-success/${orderId}`);
      }
    } catch (err: any) {
      console.error("Checkout submit error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="glass-panel p-10 rounded-[32px] shadow-[0_10px_40px_rgba(49,27,146,0.06)] relative overflow-hidden">
            <h1 className="font-hero-display text-2xl font-bold text-deep-plum mb-4">Không có sản phẩm để thanh toán</h1>
            <p className="text-midnight-purple/80 mb-6">Hãy thêm bó hoa vào giỏ hàng trước khi tiếp tục nhé!</p>
            <Link to="/products" className="btn-hero-cta-gradient px-8 py-3 rounded-full font-bold">
              Khám Phá Hoa Tươi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-mist pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="font-hero-display text-4xl font-bold text-deep-plum">Xác Nhận Đặt Hàng</h1>
          <p className="text-dusk-gray text-sm mt-1">Vui lòng kiểm tra lại thông tin nhận hoa của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Delivery Form */}
          <div className="lg:col-span-7 space-y-6">
            
            <form onSubmit={handlePlaceOrder} className="glass-panel p-6 sm:p-8 rounded-[2rem] shadow-[0_10px_35px_rgba(49,27,146,0.04)] border-white/60 space-y-6">
              
              <h2 className="font-hero-display text-2xl font-bold text-deep-plum pb-3 border-b border-crystal-border/60 flex items-center gap-2">
                <MaterialIcon name="local_shipping" className="text-primary text-[24px]" />
                Thông tin giao hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full name input */}
                <div>
                  <label className="text-xs font-semibold text-dusk-gray block mb-1.5">Họ và tên người nhận</label>
                  <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
                    <MaterialIcon name="person" className="text-[18px] text-dusk-gray" />
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent text-sm text-deep-plum outline-none"
                    />
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label className="text-xs font-semibold text-dusk-gray block mb-1.5">Số điện thoại liên lạc</label>
                  <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
                    <MaterialIcon name="phone" className="text-[18px] text-dusk-gray" />
                    <input
                      type="tel"
                      required
                      placeholder="0901234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-sm text-deep-plum outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Address input */}
              <div>
                <label className="text-xs font-semibold text-dusk-gray block mb-1.5">Địa chỉ nhận hoa chính xác</label>
                <div className="flex items-start gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
                  <MaterialIcon name="location_on" className="text-[18px] text-dusk-gray mt-0.5" />
                  <textarea
                    required
                    rows={2}
                    placeholder="Số 1 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP. Hồ Chí Minh"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-transparent text-sm text-deep-plum outline-none resize-none"
                  />
                </div>
              </div>

              {/* Message Note input */}
              <div>
                <label className="text-xs font-semibold text-dusk-gray block mb-1.5">Lời nhắn ghi trên thiệp hoa (Mễn phí)</label>
                <div className="flex items-start gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
                  <MaterialIcon name="card_giftcard" className="text-[18px] text-dusk-gray mt-0.5" />
                  <textarea
                    rows={3}
                    placeholder="Chúc mừng sinh nhật mẹ kính yêu! Mong mẹ luôn tươi trẻ như những đóa hoa này."
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    className="w-full bg-transparent text-sm text-deep-plum outline-none resize-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-crystal-border/60">
                <label className="text-xs font-semibold text-dusk-gray block mb-3">Phương thức thanh toán</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* COD */}
                  <label
                    className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition ${
                      paymentMethod === "COD"
                        ? "bg-soft-amethyst/30 border-primary"
                        : "bg-pure-ivory/50 border-crystal-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="accent-primary"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                      <MaterialIcon name="local_atm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-deep-plum">Giao hàng nhận tiền (COD)</p>
                      <p className="text-xs text-dusk-gray mt-0.5">Thanh toán tiền mặt khi nhận hoa</p>
                    </div>
                  </label>

                  {/* MoMo Pay */}
                  <label
                    className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition ${
                      paymentMethod === "MOMO"
                        ? "bg-soft-amethyst/30 border-primary"
                        : "bg-pure-ivory/50 border-crystal-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === "MOMO"}
                      onChange={() => setPaymentMethod("MOMO")}
                      className="accent-primary"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500">
                      <MaterialIcon name="payment" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-deep-plum">Ví Điện Tử MoMo</p>
                      <p className="text-xs text-dusk-gray mt-0.5">Thanh toán qua Ví MoMo cực nhanh</p>
                    </div>
                  </label>

                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 flex items-center gap-2.5">
                  <MaterialIcon name="error" className="text-rose-500 text-[20px]" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-hero-cta-gradient py-4 rounded-full font-bold tracking-wide text-lg hover:-translate-y-0.5 transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-pure-ivory border-t-transparent"></div>
                    Đang thiết lập đơn hàng...
                  </>
                ) : (
                  <>
                    <MaterialIcon name="shopping_bag" />
                    Xác Nhận Đặt Hàng ({formatVND(finalPrice)})
                  </>
                )}
              </button>

            </form>

          </div>

          {/* Right Column: Order items summary review */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-panel p-6 rounded-[2rem] shadow-[0_10px_35px_rgba(49,27,146,0.04)] border-white/60">
              
              <h2 className="font-hero-display text-xl font-bold text-deep-plum pb-3 border-b border-crystal-border/60 mb-4 flex items-center gap-2">
                <MaterialIcon name="assignment" className="text-primary text-[20px]" />
                Đơn hàng tuyển chọn
              </h2>

              <ul className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3.5">
                    <div className="w-12 h-14 rounded-lg overflow-hidden border border-crystal-border bg-soft-amethyst/10 flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-deep-plum truncate">{item.name}</h4>
                      <p className="text-xs text-dusk-gray mt-0.5">SL: {item.quantity} × Kích cỡ {item.variantName}</p>
                    </div>
                    <span className="text-sm font-bold text-deep-plum">{formatVND(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="h-px bg-crystal-border/60 my-5"></div>

              {/* Price rows */}
              <div className="space-y-3.5 text-sm font-medium text-midnight-purple">
                <div className="flex justify-between">
                  <span className="text-dusk-gray">Tạm tính</span>
                  <span className="text-deep-plum font-semibold">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dusk-gray">Phí vận chuyển</span>
                  {shippingCost === 0 ? (
                    <span className="text-safe-mint font-semibold">Miễn phí</span>
                  ) : (
                    <span className="text-deep-plum font-semibold">{formatVND(shippingCost)}</span>
                  )}
                </div>
                <div className="h-px bg-crystal-border/40 my-1"></div>
                <div className="flex justify-between items-end">
                  <span className="text-deep-plum font-bold text-base">Tổng số tiền</span>
                  <span className="font-price-display font-bold text-xl text-primary">{formatVND(finalPrice)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>



    </div>
  );
}
