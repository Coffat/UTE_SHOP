import { Link } from "react-router-dom";
import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

const { categories } = images.home;

const ITEMS = [
  { label: "Sinh nhật", href: "/category/hoa-ky-niem", image: categories.birthday },
  { label: "Khai trương", href: "/category/hoa-chuc-mung", image: categories.opening },
  { label: "Tình yêu", href: "/category/hoa-ky-niem", image: categories.love },
  { label: "Chúc mừng", href: "/category/hoa-chuc-mung", image: categories.congrats },
  { label: "An ủi", href: "/category/hoa-ky-niem", image: categories.sympathy },
  { label: "Đặt theo yêu cầu", href: "/category/tiec-va-su-kien", image: categories.custom },
] as const;

export function FeaturedCategories() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <h2 className="font-home-heading text-2xl font-bold text-primary sm:text-3xl md:text-4xl">Danh mục nổi bật</h2>
          <p className="font-home-heading mt-1 max-w-2xl text-sm text-dusk-gray md:text-base">
            Mỗi khoảnh khắc đều xứng đáng một bó hoa phù hợp — chọn nhanh theo tình huống của bạn.
          </p>
        </div>
        <Link
          to="/categories"
          className="font-home-heading mt-2 flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-primary hover:text-deep-plum sm:mt-0 sm:self-auto"
        >
          Xem tất cả
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 lg:grid lg:snap-none lg:grid-cols-6 lg:items-stretch lg:gap-5 lg:overflow-visible xl:gap-6 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group flex w-[42vw] min-w-[148px] max-w-[168px] shrink-0 snap-start flex-col rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-lavender-mist sm:min-w-[156px] sm:max-w-[175px] lg:min-h-0 lg:w-auto lg:min-w-0 lg:max-w-none"
          >
            <div className="flex h-full min-h-[44px] flex-col gap-3 rounded-3xl border border-crystal-border bg-pure-ivory/70 p-3 backdrop-blur-xl hover-lift sm:p-3.5 lg:gap-3.5">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/50 bg-lavender-mist/40">
                <BgImage
                  src={item.image.src}
                  alt={item.image.alt}
                  className="absolute inset-0 image-hover-zoom"
                />
              </div>
              <span className="font-home-heading px-0.5 text-center text-xs font-semibold text-midnight-purple transition-colors group-hover:text-primary sm:text-sm">
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
