import { MaterialIcon } from "@/components/ui/MaterialIcon";

const INDICATORS = [
  {
    icon: "local_shipping",
    title: "Giao trong ngày",
    description: "Miễn phí nội thành HN & HCM",
    iconWrapper: "bg-soft-amethyst/30",
  },
  {
    icon: "local_florist",
    title: "Hoa tươi mỗi ngày",
    description: "Cam kết hoa tươi 100%",
    iconWrapper: "bg-petal-pink/30",
  },
  {
    icon: "photo_camera",
    title: "Ảnh thật trước khi giao",
    description: "Kiểm duyệt chất lượng gắt gao",
    iconWrapper: "bg-safe-mint/30",
  },
  {
    icon: "favorite",
    title: "Hỗ trợ 24/7",
    description: "Tư vấn tận tâm, nhiệt tình",
    iconWrapper: "bg-dreamy-purple/20",
  },
];

export function TrustIndicators() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto w-full border-t border-b border-crystal-border py-10 md:py-16 lg:py-20 xl:py-24 bg-pure-ivory/30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {INDICATORS.map((indicator) => (
          <div
            key={indicator.title}
            className="flex flex-col items-center text-center gap-4"
          >
            <div
              className={`w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-full ${indicator.iconWrapper} flex items-center justify-center text-primary`}
            >
              <MaterialIcon
                name={indicator.icon}
                className="text-[32px] lg:text-[36px] xl:text-[44px] font-light"
              />
            </div>
            <div className="px-2">
              <h4 className="font-ui-label text-deep-plum text-base lg:text-lg xl:text-xl mb-1">
                {indicator.title}
              </h4>
              <p className="font-body-standard text-sm lg:text-base text-dusk-gray">
                {indicator.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
