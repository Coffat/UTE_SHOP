import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function Footer() {
  return (
    <footer className="w-full bg-plum-surface text-inverse-on-surface mt-auto rounded-t-[40px] px-margin-mobile md:px-margin-desktop py-12 md:py-16 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-dreamy-purple/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 relative z-10">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
          <a className="flex items-center gap-3" href="#">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <MaterialIcon name="local_florist" className="text-inverse-on-surface" />
            </div>
            <span className="font-hero-display text-[24px] text-pure-ivory tracking-wide">
              UTESHOP
            </span>
          </a>
          <p className="font-body-standard text-dusk-gray text-sm">
            A digital floral boutique crafting poetic arrangements for your most cherished moments.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-ui-label text-pure-ivory tracking-widest uppercase text-xs mb-2">
            Explore
          </h4>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Our Story
          </a>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Collections
          </a>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Sustainability
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-ui-label text-pure-ivory tracking-widest uppercase text-xs mb-2">
            Support
          </h4>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Floral Care
          </a>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Shipping &amp; Returns
          </a>
          <a
            className="font-body-standard text-dusk-gray hover:text-soft-amethyst transition-colors text-sm"
            href="#"
          >
            Contact Us
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-ui-label text-pure-ivory tracking-widest uppercase text-xs mb-2">
            Stay Connected
          </h4>
          <p className="font-body-standard text-dusk-gray text-sm mb-2">
            Subscribe for floral inspiration and exclusive offers.
          </p>
          <form className="flex relative w-full" action="#" method="post">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-pure-ivory focus:outline-none focus:border-dreamy-purple/50 backdrop-blur-sm font-body-standard placeholder:text-dusk-gray"
              placeholder="Your email address"
              type="email"
              aria-label="Email address"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="absolute right-1 top-1 bottom-1 aspect-square rounded-full bg-dreamy-purple text-deep-plum flex items-center justify-center hover:bg-soft-amethyst transition-colors"
            >
              <MaterialIcon name="arrow_forward" className="text-sm" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <p className="font-body-standard text-dusk-gray text-xs">
          © 2026 UTESHOP. All rights reserved. Neo-Glassmorphism Edition.
        </p>
        <div className="flex gap-4">
          <a
            className="text-dusk-gray hover:text-soft-amethyst transition-colors text-xs font-ui-label"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-dusk-gray hover:text-soft-amethyst transition-colors text-xs font-ui-label"
            href="#"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
