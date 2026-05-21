import { useEffect } from "react";
import { CustomerTestimonials } from "@/components/sections/CustomerTestimonials";
import { FeaturedCategories } from "@/components/sections/FeaturedCategories";
import { Hero } from "@/components/sections/Hero";
import { OccasionByEvent } from "@/components/sections/OccasionByEvent";
import { ProductRowSection } from "@/components/sections/ProductRowSection";
import { TopProductsSlider } from "@/components/sections/TopProductsSlider";
import { PromoBanner } from "@/components/sections/PromoBanner";
import type { Product, ProductBadge } from "@/components/ui/ProductCard";
import { images } from "@/lib/images";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHomeProducts, fetchTopProducts, BackendProduct } from "@/features/catalog/catalogSlice";

const { products } = images;

const formatPrice = (price: any) => {
  let val = 0;
  if (typeof price === 'number') val = price;
  else if (typeof price === 'string') val = parseFloat(price);
  else if (price && price.$numberDecimal) val = parseFloat(price.$numberDecimal);
  
  if (isNaN(val)) val = 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const mapToUI = (p: BackendProduct, fallbackImage: string): Product => {
  let badge: ProductBadge | undefined;
  const tags = p.tags as any[];
  if (tags?.some((t: any) => t.slug === 'ban-chay')) {
    badge = { label: "Bán chạy", tone: "default" };
  } else if (tags?.some((t: any) => t.slug === 'moi-ve')) {
    badge = { label: "Mới", tone: "pink" };
  } else if (tags?.some((t: any) => t.slug === 'khuyen-mai')) {
    badge = { label: "Sale", tone: "pink" };
  }

  return {
    id: p._id,
    name: p.name,
    description: p.description,
    price: p.minifiedVariants?.[0]?.price ? formatPrice(p.minifiedVariants[0].price) : "Liên hệ",
    imageUrl: p.mainImageUrl || fallbackImage,
    imageAlt: p.name,
    badge,
    rating: p.reviewStats?.ratingAverage || 5,
    soldCount: p.soldCount,
  };
};

export function Home() {
  const dispatch = useAppDispatch();
  const { homeProducts, topProducts, loading } = useAppSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchHomeProducts());
    dispatch(fetchTopProducts());
  }, [dispatch]);

  const popularProducts = homeProducts.popular.map(p => mapToUI(p, products.lavenderDream.src));
  const comfortProducts = homeProducts.comfort.map(p => mapToUI(p, products.pureElegance.src));
  const bearComboProducts = homeProducts.bearCombo.map(p => mapToUI(p, products.blushWhisper.src));
  const congratsProducts = homeProducts.congrats.map(p => mapToUI(p, products.purpleSymphony.src));

  const bestSellers = topProducts?.bestSellers
    ? topProducts.bestSellers.map(p => mapToUI(p, products.lavenderDream.src))
    : [];
  const mostViewed = topProducts?.mostViewed
    ? topProducts.mostViewed.map(p => mapToUI(p, products.purpleSymphony.src))
    : [];

  return (
    <>
      <Hero />
      <FeaturedCategories />

      {/* Flagship: Horizontal carousels duo for top-performing items */}
      <div className="flex flex-col gap-16 py-8 md:gap-24">
        {(loading || (topProducts && bestSellers.length > 0)) && (
          <TopProductsSlider
            title="Sản phẩm bán chạy nhất"
            subtitle="Top 10 bó hoa tươi thắm được quý khách ưu ái và đặt nhiều nhất tại UTE SHOP."
            products={bestSellers}
            isLoading={loading && !topProducts}
            viewAllHref="/products"
          />
        )}

        {(loading || (topProducts && mostViewed.length > 0)) && (
          <TopProductsSlider
            title="Sản phẩm được xem nhiều nhất"
            subtitle="Top 10 thiết kế nhận được sự quan tâm và lượt xem nhiều nhất tuần qua."
            products={mostViewed}
            isLoading={loading && !topProducts}
            viewAllHref="/products"
          />
        )}
      </div>

      {popularProducts.length > 0 && (
        <ProductRowSection
          title="Bó hoa được yêu thích"
          subtitle="Những thiết kế được đặt nhiều nhất tại UTESHOP."
          products={popularProducts}
        />
      )}
      {comfortProducts.length > 0 && (
        <ProductRowSection
          title="Hoa an ủi"
          subtitle="Trao lời chia sẻ nhẹ nhàng, chân thành."
          products={comfortProducts}
        />
      )}
      {bearComboProducts.length > 0 && (
        <ProductRowSection
          title="Combo gấu & hoa"
          subtitle="Quà kèm gấu bông — đáng yêu và đầy đủ."
          products={bearComboProducts}
        />
      )}
      {congratsProducts.length > 0 && (
        <ProductRowSection
          title="Hoa chúc mừng"
          subtitle="Khai trương, thăng chức, thành công."
          products={congratsProducts}
        />
      )}
      <OccasionByEvent />
      <CustomerTestimonials />
      <PromoBanner />
    </>
  );
}

