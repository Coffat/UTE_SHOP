import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppLogo } from "@/components/ui/AppLogo";
import { FacebookGlyph } from "@/icons";

const aboutLinks = [
  { label: "Câu chuyện thương hiệu", href: "#" },
  { label: "Đội ngũ florist", href: "#" },
  { label: "Báo chí nói về UTESHOP", href: "#" },
];

const policyLinks = [
  { label: "Chính sách giao hàng", href: "#" },
  { label: "Đổi trả & hoàn tiền", href: "#" },
  { label: "Điều khoản sử dụng", href: "#" },
];

const supportLinks = [
  { label: "Hướng dẫn chăm sóc hoa", href: "#" },
  { label: "Câu hỏi thường gặp", href: "#" },
  { label: "Liên hệ", href: "#" },
];

function SocialButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-pure-ivory transition hover:bg-white/15"
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-footer-surface px-margin-mobile pb-8 pt-12 text-inverse-on-surface md:px-margin-desktop md:pb-10 md:pt-16">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 sm:grid-cols-2 md:gap-12 lg:max-w-[1600px] lg:grid-cols-5 lg:gap-10 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
        <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-flex w-fit items-center gap-2" aria-label="UTESHOP trang chủ">
            <AppLogo variant="header" withText textClassName="text-pure-ivory font-home-heading text-xl font-bold tracking-wide" />
          </Link>
          <p className="max-w-sm font-home-heading text-sm leading-relaxed text-dusk-gray">
            UTESHOP — cửa hàng hoa số với những bó hoa thủ công, tươi mỗi ngày, giao nhanh và đồng cảm cùng từng dịp của bạn.
          </p>
          <div className="flex flex-wrap gap-3">
            <SocialButton href="#" label="Facebook">
              <FacebookGlyph className="h-5 w-5" />
            </SocialButton>
            <SocialButton href="#" label="Instagram">
              <Icon icon="mdi:instagram" className="text-xl" />
            </SocialButton>
            <SocialButton href="#" label="TikTok">
              <Icon icon="simple-icons:tiktok" className="text-lg" />
            </SocialButton>
            <SocialButton href="#" label="YouTube">
              <Icon icon="mdi:youtube" className="text-xl" />
            </SocialButton>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-home-heading text-sm font-bold uppercase tracking-wider text-pure-ivory">
            Về chúng tôi
          </h4>
          <ul className="flex flex-col gap-2.5">
            {aboutLinks.map((l) => (
              <li key={l.label}>
                <a className="font-home-heading text-sm text-dusk-gray transition hover:text-soft-amethyst" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-home-heading text-sm font-bold uppercase tracking-wider text-pure-ivory">
            Chính sách
          </h4>
          <ul className="flex flex-col gap-2.5">
            {policyLinks.map((l) => (
              <li key={l.label}>
                <a className="font-home-heading text-sm text-dusk-gray transition hover:text-soft-amethyst" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-home-heading text-sm font-bold uppercase tracking-wider text-pure-ivory">Hỗ trợ</h4>
          <ul className="flex flex-col gap-2.5">
            {supportLinks.map((l) => (
              <li key={l.label}>
                <a className="font-home-heading text-sm text-dusk-gray transition hover:text-soft-amethyst" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <h4 className="mb-2 font-home-heading text-sm font-bold uppercase tracking-wider text-pure-ivory">
            Kết nối với chúng tôi
          </h4>
          <p className="mb-4 font-home-heading text-sm text-dusk-gray">Đăng ký nhận ưu đãi và mẹo chọn hoa mỗi tuần.</p>
          <form className="relative flex w-full max-w-md" action="#" method="post">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="footer-newsletter-email"
              className="w-full rounded-full border border-white/15 bg-white/5 py-3 pl-4 pr-14 font-home-heading text-sm text-pure-ivory placeholder:text-dusk-gray focus:border-dreamy-purple/50 focus:outline-none focus:ring-1 focus:ring-dreamy-purple/40"
              placeholder="Email của bạn"
              type="email"
              autoComplete="email"
            />
            <button
              type="submit"
              aria-label="Đăng ký"
              className="absolute right-1 top-1 bottom-1 flex aspect-square items-center justify-center rounded-full bg-primary text-pure-ivory transition hover:bg-dreamy-purple"
            >
              <MaterialIcon name="arrow_forward" className="text-lg" />
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[1440px] border-t border-white/10 pt-8 text-center lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
        <p className="font-home-heading text-xs text-dusk-gray">© {new Date().getFullYear()} UTESHOP. All rights reserved.</p>
      </div>
    </footer>
  );
}
