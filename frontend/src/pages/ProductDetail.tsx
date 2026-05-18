import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/effect-fade";

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductRowSection } from "@/components/sections/ProductRowSection";
import {
  fetchProductById,
  fetchProductVariants,
  fetchRelatedProducts,
  clearSelectedProduct,
} from "@/features/catalog/catalogSlice";
import { addToCart } from "@/features/cart/cartSlice";
import { getProductImage, formatVND } from "./ProductList";
import { images } from "@/lib/images";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const { products: imgProducts } = images;

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedProduct, selectedVariants, relatedProducts, loading } = useAppSelector(
    (state) => state.catalog
  );

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Tải chi tiết sản phẩm và biến thể
  useEffect(() => {
    if (id) {
      void dispatch(fetchProductById(id));
      void dispatch(fetchProductVariants(id));
      void dispatch(fetchRelatedProducts(id));
    }
    return () => {
      void dispatch(clearSelectedProduct());
    };
  }, [id, dispatch]);

  // Đặt mặc định là biến thể đầu tiên khi danh sách được nạp
  useEffect(() => {
    if (selectedVariants.length > 0) {
      setSelectedVariant(selectedVariants[0]);
      setQuantity(1);
    }
  }, [selectedVariants]);

  if (loading || !selectedProduct) {
    return (
      <div className="flex h-screen items-center justify-center bg-lavender-mist">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-crystal-border border-t-primary"></div>
      </div>
    );
  }

  // Danh sách hình ảnh của biến thể đang chọn, hoặc fallback sang ảnh sản phẩm
  const activeImages =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : selectedProduct.mainImageUrl 
        ? [selectedProduct.mainImageUrl] 
        : [getProductImage(selectedProduct.slug || selectedProduct._id)];

  const activeStock = selectedVariant?.stock ?? 10;
  const activePrice = selectedVariant?.price ?? 1230000;
  const activeOldPrice = selectedVariant?.oldPrice;

  const increment = () => {
    if (quantity < activeStock) setQuantity((q) => q + 1);
  };
  const decrement = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    dispatch(
      addToCart({
        productId: selectedProduct._id,
        variantId: selectedVariant._id,
        name: selectedProduct.name,
        variantName: selectedVariant.sizeName,
        price: activePrice,
        imageUrl: activeImages[0],
        quantity,
        stock: activeStock,
      })
    );

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      navigate("/cart");
    }, 1200);
  };

  // Dynamic mapped related products
  const mappedRelatedProducts = useMemo(() => {
    return relatedProducts.map((p) => {
      const minPrice = p.minifiedVariants && p.minifiedVariants.length > 0
        ? p.minifiedVariants[0].price
        : 1230000;
      const formattedPrice = minPrice.toLocaleString("vi-VN") + "đ";

      const imgUrl = p.mainImageUrl || getProductImage(p.slug || p._id);

      let tone: "default" | "pink" = "default";
      let label = "";
      if (p.tags && p.tags.length > 0) {
        if (p.tags[0] === "ban-chay") label = "Bán Chạy";
        else if (p.tags[0] === "yeu-thich") {
          label = "Yêu Thích";
          tone = "pink";
        } else if (p.tags[0] === "khuyen-mai") {
          label = "Giảm Giá";
          tone = "pink";
        } else label = "Mới";
      }

      return {
        id: p.slug || p._id,
        name: p.name,
        description: p.description,
        price: formattedPrice,
        imageUrl: imgUrl,
        imageAlt: p.name,
        badge: label ? { label, tone } : undefined,
        rating: p.reviewStats?.ratingAverage ?? 5,
      };
    });
  }, [relatedProducts]);

  // Fallback to SIMILAR_PRODUCTS if related list is empty
  const SIMILAR_PRODUCTS = [
    {
      id: "blush-whisper",
      name: "Bó Blush Thì Thầm",
      description: "Tulip hồng, mao lương trắng",
      price: "1.200.000đ",
      imageUrl: imgProducts.blushWhisper.src,
      imageAlt: imgProducts.blushWhisper.alt,
      rating: 5,
    },
    {
      id: "purple-symphony",
      name: "Bó Purple Symphony",
      description: "Cát tường tím, cẩm tú cầu",
      price: "950.000đ",
      imageUrl: imgProducts.purpleSymphony.src,
      imageAlt: imgProducts.purpleSymphony.alt,
      badge: { label: "Mới", tone: "pink" as const },
      rating: 5,
    },
    {
      id: "pure-elegance",
      name: "Bó Pure Elegance",
      description: "Lan hồ điệp trắng cao cấp",
      price: "2.500.000đ",
      imageUrl: imgProducts.pureElegance.src,
      imageAlt: imgProducts.pureElegance.alt,
      rating: 5,
    },
  ];

  const productsToRender = mappedRelatedProducts.length > 0 ? mappedRelatedProducts : SIMILAR_PRODUCTS;

  return (
    <div className="min-h-screen bg-lavender-mist pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Toast thông báo thêm giỏ hàng thành công dạng bay mượt mà */}
        {addedSuccess && (
          <div className="fixed top-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#059669]/20 bg-emerald-50 px-6 py-3.5 text-sm font-semibold text-[#059669] shadow-xl backdrop-blur-md animate-bounce">
            <MaterialIcon name="check_circle" filled className="text-[20px]" />
            <span>Đã thêm bó hoa vào giỏ hàng của bạn! Đang chuyển hướng...</span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-dusk-gray">
          <a href="/" className="hover:text-deep-plum transition">Trang chủ</a>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <a href="/products" className="hover:text-deep-plum transition">Bộ Sưu Tập</a>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-deep-plum font-medium">{selectedProduct.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          
          {/* Left Column: Swiper Images (Focus Mode) */}
          <div className="relative">
            <div className="absolute inset-0 bg-dreamy-purple/10 blur-[80px] rounded-full scale-75 -z-10"></div>
            
            {/* Main Swiper */}
            <div className="glass-panel rounded-[2rem] p-2 overflow-hidden shadow-[0_10px_40px_rgba(49,27,146,0.08)] mb-4">
              <Swiper
                effect="fade"
                spaceBetween={10}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Navigation, Thumbs, EffectFade]}
                className="rounded-[1.5rem] aspect-[4/5] w-full"
              >
                {activeImages.map((src: string, idx: number) => (
                  <SwiperSlide key={idx}>
                    <img src={src} className="w-full h-full object-cover" alt={`Hình ${idx + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Thumbnail Swiper */}
            {activeImages.length > 1 && (
              <div className="px-4">
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={16}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="thumbs-swiper"
                >
                  {activeImages.map((src: string, idx: number) => (
                    <SwiperSlide key={`thumb-${idx}`}>
                      <div className="cursor-pointer overflow-hidden rounded-2xl aspect-square border-2 border-transparent transition-all duration-300 [&.swiper-slide-thumb-active]:border-dreamy-purple [&.swiper-slide-thumb-active]:shadow-md hover:opacity-100 opacity-60">
                        <img src={src} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col pt-4 lg:pt-8">
            
            {/* Category Tag */}
            <div className="mb-4 inline-flex self-start rounded-full bg-white/60 backdrop-blur-md px-3 py-1 border border-white text-xs font-semibold text-primary shadow-sm tracking-wide uppercase">
              {typeof selectedProduct.category === "object" ? selectedProduct.category.name : "Bộ sưu tập"}
            </div>

            {/* Title */}
            <h1 className="font-hero-display text-4xl lg:text-5xl font-bold text-deep-plum mb-4 leading-tight">
              {selectedProduct.name}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <MaterialIcon name="star" className="text-star-rating text-[20px]" filled />
                <span className="font-bold text-deep-plum text-lg">{selectedProduct.reviewStats?.ratingAverage ?? 5}</span>
                <span className="text-dusk-gray text-sm ml-1">({selectedProduct.reviewStats?.ratingCount ?? 124} đánh giá)</span>
              </div>
              <div className="h-4 w-px bg-crystal-border"></div>
              <div className="text-sm font-medium text-midnight-purple">
                Đã bán: <span className="font-bold text-deep-plum">{selectedProduct.soldCount ?? 452}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6">
              <span className="font-price-display text-3xl font-bold text-primary">
                {formatVND(activePrice)}
              </span>
              {activeOldPrice && (
                <span className="font-price-display text-lg text-dusk-gray line-through mb-1">
                  {formatVND(activeOldPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-midnight-purple leading-relaxed mb-8 font-body-standard text-[17px]">
              {selectedProduct.description}
            </p>

            {/* Variants Size Selector */}
            {selectedVariants.length > 1 && (
              <div className="mb-8">
                <span className="text-sm font-medium text-dusk-gray block mb-3">Lựa chọn kích thước / cấu hình</span>
                <div className="flex flex-wrap gap-3">
                  {selectedVariants.map((v) => {
                    const isActive = selectedVariant?._id === v._id;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v);
                          setQuantity(1);
                        }}
                        className={`rounded-2xl border px-5 py-2.5 text-sm font-medium transition-all duration-300 shadow-sm ${
                          isActive
                            ? "bg-deep-plum border-deep-plum text-pure-ivory ring-2 ring-primary/20 scale-[1.02]"
                            : "bg-pure-ivory/60 border-crystal-border text-midnight-purple hover:bg-soft-amethyst/30"
                        }`}
                      >
                        {v.sizeName} ({formatVND(v.price)})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="h-px w-full bg-crystal-border/60 mb-8"></div>

            {/* Action Area (Glass Bar) */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
              
              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-dusk-gray">Số lượng</span>
                <div className="flex items-center gap-3 bg-pure-ivory/80 rounded-full px-2 py-1 shadow-inner border border-crystal-border">
                  <button
                    type="button"
                    onClick={decrement}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition"
                    disabled={quantity <= 1}
                  >
                    <MaterialIcon name="remove" className="text-[18px]" />
                  </button>
                  <span className="font-price-display font-semibold w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={increment}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition"
                    disabled={quantity >= activeStock}
                  >
                    <MaterialIcon name="add" className="text-[18px]" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2 self-center sm:self-auto text-center sm:text-left">
                {activeStock > 0 ? (
                  <div className="flex items-center gap-1.5 text-safe-mint">
                    <MaterialIcon name="check_circle" filled className="text-[20px]" />
                    <span className="font-medium text-sm text-[#059669]">Còn {activeStock} sản phẩm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-error">
                    <MaterialIcon name="cancel" filled className="text-[20px]" />
                    <span className="font-medium text-sm">Tạm hết hàng</span>
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={activeStock <= 0}
                className="w-full sm:w-auto btn-hero-cta-gradient px-8 py-3.5 rounded-full font-bold tracking-wide text-lg hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <MaterialIcon name="shopping_cart" />
                Mua Ngay
              </button>

            </div>

            {/* Features list */}
            <ul className="space-y-3 text-sm text-midnight-purple">
              <li className="flex items-center gap-3">
                <div className="bg-white/60 p-1.5 rounded-full text-primary"><MaterialIcon name="local_shipping" className="text-[18px]" /></div>
                Giao hàng hỏa tốc trong 2 giờ
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-white/60 p-1.5 rounded-full text-primary"><MaterialIcon name="card_giftcard" className="text-[18px]" /></div>
                Tặng kèm thiệp thiết kế miễn phí
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-white/60 p-1.5 rounded-full text-primary"><MaterialIcon name="verified" className="text-[18px]" /></div>
                Cam kết hoa tươi trên 3 ngày
              </li>
            </ul>

          </div>
        </div>

        {/* Similar Products */}
        <div className="pt-12 border-t border-crystal-border/60">
          <ProductRowSection
            title="Sản phẩm tương tự"
            subtitle="Có thể bạn sẽ yêu thích những thiết kế cùng bộ sưu tập."
            products={productsToRender}
          />
        </div>

      </div>
    </div>
  );
}
