import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppLogo } from "@/components/ui/AppLogo";

type ErrorPageShellProps = {
  children: ReactNode;
};

/** Full-viewport shell for route error boundary (no app Layout). */
export function ErrorPageShell({ children }: ErrorPageShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-lavender-mist text-midnight-purple">
      <div
        className="pointer-events-none absolute -left-24 top-12 h-56 w-56 rounded-full bg-dreamy-purple/12 blur-[72px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-soft-amethyst/35 blur-[64px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(251,207,232,0.22),transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-10 shrink-0 px-margin-mobile pt-5 md:px-margin-desktop md:pt-6">
        <Link
          to="/"
          className="inline-flex max-w-full items-center gap-2 rounded-2xl outline-offset-4 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <AppLogo variant="header" withText textClassName="text-base font-semibold tracking-widest md:text-lg" />
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-margin-mobile py-10 pb-14 md:px-margin-desktop md:py-12 md:pb-16">
        <div className="w-full max-w-md sm:max-w-lg">{children}</div>
      </div>
    </div>
  );
}

type ErrorPageMainColumnProps = {
  children: ReactNode;
};

/** Centered column + soft glow for error pages inside app Layout (Header/Footer). */
export function ErrorPageMainColumn({ children }: ErrorPageMainColumnProps) {
  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center py-10 md:py-14">
      <div
        className="pointer-events-none absolute left-1/2 top-[28%] h-36 w-[min(22rem,90vw)] -translate-x-1/2 rounded-full bg-dreamy-purple/14 blur-[48px]"
        aria-hidden
      />
      <div className="relative z-10 flex w-full justify-center px-margin-mobile md:px-margin-desktop">
        <div className="w-full max-w-md sm:max-w-lg">{children}</div>
      </div>
    </section>
  );
}
