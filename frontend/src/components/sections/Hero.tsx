import { motion, useReducedMotion } from "framer-motion";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { BgImage } from "@/components/ui/BgImage";
import { images } from "@/lib/images";

const bg = images.hero.backgroundSection;
const primary = images.hero.primaryBouquet;

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const springTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: "spring" as const, stiffness: 100, damping: 18 };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springTransition,
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : { type: "spring" as const, stiffness: 80, damping: 20, delay: 0.15 },
    },
  };

  return (
    <section
      aria-label="Giới thiệu UTESHOP"
      className="relative w-full overflow-hidden pt-28 pb-16 md:min-h-[min(92vh,880px)] md:pt-32 md:pb-20 lg:pt-36 lg:pb-24"
    >
      <BgImage
        src={bg.src}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        aria-hidden
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-pure-ivory/25 via-transparent to-lavender-mist/30"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] lg:grid lg:grid-cols-12 lg:items-center lg:gap-8 xl:gap-10 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
        
        {/* Left Column: Cascaded Entrance content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex max-w-xl flex-col gap-5 lg:col-span-4 lg:max-w-none lg:py-4 xl:gap-6"
        >
          <motion.h1
            variants={itemVariants}
            className="font-slogan text-[clamp(1.5rem,0.95rem+2.2vw,2.65rem)] font-bold uppercase italic leading-snug tracking-wide text-deep-plum"
          >
            Trao gửi chân tình qua từng cành hoa
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            className="font-home-heading max-w-lg text-base leading-relaxed text-midnight-purple/90 md:text-lg"
          >
            Mỗi bó hoa là cả tấm lòng, thay bạn nói lời yêu thương đến những người trân quý.
          </motion.p>
          
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
            <button
              type="button"
              className="btn-hero-cta-gradient font-home-heading inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-transform md:px-9 active-press cursor-pointer hover:shadow-lg"
            >
              Đặt hoa ngay
            </button>
            <button
              type="button"
              className="font-home-heading inline-flex items-center justify-center rounded-full border border-crystal-border bg-surface-container-high px-7 py-3 text-sm font-semibold text-deep-plum shadow-sm transition-colors duration-200 hover:bg-pure-ivory md:px-8 active-press cursor-pointer"
            >
              Xem bộ sưu tập
            </button>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-6 pt-3 md:gap-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tertiary-fixed/50 text-tertiary">
                <MaterialIcon name="diamond" filled className="text-[22px]" />
              </span>
              <div>
                <p className="font-home-heading text-sm font-semibold text-deep-plum">Giao nhanh 2h</p>
                <p className="font-home-heading text-xs text-dusk-gray">Nội thành chọn khu vực</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-safe-mint/50 text-primary">
                <MaterialIcon name="local_florist" className="text-[22px]" />
              </span>
              <div>
                <p className="font-home-heading text-sm font-semibold text-deep-plum">Hoa tươi mỗi ngày</p>
                <p className="font-home-heading text-xs text-dusk-gray">Nhập mới theo đơn</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Blossoming Spring Flower Image */}
        <div className="relative flex w-full justify-center lg:col-span-8 lg:justify-end lg:pl-2">
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-[min(100%,340px)] sm:max-w-[min(100%,380px)] md:max-w-[min(100%,400px)] lg:max-w-[min(100%,420px)] xl:max-w-[min(100%,460px)]"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/95 p-2.5 shadow-[0_20px_48px_rgba(49,27,146,0.1)] sm:rounded-[2rem] sm:p-3 md:rounded-[2.25rem] md:p-3.5 group">
              <img
                src={primary.src}
                alt={primary.alt}
                className="aspect-[4/5] w-full rounded-[1.25rem] object-cover object-center sm:rounded-[1.5rem] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                width={460}
                height={575}
                loading="eager"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
