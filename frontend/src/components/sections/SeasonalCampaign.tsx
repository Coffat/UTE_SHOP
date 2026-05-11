import { images } from "@/lib/images";

const campaign = images.campaigns.mothersDay;

export function SeasonalCampaign() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto w-full">
      <div
        role="img"
        aria-label={campaign.alt}
        data-alt={campaign.alt}
        className="relative min-h-[420px] md:min-h-[400px] lg:min-h-[460px] xl:min-h-[520px] 3xl:min-h-[600px] w-full rounded-[32px] overflow-hidden flex items-center justify-center p-4 md:p-8 bg-cover bg-center shadow-lg"
        style={{ backgroundImage: `url('${campaign.src}')` }}
      >
        <div className="glass-panel p-6 md:p-10 rounded-3xl max-w-[600px] xl:max-w-[720px] 3xl:max-w-[840px] text-center flex flex-col items-center gap-4 relative z-10">
          <span className="text-primary font-ui-label tracking-widest uppercase text-sm">
            Campaign Độc Quyền
          </span>
          <h2 className="font-section-title text-deep-plum text-2xl sm:text-3xl md:text-4xl xl:text-5xl 3xl:text-6xl">
            Bộ sưu tập Ngày của Mẹ
          </h2>
          <p className="font-body-standard text-midnight-purple">
            Dành tặng những cánh hoa tươi thắm nhất thay cho lời cảm ơn chân thành tới người phụ nữ tuyệt vời nhất.
          </p>
          <button
            type="button"
            className="mt-4 bg-pure-ivory text-deep-plum border border-crystal-border px-8 py-3 rounded-full font-ui-label text-base hover:bg-soft-amethyst transition-colors shadow-sm"
          >
            Xem bộ sưu tập
          </button>
        </div>
      </div>
    </section>
  );
}
