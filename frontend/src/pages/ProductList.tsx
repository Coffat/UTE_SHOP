import { ProductCard } from "@/components/ui/ProductCard";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

const { products } = images;

// Mock data cho danh sách
const ALL_PRODUCTS = [
  {
    id: "lavender-dream",
    name: "Bó Lavender Mộng Mơ",
    description: "Hồng pastel, cẩm chướng, lá bạc",
    price: "1.230.000đ",
    imageUrl: products.lavenderDream.src,
    imageAlt: products.lavenderDream.alt,
    badge: { label: "Bán chạy", tone: "default" as const },
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
  {
    id: "p5",
    name: "Bó Trắng An Nhiên",
    description: "Cúc trắng, lay ơn",
    price: "890.000đ",
    imageUrl: products.pureElegance.src,
    imageAlt: products.pureElegance.alt,
    rating: 4,
  },
  {
    id: "p6",
    name: "Bó Pastel Dịu Dàng",
    description: "Hồng kem, baby breath",
    price: "650.000đ",
    imageUrl: products.blushWhisper.src,
    imageAlt: products.blushWhisper.alt,
    rating: 5,
  }
];

export function ProductList() {
  return (
    <div className="min-h-screen bg-lavender-mist pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <span className="mb-3 rounded-full bg-soft-amethyst/50 px-4 py-1 text-sm font-semibold tracking-wider text-deep-plum backdrop-blur-md">
            BỘ SƯU TẬP
          </span>
          <h1 className="mb-4 font-hero-display text-4xl font-bold text-deep-plum sm:text-5xl lg:text-6xl">
            Sắc Tím Yêu Thương
          </h1>
          <p className="max-w-2xl text-lg text-dusk-gray font-body-standard">
            Khám phá những thiết kế hoa độc bản được tạo nên từ cảm hứng mùa xuân. Mỗi bó hoa là một câu chuyện riêng, gửi gắm trọn vẹn chân tình.
          </p>
        </div>

        {/* Filters (Glassmorphism bar) */}
        <div className="glass-panel mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-deep-plum px-5 py-2 text-sm font-medium text-pure-ivory transition hover:bg-primary">
              Tất cả
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Kỷ Niệm
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Chúc Mừng
            </button>
            <button className="rounded-full bg-pure-ivory/50 px-5 py-2 text-sm font-medium text-midnight-purple transition hover:bg-soft-amethyst">
              Hoa Cưới
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-dusk-gray">Sắp xếp:</span>
            <select className="rounded-lg border border-crystal-border bg-pure-ivory/80 px-3 py-1.5 text-sm text-midnight-purple outline-none focus:border-dreamy-purple">
              <option>Mới nhất</option>
              <option>Bán chạy</option>
              <option>Giá thấp đến cao</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {ALL_PRODUCTS.map((product) => (
            <div key={product.id} className="relative group cursor-pointer">
              <ProductCard {...product} />
              {/* Optional: Add an invisible link overlay if we had a <Link> component here */}
              <a href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`Xem chi tiết ${product.name}`}></a>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-16 flex justify-center">
          <button className="btn-hero-cta-gradient rounded-full px-8 py-3 text-base font-medium shadow-lg hover:-translate-y-1 transition-transform">
            Xem thêm thiết kế
          </button>
        </div>

      </div>
    </div>
  );
}
