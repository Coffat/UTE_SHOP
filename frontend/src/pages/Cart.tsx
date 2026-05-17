import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RootState, AppDispatch } from "@/store";
import { updateQuantity, removeFromCart, clearCart } from "@/features/cart/cartSlice";
import { formatVND } from "./ProductList";
import { useState } from "react";

export function Cart() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal } = useSelector((state: RootState) => state.cart);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Cấu hình giao hàng
  const SHIPPING_THRESHOLD = 1000000; // Miễn phí ship từ 1.000.000đ
  const SHIPPING_FEE = 30000;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const finalPrice = subtotal + shippingCost - (promoApplied ? 50000 : 0);

  const progressPercentage = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);
  const dynamicRemaining = SHIPPING_THRESHOLD - subtotal;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "UTESHOPNEW") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      setPromoApplied(false);
    }
  };

  const handleUpdateQty = (productId: string, variantId: string, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty > 0 && newQty <= stock) {
      dispatch(updateQuantity({ productId, variantId, quantity: newQty }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="glass-panel p-10 rounded-[32px] shadow-[0_10px_40px_rgba(49,27,146,0.06)] relative overflow-hidden">
            <div className="absolute inset-0 bg-dreamy-purple/5 blur-[50px] rounded-full scale-75 -z-10"></div>
            
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-soft-amethyst/30 text-primary">
              <MaterialIcon name="shopping_bag" className="text-[48px]" />
            </div>

            <h1 className="font-hero-display text-3xl font-bold text-deep-plum mb-4">Giỏ hàng đang trống</h1>
            <p className="text-midnight-purple/80 mb-8 max-w-sm mx-auto">
              Có vẻ như bạn chưa chọn đóa hoa tươi thắm nào. Hãy khám phá bộ sưu tập của chúng tôi nhé!
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 btn-hero-cta-gradient px-8 py-3.5 rounded-full font-bold tracking-wide shadow-md transition hover:-translate-y-0.5"
            >
              <MaterialIcon name="explore" />
              Khám Phá Cửa Hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-mist pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-hero-display text-4xl font-bold text-deep-plum">Giỏ Hàng Của Bạn</h1>
            <p className="text-dusk-gray text-sm mt-1">Đang chọn {items.length} đóa hoa thơm ngát</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="flex items-center gap-1.5 self-start text-xs font-semibold text-dusk-gray hover:text-error transition bg-white/50 px-3.5 py-2 rounded-full border border-crystal-border"
          >
            <MaterialIcon name="delete_sweep" className="text-[16px]" />
            Xóa Toàn Bộ Giỏ Hàng
          </button>
        </div>

        {/* Progress Alert for Free Shipping */}
        {subtotal < SHIPPING_THRESHOLD ? (
          <div className="glass-panel p-5 rounded-2xl mb-8 flex flex-col gap-3 shadow-[0_5px_20px_rgba(49,27,146,0.03)] border-white/80">
            <div className="flex justify-between items-center text-sm font-semibold text-deep-plum">
              <span className="flex items-center gap-2 text-primary">
                <MaterialIcon name="local_shipping" />
                Mua thêm {formatVND(dynamicRemaining)} để được MIỄN PHÍ vận chuyển!
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2.5 bg-pure-ivory/80 rounded-full overflow-hidden border border-crystal-border/40">
              <div
                className="h-full login-gradient-bg transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-4 rounded-2xl mb-8 flex items-center gap-3 bg-emerald-50/50 border-[#059669]/20 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#059669]">
              <MaterialIcon name="done" className="text-[18px]" />
            </div>
            <span className="text-sm font-semibold text-[#065f46]">
              Tuyệt vời! Đơn hàng của bạn đã đạt điều kiện MIỄN PHÍ vận chuyển toàn quốc.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart items list */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="glass-panel p-4 sm:p-5 rounded-2xl flex gap-4 sm:gap-6 items-center shadow-[0_5px_20px_rgba(49,27,146,0.02)] border-white/60"
              >
                
                {/* Product Thumbnail */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-crystal-border flex-shrink-0 bg-soft-amethyst/20">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info and Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-deep-plum text-base sm:text-lg truncate hover:text-primary transition">
                        <Link to={`/product/${item.productId}`}>{item.name}</Link>
                      </h3>
                      <p className="text-xs text-dusk-gray mt-0.5">Kích thước: {item.variantName}</p>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                      className="text-dusk-gray hover:text-error transition p-1.5 hover:bg-pure-ivory/80 rounded-full"
                    >
                      <MaterialIcon name="close" className="text-[18px]" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-pure-ivory/80 rounded-full px-2 py-1 border border-crystal-border">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity, -1, item.stock)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition"
                        disabled={item.quantity <= 1}
                      >
                        <MaterialIcon name="remove" className="text-[16px]" />
                      </button>
                      <span className="font-price-display font-semibold w-5 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity, 1, item.stock)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition"
                        disabled={item.quantity >= item.stock}
                      >
                        <MaterialIcon name="add" className="text-[16px]" />
                      </button>
                    </div>

                    {/* Price and Total Price */}
                    <div className="flex flex-col items-end">
                      <span className="font-price-display font-bold text-deep-plum text-base">
                        {formatVND(item.price * item.quantity)}
                      </span>
                      <span className="text-xs text-dusk-gray">Đơn giá: {formatVND(item.price)}</span>
                    </div>

                  </div>
                </div>

              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-4"
            >
              <MaterialIcon name="arrow_back" className="text-[16px]" />
              Tiếp tục chọn hoa
            </Link>

          </div>

          {/* Right Column: Checkout Summary (Sticky Panel) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="glass-panel p-6 rounded-3xl shadow-[0_10px_35px_rgba(49,27,146,0.05)] border-white/80">
              <h2 className="font-hero-display text-xl font-bold text-deep-plum mb-5 pb-3 border-b border-crystal-border/60">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4 text-sm font-medium text-midnight-purple mb-6">
                
                <div className="flex justify-between">
                  <span className="text-dusk-gray">Tạm tính ({items.reduce((acc, x) => acc + x.quantity, 0)} sản phẩm)</span>
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

                {promoApplied && (
                  <div className="flex justify-between text-[#059669]">
                    <span>Giảm giá (Ưu đãi mới)</span>
                    <span>-{formatVND(50000)}</span>
                  </div>
                )}

                <div className="h-px bg-crystal-border/60 my-2"></div>

                <div className="flex justify-between items-end">
                  <span className="text-deep-plum font-bold text-base">Tổng thanh toán</span>
                  <span className="font-price-display font-bold text-2xl text-primary">
                    {formatVND(finalPrice)}
                  </span>
                </div>

              </div>

              {/* Promo Form */}
              <form onSubmit={handleApplyPromo} className="mb-6">
                <label className="text-xs font-semibold text-dusk-gray block mb-1.5">Mã giảm giá / Quà tặng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã: UTESHOPNEW"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                    className="flex-1 bg-pure-ivory/90 border border-crystal-border text-sm px-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={promoApplied}
                    className="bg-deep-plum text-pure-ivory text-xs font-bold px-4 py-2.5 rounded-xl transition hover:brightness-110 disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-xs text-[#059669] mt-2 font-medium flex items-center gap-1">
                    <MaterialIcon name="check_circle" className="text-[14px]" />
                    Đã giảm 50.000đ cho đơn hàng của bạn!
                  </p>
                )}
                {promoError && (
                  <p className="text-xs text-error mt-2 font-medium flex items-center gap-1">
                    <MaterialIcon name="error" className="text-[14px]" />
                    {promoError}
                  </p>
                )}
              </form>

              {/* Go to Checkout */}
              <Link
                to="/checkout"
                className="w-full btn-hero-cta-gradient py-3.5 rounded-full font-bold tracking-wide text-center flex items-center justify-center gap-2 shadow-md transition hover:-translate-y-0.5"
              >
                <MaterialIcon name="payment" />
                Tiến Hành Thanh Toán
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-dusk-gray mt-4">
                <MaterialIcon name="lock" className="text-[13px]" />
                Thanh toán an toàn, bảo mật tuyệt đối.
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
