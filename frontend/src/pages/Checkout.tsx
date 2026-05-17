import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RootState, AppDispatch } from "@/store";
import { clearCart } from "@/features/cart/cartSlice";
import { formatVND } from "./ProductList";

export function Checkout() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal } = useSelector((state: RootState) => state.cart);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "QR">("COD");

  // Flow states
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  // Cấu hình định mức
  const SHIPPING_THRESHOLD = 1000000;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : 30000;
  const finalPrice = subtotal + shippingCost;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    setLoading(true);
    const code = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderCode(code);

    setTimeout(() => {
      setLoading(false);
      if (paymentMethod === "QR") {
        setShowQRModal(true);
      } else {
        setOrderSuccess(true);
        dispatch(clearCart());
      }
    }, 1500);
  };

  const handleConfirmQRTransfer = () => {
    setShowQRModal(false);
    setOrderSuccess(true);
    dispatch(clearCart());
  };

  // Nếu đặt hàng thành công, hiển thị trang hoàn tất rực rỡ
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="glass-panel p-10 rounded-[32px] shadow-[0_15px_50px_rgba(49,27,146,0.08)] relative overflow-hidden">
            <div className="absolute inset-0 bg-dreamy-purple/5 blur-[60px] rounded-full scale-75 -z-10"></div>
            
            {/* Green glowing tick */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.2)] animate-pulse">
              <MaterialIcon name="check" className="text-[44px]" />
            </div>

            <h1 className="font-hero-display text-3xl font-bold text-deep-plum mb-3">Đặt Hàng Thành Công!</h1>
            <p className="text-sm font-semibold text-primary mb-6">Mã đơn hàng: {orderCode}</p>

            <div className="glass-panel p-5 rounded-2xl bg-white/40 text-left text-sm text-midnight-purple leading-relaxed space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Người nhận:</span>
                <span className="font-semibold text-deep-plum">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Số điện thoại:</span>
                <span className="font-semibold text-deep-plum">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Địa chỉ giao:</span>
                <span className="font-semibold text-deep-plum text-right max-w-[280px] truncate">{address}</span>
              </div>
              {giftNote && (
                <div className="border-t border-crystal-border/60 pt-2 mt-2">
                  <span className="text-dusk-gray font-medium block mb-1">Lời chúc thiệp kèm theo:</span>
                  <span className="italic text-deep-plum/90 font-medium">"{giftNote}"</span>
                </div>
              )}
            </div>

            <p className="text-dusk-gray text-xs mb-8">
              Cảm ơn quý khách đã tin tưởng UTE_SHOP. Bó hoa của quý khách đang được thợ hoa chuẩn bị tỉ mỉ để giao đến nhanh nhất!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 btn-hero-cta-gradient px-8 py-3 rounded-full font-bold tracking-wide transition hover:-translate-y-0.5 shadow-md"
              >
                <MaterialIcon name="shopping_basket" />
                Tiếp Tục Mua Sắm
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 bg-white/70 hover:bg-white border border-crystal-border px-8 py-3 rounded-full font-bold text-midnight-purple transition"
              >
                Trang Chủ
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Nếu giỏ hàng trống và chưa hoàn tất đặt hàng
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

                  {/* QR Pay */}
                  <label
                    className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition ${
                      paymentMethod === "QR"
                        ? "bg-soft-amethyst/30 border-primary"
                        : "bg-pure-ivory/50 border-crystal-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === "QR"}
                      onChange={() => setPaymentMethod("QR")}
                      className="accent-primary"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                      <MaterialIcon name="qr_code" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-deep-plum">Chuyển khoản (VietQR)</p>
                      <p className="text-xs text-dusk-gray mt-0.5">Quét mã nhận diện tự động lập tức</p>
                    </div>
                  </label>

                </div>
              </div>

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

      {/* Dynamic simulated bank QR pay Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-plum/40 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-[2rem] shadow-[0_20px_60px_rgba(49,27,146,0.15)] border-white/90 text-center animate-fade-in relative">
            
            <h3 className="font-hero-display text-2xl font-bold text-deep-plum mb-1">Quét Mã Chuyển Khoản</h3>
            <p className="text-xs text-dusk-gray mb-6">Mã nhận diện tự động VietQR (MB Bank)</p>

            {/* Standard simulated VietQR image box */}
            <div className="glass-panel p-4 bg-white rounded-2xl inline-block mb-6 shadow-inner border border-crystal-border/40">
              <div className="relative">
                {/* Simulated QR Code box */}
                <div className="w-56 h-56 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-primary/25 relative overflow-hidden">
                  <MaterialIcon name="qr_code_2" className="text-[120px] text-deep-plum/90 opacity-95" />
                  
                  {/* Glowing scan line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/60 shadow-[0_0_10px_rgba(139,107,255,0.8)] animate-bounce" style={{ animationDuration: '3.5s' }}></div>

                  {/* Mini center MB Logo icon */}
                  <div className="absolute inset-0 m-auto w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[11px] font-black border-2 border-white shadow-md">
                    MB
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="bg-pure-ivory/80 rounded-2xl p-4 text-left text-xs text-midnight-purple leading-relaxed mb-6 space-y-2.5 border border-crystal-border/40">
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Ngân hàng:</span>
                <span className="font-bold text-deep-plum">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Số tài khoản:</span>
                <span className="font-bold text-deep-plum tracking-wider">19024042404</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Chủ tài khoản:</span>
                <span className="font-bold text-deep-plum">UTE SHOP FLOWER BOUTIQUE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Số tiền:</span>
                <span className="font-bold text-primary text-sm">{formatVND(finalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-medium">Nội dung chuyển khoản:</span>
                <span className="font-bold text-[#059669] select-all bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {orderCode}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-dusk-gray mb-6 leading-relaxed">
              * Vui lòng chuyển chính xác số tiền và nội dung chuyển khoản ở trên để đơn hàng được duyệt tự động ngay lập tức.
            </p>

            {/* Confirmation actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmQRTransfer}
                className="w-full btn-hero-cta-gradient py-3 rounded-full font-bold tracking-wide transition hover:brightness-105"
              >
                Tôi Đã Chuyển Khoản
              </button>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-full text-xs font-semibold text-dusk-gray hover:text-deep-plum py-2"
              >
                Hủy & Quay lại sửa thông tin
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
