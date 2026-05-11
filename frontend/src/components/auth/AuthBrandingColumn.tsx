import { MaterialIcon } from "@/components/ui/MaterialIcon";

type AuthBrandingColumnProps = {
  /** Đoạn mô tả dưới slogan (khác nhau giữa login / đăng ký / quên MK) */
  bodyText: string;
};

export function AuthBrandingColumn({ bodyText }: AuthBrandingColumnProps) {
  return (
    <div className="flex flex-col justify-center pb-10 lg:pb-0 lg:pr-4">
      <div className="mb-8 flex items-center gap-3 text-pure-ivory">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/50 bg-petal-pink/90 shadow-sm">
          <MaterialIcon name="local_florist" className="text-[22px] text-primary" filled />
        </div>
        <span className="font-body-standard text-lg font-bold tracking-[0.2em] text-pure-ivory">
          UTESHOP
        </span>
      </div>

      <h1 className="login-gradient-text font-body-standard text-4xl font-bold uppercase tracking-wide sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
        UTESHOP
      </h1>

      <p className="font-slogan mt-4 flex flex-wrap items-center gap-2 text-2xl text-deep-plum sm:text-3xl">
        Trao hoa – Gửi yêu thương
        <MaterialIcon name="favorite" className="text-[#ff758c] text-[1.35rem] icon-fill" />
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
