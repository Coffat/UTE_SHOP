import { MaterialIcon } from "@/components/ui/MaterialIcon";

const OCCASIONS = [
  { icon: "cake", label: "Sinh nhật", href: "#" },
  { icon: "favorite", label: "Tình yêu", href: "#" },
  { icon: "storefront", label: "Khai trương", href: "#" },
  { icon: "celebration", label: "Chúc mừng", href: "#" },
];

export function OccasionNavigation() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto w-full">
      <div className="text-center mb-10 md:mb-16">
        <h2 className="font-section-title text-deep-plum text-3xl sm:text-4xl lg:text-section-title">
          Chọn hoa theo dịp
        </h2>
        <p className="font-body-standard text-dusk-gray mt-2">
          Tìm kiếm món quà hoàn hảo cho từng khoảnh khắc
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {OCCASIONS.map((occasion) => (
          <a
            key={occasion.label}
            className="group flex flex-col items-center gap-4 cursor-pointer"
            href={occasion.href}
          >
            <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 3xl:w-40 3xl:h-40 rounded-full bg-pure-ivory/60 border border-crystal-border shadow-sm flex items-center justify-center group-hover:bg-soft-amethyst/50 group-hover:shadow-[0_10px_30px_rgba(192,132,252,0.15)] transition-[background-color,box-shadow] duration-300">
              <MaterialIcon
                name={occasion.icon}
                className="text-[32px] md:text-[36px] lg:text-[40px] xl:text-[48px] 3xl:text-[56px] text-deep-plum group-hover:text-primary transition-colors font-light"
              />
            </div>
            <span className="font-sub-heading text-[20px] text-midnight-purple group-hover:text-deep-plum">
              {occasion.label}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
