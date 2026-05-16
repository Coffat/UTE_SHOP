import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import { images } from "@/lib/images";

const PRODUCTS: Product[] = [
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    description: "Hoa hồng tím, cẩm chướng, lá bạc",
    price: "850.000 ₫",
    imageUrl: images.products.lavenderDream.src,
    imageAlt: images.products.lavenderDream.alt,
    badge: { label: "Bán chạy", tone: "default" },
  },
  {
    id: "blush-whisper",
    name: "Blush Whisper",
    description: "Tulip hồng, mao lương trắng",
    price: "1.200.000 ₫",
    imageUrl: images.products.blushWhisper.src,
    imageAlt: images.products.blushWhisper.alt,
  },
  {
    id: "purple-symphony",
    name: "Purple Symphony",
    description: "Cát tường tím, cẩm tú cầu",
    price: "950.000 ₫",
    imageUrl: images.products.purpleSymphony.src,
    imageAlt: images.products.purpleSymphony.alt,
    badge: { label: "Mới", tone: "pink" },
  },
  {
    id: "pure-elegance",
    name: "Pure Elegance",
    description: "Lan hồ điệp trắng cao cấp",
    price: "2.500.000 ₫",
    imageUrl: images.products.pureElegance.src,
    imageAlt: images.products.pureElegance.alt,
    className: "hidden lg:block",
  },
];

export function BestSellers() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto w-full">
      <div className="flex justify-between items-end mb-8 md:mb-12">
        <div>
          <h2 className="font-section-title text-deep-plum text-3xl sm:text-4xl lg:text-section-title">
            Bó hoa được yêu thích nhất
          </h2>
          <p className="font-body-standard text-dusk-gray mt-2">
            Những thiết kế mang dấu ấn riêng của UTESHOP
          </p>
        </div>
        <a
          className="hidden md:flex items-center gap-2 text-primary font-ui-label hover:text-deep-plum transition-colors"
          href="#"
        >
          Xem tất cả
          <MaterialIcon name="arrow_forward" className="text-[18px]" />
        </a>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-gutter lg:grid-cols-4">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
