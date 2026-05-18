import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppDispatch, RootState } from "@/store";
import { fetchWishlist, removeFromWishlist } from "@/features/wishlist/wishlistSlice";
import { addToCart } from "@/features/cart/cartSlice";
import { getProductImage, formatVND } from "./ProductList";

export function Favorites() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const favoriteItems = useSelector((state: RootState) => state.wishlist.items);
  const { status } = useSelector((state: RootState) => state.wishlist);
  const { profile } = useSelector((state: RootState) => state.profile);

  // Sync wishlist from backend on component mount
  useEffect(() => {
    if (profile) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, profile]);

  const handleAddToCart = (p: any) => {
    const priceVal = p.minifiedVariants?.[0]?.price || 990000;
    const variantId = p.minifiedVariants?.[0]?._id || "default";
    const variantName = p.minifiedVariants?.[0]?.sizeName || "Tiêu chuẩn";
    const stockVal = p.minifiedVariants?.[0]?.stock || 99;

    dispatch(
      addToCart({
        productId: p._id,
        variantId,
        name: p.name,
        variantName,
        price: priceVal,
        imageUrl: p.mainImageUrl || getProductImage(p.slug || p._id),
        quantity: 1,
        stock: stockVal,
      })
    );
    alert(`Đã thêm "${p.name}" vào giỏ hàng thành công!`);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[24px] p-6 shadow-[0_10px_40px_rgba(168,85,247,0.05)] flex items-center justify-between border border-white/60">
        <div>
          <h2 className="font-section-title text-[32px] text-deep-plum flex items-center gap-2">
            <MaterialIcon name="favorite" className="text-primary text-[28px]" />
            Bộ sưu tập yêu thích
          </h2>
          <p className="text-sm text-dusk-gray mt-1 font-medium">Những đóa hoa bạn đã cất giữ cho riêng mình</p>
        </div>
        <div className="bg-pure-ivory/80 px-4 py-2 rounded-full border border-crystal-border/80 shadow-sm">
          <span className="text-sm font-bold text-deep-plum">{favoriteItems.length} sản phẩm</span>
        </div>
      </div>

      {status === "loading" && favoriteItems.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-crystal-border border-t-primary"></div>
        </div>
      ) : favoriteItems.length === 0 ? (
        <div className="glass-panel rounded-[24px] p-12 shadow-[0_10px_40px_rgba(168,85,247,0.05)] text-center border border-white/60 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-petal-pink/10 via-transparent to-soft-amethyst/10 opacity-30 -z-10"></div>
          
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-soft-amethyst/20 to-petal-pink/20 text-primary shadow-inner relative">
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-petal-pink/40 opacity-75"></span>
            <MaterialIcon name="favorite_border" className="text-[48px] text-deep-plum group-hover:scale-110 transition-transform duration-500" />
          </div>

          <h3 className="font-hero-display text-2xl font-bold text-deep-plum mb-3 tracking-tight">Bạn chưa cất giữ đóa hoa nào</h3>
          <p className="text-midnight-purple/80 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Hãy khám phá các mẫu hoa tươi tuyệt đẹp và nhấn thả tim để lưu lại những lựa chọn ưng ý nhất nhé.
          </p>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 btn-hero-cta-gradient px-8 py-3.5 rounded-full font-bold tracking-wide transition hover:brightness-105 active:scale-98 shadow-sm hover:shadow"
          >
            <MaterialIcon name="explore" className="text-[18px]" />
            Khám phá bộ sưu tập
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {favoriteItems.map((p) => {
            const priceVal = p.minifiedVariants?.[0]?.price || 990000;
            const imageUrl = p.mainImageUrl || getProductImage(p.slug || p._id);
            return (
              <div
                key={p._id}
                className="glass-panel group p-4 rounded-3xl flex flex-col h-full hover:shadow-[0_15px_40px_rgba(123,65,180,0.08)] hover:border-dreamy-purple/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-white/60 bg-white/40"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-soft-amethyst/5 to-transparent opacity-40 -z-10"></div>
                
                {/* Nút thả tim (Đã thích) */}
                <button
                  type="button"
                  onClick={() => dispatch(removeFromWishlist(p._id))}
                  className="absolute right-6 top-6 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                  aria-label="Xóa khỏi yêu thích"
                >
                  <MaterialIcon name="favorite" className="text-[18px]" />
                </button>

                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-soft-amethyst/10 mb-4 shrink-0 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                  />
                  <div className="absolute left-3 bottom-3 bg-pure-ivory/90 backdrop-blur-md text-primary font-price-display font-bold text-xs px-3 py-1.5 rounded-full shadow-sm border border-crystal-border">
                    {formatVND(priceVal)}
                  </div>
                </div>
                
                <div className="flex flex-col flex-1 px-1">
                  <h4 className="font-home-heading text-base font-bold text-deep-plum line-clamp-1 group-hover:text-primary transition">
                    <Link to={`/product/${p._id}`}>{p.name}</Link>
                  </h4>
                  <p className="text-xs text-dusk-gray line-clamp-2 mt-1.5 flex-1 leading-relaxed">
                    {p.description || "Một đóa hoa tươi thắm được tuyển chọn kỹ lưỡng từ cửa hàng."}
                  </p>
                  
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromWishlist(p._id))}
                      className="bg-pure-ivory hover:bg-white text-deep-plum text-xs font-bold px-3 py-2.5 rounded-xl border border-crystal-border transition-colors text-center"
                    >
                      Bỏ thích
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className="bg-primary hover:bg-deep-plum text-pure-ivory text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <MaterialIcon name="shopping_cart" className="text-[14px]" />
                      Thêm giỏ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
