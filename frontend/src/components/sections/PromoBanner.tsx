import { BgImage } from "@/components/ui/BgImage";
import { images } from "@/lib/images";

const ctaBg = images.home.promo.ctaBackground;

export function PromoBanner() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-crystal-border shadow-[0_16px_48px_rgba(49,27,146,0.1)] sm:rounded-[2rem] md:rounded-[2.25rem]">
        <BgImage
          src={ctaBg.src}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-pure-ivory/15 via-transparent to-lavender-mist/20"
        />

        <div className="relative z-[2] flex flex-col items-center justify-center p-8 md:p-10 lg:p-12">
          <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-4 text-center">
            <h2 className="font-section-title text-[clamp(1.5rem,1rem+2vw,2.5rem)] font-semibold leading-tight tracking-tight text-deep-plum">
              Gửi yêu thương ngập tràn nay
            </h2>
            <p className="font-home-heading text-sm leading-relaxed text-midnight-purple/88 sm:text-base">
              Giảm 10% cho đơn từ 500.000đ. Khi áp dụng cho mọi sản phẩm.
            </p>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                className="btn-hero-cta-gradient font-home-heading inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold md:px-9"
              >
                Đặt hoa ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
