import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/effect-fade";

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductRowSection } from "@/components/sections/ProductRowSection";
import { images } from "@/lib/images";

const { products } = images;

// Mock data
const PRODUCT_DATA = {
  id: "lavender-dream",
  name: "Bó Lavender Mộng Mơ",
  category: "Hoa Kỷ Niệm",
  description: "Bó hoa được thiết kế độc bản với những cành hoa oải hương tươi tắn kết hợp cùng hoa hồng pastel và lá bạc mỏng manh. Mang lại cảm giác thư thái, mộng mơ và vô cùng sang trọng. Phù hợp để tặng người yêu, kỷ niệm ngày cưới hoặc trang trí không gian sống.",
  price: "1.230.000đ",
  oldPrice: "1.500.000đ",
  rating: 4.8,
  reviewsCount: 124,
  sold: 452,
  inStock: 12,
  images: [
    products.lavenderDream.src,
    products.blushWhisper.src,
    products.purpleSymphony.src,
    products.pureElegance.src,
  ],
};

const SIMILAR_PRODUCTS = [
  {
    id: "blush-whisper",
    name: "Bó Blush Thì Thầm",
    description: "Tulip hồng, mao lương trắng",
    price: "1.200.000đ",
    imageUrl: products.blushWhisper.src,
    imageAlt: products.blushWhisper.alt,
    rating: 5,
  },
  {
    id: "purple-symphony",
    name: "Bó Purple Symphony",
    description: "Cát tường tím, cẩm tú cầu",
    price: "950.000đ",
    imageUrl: products.purpleSymphony.src,
    imageAlt: products.purpleSymphony.alt,
    badge: { label: "Mới", tone: "pink" as const },
    rating: 5,
  },
  {
    id: "pure-elegance",
    name: "Bó Pure Elegance",
    description: "Lan hồ điệp trắng cao cấp",
    price: "2.500.000đ",
    imageUrl: products.pureElegance.src,
    imageAlt: products.pureElegance.alt,
    rating: 5,
  },
];

export function ProductDetail() {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const increment = () => {
    if (quantity < PRODUCT_DATA.inStock) setQuantity((q) => q + 1);
  };
  const decrement = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  return (
    <div className="min-h-screen bg-lavender-mist pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-dusk-gray">
          <a href="/" className="hover:text-deep-plum transition">Trang chủ</a>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <a href="/products" className="hover:text-deep-plum transition">Bộ Sưu Tập</a>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-deep-plum font-medium">{PRODUCT_DATA.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          
          {/* Left Column: Swiper Images (Focus Mode) */}
          <div className="relative">
            {/* Soft Glow behind main image */}
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
                {PRODUCT_DATA.images.map((src, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={src} className="w-full h-full object-cover" alt={`Hình ${idx + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Thumbnail Swiper (Droplet style) */}
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
                {PRODUCT_DATA.images.map((src, idx) => (
                  <SwiperSlide key={`thumb-${idx}`}>
                    <div className="cursor-pointer overflow-hidden rounded-2xl aspect-square border-2 border-transparent transition-all duration-300 [&.swiper-slide-thumb-active]:border-dreamy-purple [&.swiper-slide-thumb-active]:shadow-md hover:opacity-100 opacity-60">
                      <img src={src} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col pt-4 lg:pt-8">
            
            {/* Category Tag */}
            <div className="mb-4 inline-flex self-start rounded-full bg-white/60 backdrop-blur-md px-3 py-1 border border-white text-xs font-semibold text-primary shadow-sm tracking-wide uppercase">
              {PRODUCT_DATA.category}
            </div>

            {/* Title */}
            <h1 className="font-hero-display text-4xl lg:text-5xl font-bold text-deep-plum mb-4 leading-tight">
              {PRODUCT_DATA.name}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <MaterialIcon name="star" className="text-star-rating text-[20px]" filled />
                <span className="font-bold text-deep-plum text-lg">{PRODUCT_DATA.rating}</span>
                <span className="text-dusk-gray text-sm ml-1">({PRODUCT_DATA.reviewsCount} đánh giá)</span>
              </div>
              <div className="h-4 w-px bg-crystal-border"></div>
              <div className="text-sm font-medium text-midnight-purple">
                Đã bán: <span className="font-bold text-deep-plum">{PRODUCT_DATA.sold}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-8">
              <span className="font-price-display text-3xl font-bold text-primary">
                {PRODUCT_DATA.price}
              </span>
              {PRODUCT_DATA.oldPrice && (
                <span className="font-price-display text-lg text-dusk-gray line-through mb-1">
                  {PRODUCT_DATA.oldPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-midnight-purple leading-relaxed mb-8 font-body-standard text-[17px]">
              {PRODUCT_DATA.description}
            </p>

            <div className="h-px w-full bg-crystal-border/60 mb-8"></div>

            {/* Action Area (Glass Bar) */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
              
              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-dusk-gray">Số lượng</span>
                <div className="flex items-center gap-3 bg-pure-ivory/80 rounded-full px-2 py-1 shadow-inner border border-crystal-border">
                  <button onClick={decrement} className="w-8 h-8 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition" disabled={quantity <= 1}>
                    <MaterialIcon name="remove" className="text-[18px]" />
                  </button>
                  <span className="font-price-display font-semibold w-6 text-center">{quantity}</span>
                  <button onClick={increment} className="w-8 h-8 rounded-full flex items-center justify-center text-midnight-purple hover:bg-surface-dim transition" disabled={quantity >= PRODUCT_DATA.inStock}>
                    <MaterialIcon name="add" className="text-[18px]" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2 self-center sm:self-auto text-center sm:text-left">
                {PRODUCT_DATA.inStock > 0 ? (
                  <div className="flex items-center gap-1.5 text-safe-mint">
                    <MaterialIcon name="check_circle" filled className="text-[20px]" />
                    <span className="font-medium text-sm text-[#059669]">Còn {PRODUCT_DATA.inStock} sản phẩm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-error">
                    <MaterialIcon name="cancel" filled className="text-[20px]" />
                    <span className="font-medium text-sm">Hết hàng</span>
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <button className="w-full sm:w-auto btn-hero-cta-gradient px-8 py-3.5 rounded-full font-bold tracking-wide text-lg hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2">
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
            products={SIMILAR_PRODUCTS}
          />
        </div>

      </div>
    </div>
  );
}
