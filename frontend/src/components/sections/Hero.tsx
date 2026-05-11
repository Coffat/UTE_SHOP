import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

const hero = images.hero.background;

export function Hero() {
  return (
    <section
      aria-label={hero.alt}
      data-alt={hero.alt}
      className="relative w-full min-h-[640px] md:min-h-[760px] lg:min-h-[860px] xl:min-h-[920px] 3xl:min-h-[1040px] overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${hero.src}')` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-lavender-mist/90 via-lavender-mist/60 to-lavender-mist/40 md:bg-gradient-to-r md:from-lavender-mist/85 md:via-lavender-mist/40 md:to-transparent"
      />

      <div className="relative z-10 max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto px-margin-mobile md:px-margin-desktop pt-28 md:pt-32 lg:pt-36 xl:pt-40 3xl:pt-44 pb-20 flex items-center min-h-[inherit]">
        <div className="flex flex-col gap-6 max-w-[560px] xl:max-w-[640px] 3xl:max-w-[720px]">
          <h1 className="font-hero-display font-normal uppercase text-deep-plum tracking-[0.02em] leading-[1.1] text-[clamp(3rem,2rem+4vw,7rem)]">
            Hoa nói
            <br />
            lời yêu
          </h1>
          <p className="font-body-standard text-midnight-purple/80 max-w-md text-base md:text-lg">
            Bó hoa thủ công cho từng khoảnh khắc đặc biệt trong cuộc sống.
          </p>
          <div className="pt-2">
            <button
              type="button"
              className="group inline-flex items-center gap-3 self-start pl-7 pr-2 py-2 rounded-full bg-pure-ivory/70 backdrop-blur-md border border-crystal-border text-deep-plum font-ui-label tracking-[0.2em] uppercase shadow-sm hover:bg-pure-ivory transition-all"
            >
              <span>Mua ngay</span>
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-deep-plum/10 text-deep-plum group-hover:bg-deep-plum group-hover:text-pure-ivory transition-colors">
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
