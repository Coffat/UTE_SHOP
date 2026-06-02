import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RootState, AppDispatch } from "@/store";
import { updateQuantity, removeFromCart, clearCart, addToCart } from "@/features/cart/cartSlice";
import { formatVND, getProductImage } from "./ProductList";
import { useEffect, useState } from "react";
import { BackendProduct, fetchProducts } from "@/features/catalog/catalogSlice";
import { resolvePrimaryVariant } from "@/lib/variant";
import { parseDecimalPrice } from "@/lib/price";

export function Cart() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal } = useSelector((state: RootState) => state.cart);
  const { products } = useSelector((state: RootState) => state.catalog);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Tải danh mục sản phẩm phục vụ phần "Gợi Ý Cho Bạn"
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

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

  // Thêm nhanh sản phẩm gợi ý vào giỏ hàng
  const handleAddRecommended = (p: BackendProduct) => {
    const primary = resolvePrimaryVariant(p.minifiedVariants);
    if (!primary.variantId) return;

    dispatch(
      addToCart({
        productId: p._id,
        variantId: primary.variantId,
        name: p.name,
        variantName: primary.sizeName,
        price: primary.price || parseDecimalPrice(p.minifiedVariants?.[0]?.price) || 990000,
        imageUrl: p.mainImageUrl || getProductImage(p.slug || p._id),
        quantity: 1,
        stock: primary.stock || 15,
      })
    );
  };

  // Phần hiển thị gợi ý sản phẩm bán chạy (CRO)
  const renderRecommendations = () => {
    // Lọc ra các sản phẩm chưa có trong giỏ hàng để gợi ý không bị trùng lặp
    const cartProductIds = items.map((item) => item.productId);
    const recommendedList = products.filter((p) => !cartProductIds.includes(p._id)).slice(0, 3);

    if (recommendedList.length === 0) return null;

    return (
      <div className="mt-16 pt-12 border-t border-crystal-border/60 motion-safe:animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="mb-8 text-center sm:text-left">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-soft-amethyst/30 border border-crystal-border/60 px-3.5 py-1 text-[11px] font-bold text-deep-plum">
            ✨ ƯU ĐÃI THỜI THƯỢNG
          </span>
          <h2 className="font-hero-display text-2xl font-bold text-deep-plum sm:text-3xl tracking-tight">
            Có Thể Bạn Sẽ Yêu Thích
          </h2>
          <p className="text-dusk-gray text-xs sm:text-sm mt-1">Những bó hoa tươi bán chạy nhất trong tuần qua tại boutique</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recommendedList.map((p) => {
            const priceVal = p.minifiedVariants?.[0]?.price || 990000;
            return (
              <div
                key={p._id}
                className="glass-panel group p-4 rounded-3xl flex flex-col h-full hover-lift hover:border-dreamy-purple/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-soft-amethyst/5 to-transparent opacity-40 -z-10"></div>
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-soft-amethyst/10 mb-4 shrink-0 shadow-sm">
                  <img
                    src={getProductImage(p._id)}
                    alt={p.name}
                    className="w-full h-full object-cover image-hover-zoom"
                  />
                  <div className="absolute right-3 top-3 bg-pure-ivory/95 text-primary font-price-display font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm border border-crystal-border">
                    {formatVND(priceVal)}
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <h4 className="font-home-heading text-sm font-bold text-deep-plum line-clamp-1 group-hover:text-primary transition">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-dusk-gray line-clamp-2 mt-1 flex-1 leading-relaxed">
                    {p.description}
                  </p>
                  <div className="mt-5 flex justify-between items-center gap-2">
                    <Link
                      to={`/product/${p._id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      Xem chi tiết
                      <MaterialIcon name="chevron_right" className="text-[14px]" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddRecommended(p)}
                      className="bg-primary hover:bg-deep-plum text-pure-ivory text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 active-press shadow-sm hover:shadow"
                    >
                      <MaterialIcon name="add_shopping_cart" className="text-[14px]" />
                      Chọn mua
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Trường hợp giỏ hàng trống
  if (items.length === 0) {
    return (
      <div className="relative min-h-screen bg-lavender-mist pt-32 pb-20 overflow-hidden flex flex-col justify-center motion-safe:animate-fade-in">
        {/* Ambient background glows */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-dreamy-purple/10 blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-petal-pink/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-lg text-center mb-16 motion-safe:animate-fade-up">
            <div className="glass-panel p-10 rounded-[32px] border-white/90 relative overflow-hidden group hover-lift hover:border-dreamy-purple/20">
              <div className="absolute inset-0 bg-gradient-to-tr from-soft-amethyst/10 via-transparent to-petal-pink/10 opacity-30 -z-10"></div>
              
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-soft-amethyst/20 to-petal-pink/20 text-primary shadow-inner relative">
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-soft-amethyst/20 opacity-75"></span>
                <MaterialIcon name="shopping_bag" className="text-[48px] text-deep-plum" />
              </div>

              <h1 className="font-hero-display text-3xl font-bold text-deep-plum mb-3 tracking-tight">Giỏ Hàng Đang Trống</h1>
              <p className="text-midnight-purple/80 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Có vẻ như bạn chưa chọn đóa hoa tươi thắm nào. Hãy khám phá ngay bộ sưu tập được thiết kế đầy cảm xúc của boutique nhé!
              </p>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 btn-hero-cta-gradient px-8 py-4 rounded-full font-bold tracking-wide active-press"
              >
                <MaterialIcon name="explore" />
                Khám Phá Cửa Hàng
              </Link>
            </div>
          </div>

          {/* Hiển thị gợi ý hoa bán chạy ngay cả khi giỏ hàng trống */}
          {renderRecommendations()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-lavender-mist pt-28 pb-20 overflow-hidden motion-safe:animate-fade-in">
      {/* Floating glass orb background elements for luxury atmosphere */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-dreamy-purple/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-petal-pink/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-soft-amethyst/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title and Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 motion-safe:animate-fade-up">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-soft-amethyst/30 border border-crystal-border/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-deep-plum backdrop-blur-md">
              <MaterialIcon name="shopping_basket" className="text-sm text-primary" />
              GIỎ HÀNG THƯƠNG YÊU
            </span>
            <h1 className="font-hero-display text-4xl font-bold text-deep-plum sm:text-5xl lg:text-6xl tracking-tight">
              Giỏ Hàng Của Bạn
            </h1>
            <p className="text-dusk-gray text-sm mt-2 font-medium">
              Đang nâng niu <span className="text-primary font-bold">{items.reduce((acc, x) => acc + x.quantity, 0)} đóa hoa</span> thơm ngát cho hành trình yêu thương.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="flex items-center gap-1.5 self-start text-xs font-semibold text-dusk-gray hover:text-error hover:border-error/30 hover:bg-rose-50/50 transition-[color,background-color,border-color] duration-300 bg-white/50 px-4 py-2.5 rounded-full border border-crystal-border shadow-sm active-press cursor-pointer"
          >
            <MaterialIcon name="delete_sweep" className="text-[16px]" />
            Xóa Toàn Bộ Giỏ Hàng
          </button>
        </div>

        {/* Progress Dashboard for Free Shipping */}
        {subtotal < SHIPPING_THRESHOLD ? (
          <div className="glass-panel p-6 rounded-3xl mb-8 flex flex-col gap-4 shadow-[0_10px_30px_rgba(49,27,146,0.03)] border-white/80 relative overflow-hidden group motion-safe:animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-soft-amethyst/5 to-petal-pink/5 opacity-50 -z-10"></div>
            <div className="flex justify-between items-center text-sm font-bold text-deep-plum">
              <span className="flex items-center gap-2 text-primary font-home-heading">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-soft-amethyst/50 text-deep-plum animate-bounce">🚚</span>
                Mua thêm <span className="text-gradient font-extrabold">{formatVND(dynamicRemaining)}</span> để nhận ưu đãi <span className="underline decoration-wavy decoration-primary/40">MIỄN PHÍ VẬN CHUYỂN</span>!
              </span>
              <span className="font-mono bg-pure-ivory px-2 py-0.5 rounded-md border border-crystal-border text-xs text-primary shadow-sm">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            {/* Dynamic visual slider */}
            <div className="w-full h-3 bg-pure-ivory/80 rounded-full overflow-hidden border border-crystal-border/40 relative">
              <div
                className="h-full login-gradient-bg transition-[width] duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(255,117,140,0.3)]"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-dusk-gray font-medium italic">
              * Đơn hàng sẽ tự động áp dụng chính sách giao hoa miễn phí khi đạt ngưỡng 1.000.000đ.
            </p>
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-3xl mb-8 flex items-center gap-4 bg-emerald-50/60 border-emerald-200/50 shadow-[0_10px_30px_rgba(5,150,105,0.03)] animate-pulse">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#059669] shadow-[0_0_15px_rgba(5,150,105,0.15)]">
              <MaterialIcon name="verified" className="text-[24px]" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#065f46] block font-home-heading">
                Đủ Điều Kiện Nhận Ưu Đãi Giao Hoa Miễn Phí! 🎉
              </span>
              <span className="text-xs text-emerald-800/80 font-medium">
                Đơn hàng của quý khách sẽ được chăm sóc đặc biệt và giao tận nơi miễn phí hoàn toàn.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start motion-safe:animate-fade-up" style={{ animationDelay: '150ms' }}>
          
          {/* Left Column: Cart items list */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="glass-panel p-5 rounded-3xl flex gap-4 sm:gap-6 items-center border-white/60 hover-lift hover:border-dreamy-purple/30 group"
              >
                
                {/* Product Thumbnail with hover scale effect */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border border-crystal-border flex-shrink-0 bg-soft-amethyst/20 relative shadow-sm">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover image-hover-zoom"
                  />
                </div>

                {/* Info and Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-home-heading font-bold text-deep-plum text-base sm:text-lg truncate group-hover:text-primary transition">
                        <Link to={`/product/${item.productId}`}>{item.name}</Link>
                      </h3>
                      <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-soft-amethyst/30 border border-crystal-border px-2.5 py-0.5 text-[10px] font-semibold text-deep-plum">
                        💐 Kích thước: {item.variantName}
                      </span>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                      className="text-dusk-gray hover:text-error hover:bg-rose-50/50 hover:scale-110 active-press transition-[color,background-color,border-color,transform] duration-200 p-2 rounded-full border border-transparent hover:border-rose-100 shadow-none cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <MaterialIcon name="close" className="text-[18px]" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                    
                    {/* Quantity Selector - Capsule style */}
                    <div className="flex items-center gap-2.5 bg-pure-ivory/90 rounded-full px-2.5 py-1 border border-crystal-border/70 shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity, -1, item.stock)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-midnight-purple hover:bg-soft-amethyst/20 disabled:opacity-40 active-press transition-[background-color,transform] duration-200"
                        disabled={item.quantity <= 1}
                      >
                        <MaterialIcon name="remove" className="text-[16px] font-bold" />
                      </button>
                      <span className="font-price-display font-bold w-6 text-center text-sm text-deep-plum">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity, 1, item.stock)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-midnight-purple hover:bg-soft-amethyst/20 disabled:opacity-40 active-press transition-[background-color,transform] duration-200"
                        disabled={item.quantity >= item.stock}
                      >
                        <MaterialIcon name="add" className="text-[16px] font-bold" />
                      </button>
                    </div>

                    {/* Price display with Inter font */}
                    <div className="flex flex-col items-end">
                      <span className="font-price-display font-extrabold text-gradient text-lg sm:text-xl">
                        {formatVND(item.price * item.quantity)}
                      </span>
                      <span className="text-[10px] text-dusk-gray font-medium mt-0.5">Đơn giá: {formatVND(item.price)}</span>
                    </div>

                  </div>
                </div>

              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-deep-plum transition mt-4 hover:translate-x-[-2px] duration-200"
            >
              <MaterialIcon name="arrow_back" className="text-[16px]" />
              Tiếp tục chọn thêm hoa tươi
            </Link>

          </div>

          {/* Right Column: Checkout Summary sticky panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="glass-panel p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(49,27,146,0.06)] border-white/80 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-soft-amethyst/5 to-transparent opacity-60 -z-10"></div>
              
              <h2 className="font-hero-display text-2xl font-bold text-deep-plum mb-6 pb-4 border-b border-crystal-border/60 flex items-center gap-2">
                <MaterialIcon name="assignment" className="text-primary text-[22px]" />
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4 text-sm font-medium text-midnight-purple mb-6">
                
                <div className="flex justify-between items-center">
                  <span className="text-dusk-gray font-semibold">Tạm tính ({items.reduce((acc, x) => acc + x.quantity, 0)} sản phẩm)</span>
                  <span className="text-deep-plum font-bold text-base">{formatVND(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-dusk-gray font-semibold">Phí vận chuyển</span>
                  {shippingCost === 0 ? (
                    <span className="text-[#059669] font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 shadow-sm animate-pulse">Miễn phí</span>
                  ) : (
                    <span className="text-deep-plum font-bold">{formatVND(shippingCost)}</span>
                  )}
                </div>

                {promoApplied && (
                  <div className="flex justify-between items-center text-[#059669] font-semibold bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/30">
                    <span className="flex items-center gap-1">
                      <MaterialIcon name="discount" className="text-sm" />
                      Ưu đãi mới (UTESHOPNEW)
                    </span>
                    <span>-{formatVND(50000)}</span>
                  </div>
                )}

                <div className="h-px bg-crystal-border/60 my-3"></div>

                <div className="flex justify-between items-end">
                  <span className="text-deep-plum font-extrabold text-base font-home-heading mb-0.5">Tổng thanh toán</span>
                  <div className="text-right">
                    <span className="font-price-display font-extrabold text-2xl text-gradient block">
                      {formatVND(finalPrice)}
                    </span>
                    <span className="text-[10px] text-dusk-gray italic font-medium">(Đã bao gồm thuế GTGT)</span>
                  </div>
                </div>

              </div>

              {/* Promo code input with suggestions */}
              <div className="bg-pure-ivory/50 rounded-2xl p-4 mb-6 border border-crystal-border/40">
                <form onSubmit={handleApplyPromo} className="space-y-3">
                  <label className="text-xs font-bold text-deep-plum block flex items-center gap-1">
                    <MaterialIcon name="redeem" className="text-primary text-[15px]" />
                    Mã giảm giá / Quà tặng
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="flex-1 bg-pure-ivory border border-crystal-border text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={promoApplied || !promoCode}
                      className="bg-deep-plum hover:bg-primary disabled:bg-dusk-gray/30 text-pure-ivory text-xs font-bold px-4 py-2.5 rounded-xl active-press disabled:opacity-50 cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </form>
 
                {/* Clickable Quick Coupon Suggestion */}
                {!promoApplied && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-dusk-gray font-medium">
                    <span>Mã cho bạn:</span>
                    <button
                      type="button"
                      onClick={() => setPromoCode("UTESHOPNEW")}
                      className="bg-soft-amethyst/30 hover:bg-soft-amethyst/60 text-deep-plum px-2.5 py-1 rounded-lg border border-crystal-border font-bold text-[10px] active-press hover:scale-105 transition-[background-color,transform] duration-200 cursor-pointer"
                    >
                      UTESHOPNEW 🎁
                    </button>
                  </div>
                )}
 
                {promoApplied && (
                  <p className="text-xs text-[#059669] mt-2 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <MaterialIcon name="check_circle" className="text-[14px]" />
                    Đã giảm 50.000đ cho đơn hàng!
                  </p>
                )}
                {promoError && (
                  <p className="text-xs text-error mt-2 font-semibold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                    <MaterialIcon name="error" className="text-[14px]" />
                    {promoError}
                  </p>
                )}
              </div>
 
              {/* Go to Checkout */}
              <Link
                to="/checkout"
                className="w-full btn-hero-cta-gradient py-4 rounded-full font-bold tracking-wide text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active-press text-base"
              >
                <MaterialIcon name="payment" />
                Tiến Hành Thanh Toán
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-dusk-gray font-medium mt-5">
                <MaterialIcon name="verified_user" className="text-[14px] text-safe-mint" />
                Thanh toán an toàn, bảo mật tuyệt đối.
              </div>

            </div>
          </div>

        </div>

        {/* Gợi Ý Thêm Sản Phẩm Bán Chạy (CRO) dưới danh sách giỏ hàng */}
        {renderRecommendations()}

      </div>
    </div>
  );
}
