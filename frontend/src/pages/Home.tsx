import { CustomerTestimonials } from "@/components/sections/CustomerTestimonials";
import { FeaturedCategories } from "@/components/sections/FeaturedCategories";
import { Hero } from "@/components/sections/Hero";
import { OccasionByEvent } from "@/components/sections/OccasionByEvent";
import { ProductRowSection } from "@/components/sections/ProductRowSection";
import { PromoBanner } from "@/components/sections/PromoBanner";
import type { Product } from "@/components/ui/ProductCard";
import { images } from "@/lib/images";

const { products } = images;

const POPULAR_PRODUCTS: Product[] = [
  {
    id: "lavender-dream",
    name: "Bó Lavender Mộng Mơ",
    description: "Hồng pastel, cẩm chướng, lá bạc",
    price: "1.230.000đ",
    imageUrl: products.lavenderDream.src,
    imageAlt: products.lavenderDream.alt,
    badge: { label: "Bán chạy", tone: "default" },
    rating: 5,
  },
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
    badge: { label: "Mới", tone: "pink" },
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

const COMFORT_PRODUCTS: Product[] = [
  {
    id: "c1",
    name: "Bó Trắng An Nhiên",
    description: "Cúc trắng, lay ơn, eucalyptus",
    price: "890.000đ",
    imageUrl: products.pureElegance.src,
    imageAlt: products.pureElegance.alt,
    rating: 5,
  },
  {
    id: "c2",
    name: "Bó Tím Tri Ân",
    description: "Cát tường, hồng sen",
    price: "720.000đ",
    imageUrl: products.purpleSymphony.src,
    imageAlt: products.purpleSymphony.alt,
    badge: { label: "Mới", tone: "pink" },
    rating: 5,
  },
  {
    id: "c3",
    name: "Bó Pastel Dịu Dàng",
    description: "Hồng kem, baby breath",
    price: "650.000đ",
    imageUrl: products.blushWhisper.src,
    imageAlt: products.blushWhisper.alt,
    rating: 4,
  },
  {
    id: "c4",
    name: "Bó Lavender Dỗi Yêu",
    description: "Hồng tím, thạch thảo",
    price: "580.000đ",
    imageUrl: products.lavenderDream.src,
    imageAlt: products.lavenderDream.alt,
    rating: 5,
  },
];

const BEAR_COMBO_PRODUCTS: Product[] = [
  {
    id: "b1",
    name: "Combo Gấu & Hồng",
    description: "Gấu bông + bó hồng 9 bông",
    price: "1.100.000đ",
    imageUrl: products.lavenderDream.src,
    imageAlt: products.lavenderDream.alt,
    badge: { label: "Bán chạy", tone: "default" },
    rating: 5,
  },
  {
    id: "b2",
    name: "Combo Sweet Hug",
    description: "Gấu nhỏ + tulip pastel",
    price: "980.000đ",
    imageUrl: products.blushWhisper.src,
    imageAlt: products.blushWhisper.alt,
    rating: 5,
  },
  {
    id: "b3",
    name: "Combo Big Bear",
    description: "Gấu lớn + mix hồng tím",
    price: "1.450.000đ",
    imageUrl: products.purpleSymphony.src,
    imageAlt: products.purpleSymphony.alt,
    rating: 5,
  },
  {
    id: "b4",
    name: "Combo Baby Love",
    description: "Gấu + hoa baby breath",
    price: "860.000đ",
    imageUrl: products.pureElegance.src,
    imageAlt: products.pureElegance.alt,
    rating: 4,
  },
];

const CONGRATS_PRODUCTS: Product[] = [
  {
    id: "g1",
    name: "Bó Khai Trương Đại Phát",
    description: "Đồng tiền, lan vàng",
    price: "1.890.000đ",
    imageUrl: products.purpleSymphony.src,
    imageAlt: products.purpleSymphony.alt,
    badge: { label: "Mới", tone: "pink" },
    rating: 5,
  },
  {
    id: "g2",
    name: "Bó Sunlight Office",
    description: "Hướng dương, cúc vàng",
    price: "1.350.000đ",
    imageUrl: products.lavenderDream.src,
    imageAlt: products.lavenderDream.alt,
    rating: 5,
  },
  {
    id: "g3",
    name: "Bó Hồng Sen Chúc Mừng",
    description: "Hồng sen, lá xanh",
    price: "1.050.000đ",
    imageUrl: products.blushWhisper.src,
    imageAlt: products.blushWhisper.alt,
    rating: 5,
  },
  {
    id: "g4",
    name: "Bó Orchid Premium",
    description: "Lan hồ điệp trắng",
    price: "2.200.000đ",
    imageUrl: products.pureElegance.src,
    imageAlt: products.pureElegance.alt,
    badge: { label: "Bán chạy", tone: "default" },
    rating: 5,
  },
];

export function Home() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <ProductRowSection
        title="Bó hoa được yêu thích"
        subtitle="Những thiết kế được đặt nhiều nhất tại UTESHOP."
        products={POPULAR_PRODUCTS}
      />
      <ProductRowSection
        title="Hoa an ủi"
        subtitle="Trao lời chia sẻ nhẹ nhàng, chân thành."
        products={COMFORT_PRODUCTS}
      />
      <ProductRowSection
        title="Combo gấu & hoa"
        subtitle="Quà kèm gấu bông — đáng yêu và đầy đủ."
        products={BEAR_COMBO_PRODUCTS}
      />
      <ProductRowSection
        title="Hoa chúc mừng"
        subtitle="Khai trương, thăng chức, thành công."
        products={CONGRATS_PRODUCTS}
      />
      <OccasionByEvent />
      <CustomerTestimonials />
      <PromoBanner />
    </>
  );
}
