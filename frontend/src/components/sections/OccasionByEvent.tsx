import { Link } from "react-router-dom";
import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

const { occasions } = images.home;

const CARDS = [
  {
    title: "Ngày Valentine",
    priceFrom: "Từ 450.000đ",
    href: "#",
    image: occasions.valentine,
    mesh: "from-petal-pink/25 via-soft-amethyst/15 to-lavender-mist/80",
  },
  {
    title: "Ngày 8/3",
    priceFrom: "Từ 520.000đ",
    href: "#",
    image: occasions.womensDay,
    mesh: "from-soft-amethyst/30 via-primary-fixed/20 to-lavender-mist/80",
  },
  {
    title: "Ngày của Mẹ",
    priceFrom: "Từ 590.000đ",
    href: "#",
    image: occasions.mothersDay,
    mesh: "from-safe-mint/25 via-soft-amethyst/15 to-lavender-mist/80",
  },
  {
    title: "Tốt nghiệp",
    priceFrom: "Từ 480.000đ",
    href: "#",
    image: occasions.graduation,
    mesh: "from-tertiary-fixed/20 via-primary-fixed/15 to-lavender-mist/80",
  },
] as const;

export function OccasionByEvent() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <h2 className="font-home-heading text-2xl font-bold text-primary sm:text-3xl md:text-4xl">Bó hoa tặng theo dịp</h2>
          <p className="font-home-heading mt-1 max-w-2xl text-sm text-dusk-gray md:text-base">
            Bộ sưu tập theo ngày lễ được chọn lọc — gợi ý giá khởi điểm để bạn dễ dự trù.
          </p>
        </div>
        <Link
          to="#"
          className="font-home-heading mt-2 flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-primary hover:text-deep-plum sm:mt-0 sm:self-auto"
        >
          Xem tất cả
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="group relative flex min-h-[232px] flex-col overflow-hidden rounded-3xl border border-crystal-border bg-pure-ivory/70 shadow-[0_10px_40px_rgba(168,85,247,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_48px_rgba(168,85,247,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-lavender-mist sm:min-h-[248px] lg:min-h-[260px]"
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.mesh}`}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 55% at 50% 25%, var(--color-primary-fixed) 0, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, var(--color-soft-amethyst) 0, transparent 45%)",
              }}
            />

            <div className="relative z-[1] flex flex-1 flex-col px-4 pt-5 sm:px-5 sm:pt-6">
              <div className="flex min-h-[120px] flex-1 items-center justify-center sm:min-h-[128px]">
                <div className="relative aspect-square w-[min(88%,210px)] max-w-[210px]">
                  <BgImage
                    src={card.image.src}
                    alt={card.image.alt}
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.97] transition-opacity duration-300 group-hover:opacity-100"
                  />
                </div>
              </div>

              <div className="relative z-[2] mt-auto mb-4 rounded-2xl border border-white/60 bg-pure-ivory/80 px-4 py-3 shadow-sm backdrop-blur-md sm:mb-5">
                <p className="font-home-heading text-lg font-bold leading-snug text-deep-plum sm:text-xl">{card.title}</p>
                <p className="font-home-heading mt-1 text-sm font-semibold text-primary sm:text-base">{card.priceFrom}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
