import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppLogo } from "@/components/ui/AppLogo";

type AuthBrandingColumnProps = {
  /** Đoạn mô tả dưới slogan (khác nhau giữa login / đăng ký / quên MK) */
  bodyText: string;
};

export function AuthBrandingColumn({ bodyText }: AuthBrandingColumnProps) {
  return (
    <div className="flex flex-col justify-center pb-10 lg:pb-0 lg:pr-4">
      {/* Quay về trang chủ breadcrumb lãng mạn */}
      <Link
        to="/"
        className="group mb-6 inline-flex items-center gap-2.5 self-start font-ui-label text-[11px] font-bold uppercase tracking-widest text-[#7158e2] transition-colors duration-300 hover:text-[#ff758c]"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-soft-amethyst/30 text-[#7158e2] transition-all duration-300 group-hover:-translate-x-1 group-hover:bg-[#ff758c] group-hover:text-pure-ivory shadow-[0_2px_8px_rgba(113,88,226,0.08)]">
          <MaterialIcon name="arrow_back" className="text-xs shrink-0" />
        </span>
        <span>Về trang chủ</span>
      </Link>

      <div className="mb-8 flex items-center">
        <Link to="/" title="Quay về trang chủ" className="inline-block transition-transform duration-300 hover:scale-[1.02]">
          <AppLogo
            variant="auth"
            withText
            className="h-16 sm:h-18 lg:h-20"
            textClassName="text-2xl sm:text-3xl"
            alt="UTESHOP brand logo"
          />
        </Link>
      </div>

      <p className="font-slogan mt-4 flex flex-wrap items-center gap-2 text-2xl text-deep-plum sm:text-3xl">
        Trao hoa – Gửi yêu thương
        <MaterialIcon name="favorite" filled className="text-[#ff758c] text-[1.35rem]" />
      </p>

      <p className="mt-5 max-w-md text-body-standard text-midnight-purple/95">{bodyText}</p>

      <div
        className="mt-8 flex flex-wrap items-stretch justify-between gap-3 rounded-2xl border border-white/55 bg-pure-ivory/25 px-4 py-4 backdrop-blur-md sm:px-5"
        style={{ WebkitBackdropFilter: "blur(14px)" }}
      >
        {[
          { icon: "local_florist" as const, label: "Hoa tươi mỗi ngày", color: "text-[#ff758c]" },
          { icon: "shield" as const, label: "Thanh toán an toàn", color: "text-[#7158e2]" },
          { icon: "card_giftcard" as const, label: "Giao hàng toàn quốc", color: "text-[#5b8def]" },
        ].map(({ icon, label, color }) => (
          <div
            key={label}
            className="flex min-w-[100px] flex-1 flex-col items-center gap-2 text-center"
          >
            <MaterialIcon name={icon} className={`${color} text-[28px]`} filled />
            <span className="font-ui-label text-[11px] font-medium leading-tight text-deep-plum/90 sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
