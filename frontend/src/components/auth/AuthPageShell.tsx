import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AuthBrandingColumn } from "./AuthBrandingColumn";

type AuthPageShellProps = {
  brandingBodyText: string;
  children: ReactNode;
};

export function AuthPageShell({ brandingBodyText, children }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col text-midnight-purple">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/login_background.png)" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-deep-plum/25 via-transparent to-primary/20"
        aria-hidden
      />

      {/* Nút Về trang chủ nổi bật trên góc */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-white/60 bg-pure-ivory/20 px-3.5 py-2 font-ui-label text-xs font-bold text-pure-ivory backdrop-blur-md transition-all duration-300 hover:bg-pure-ivory hover:text-deep-plum hover:border-white shadow-sm md:top-6 md:left-8 md:text-sm md:px-4 md:py-2.5"
      >
        <MaterialIcon name="arrow_back" className="text-sm md:text-base shrink-0" />
        <span>Về trang chủ</span>
      </Link>

      <div className="relative z-10 flex flex-1 flex-col px-margin-mobile py-8 md:px-margin-desktop md:py-10 lg:py-12">
        <div className="mx-auto flex w-full max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] flex-1 items-center justify-center">
          <div
            className="w-full max-w-[1200px] rounded-[28px] border border-white/50 bg-pure-ivory/20 p-6 shadow-[0_10px_40px_rgba(168,85,247,0.08)] backdrop-blur-[28px] sm:rounded-[32px] sm:p-8 md:p-10 lg:grid lg:grid-cols-[1fr_minmax(320px,440px)] lg:gap-10 lg:p-12"
            style={{ WebkitBackdropFilter: "blur(28px)" }}
          >
            <AuthBrandingColumn bodyText={brandingBodyText} />
            {children}
          </div>
        </div>

        <p className="mt-auto pt-6 text-center font-body-standard text-xs text-pure-ivory/75 sm:text-sm">
          © 2026 UTESHOP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
