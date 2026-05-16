import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type ErrorPageAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type ErrorPageContentProps = {
  code: string;
  title: string;
  description: string;
  primary?: ErrorPageAction;
  secondary?: ErrorPageAction;
  footer?: ReactNode;
};

function ActionButton({ action }: { action: ErrorPageAction }) {
  const isPrimary = action.variant !== "secondary";
  const base =
    "inline-flex min-h-11 w-full shrink-0 items-center justify-center px-5 text-center font-ui-label text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-auto sm:min-w-[8.5rem] sm:px-6 sm:text-base";
  const primaryClass = `${base} rounded-full bg-dreamy-purple text-deep-plum shadow-[0_8px_28px_rgba(192,132,252,0.35)] hover:brightness-105 active:brightness-95`;
  const secondaryClass =
    `${base} rounded-2xl border border-white/60 bg-white/45 text-deep-plum backdrop-blur-md hover:bg-white/60`;

  if (action.to) {
    return (
      <Link to={action.to} className={isPrimary ? primaryClass : secondaryClass}>
        {action.label}
      </Link>
    );
  }
  if (action.onClick) {
    return (
      <button type="button" onClick={action.onClick} className={isPrimary ? primaryClass : secondaryClass}>
        {action.label}
      </button>
    );
  }
  return null;
}

function codeDisplayClass(code: string): string {
  if (code.length <= 2) {
    return "font-hero-display text-[clamp(3rem,14vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-deep-plum";
  }
  return "font-hero-display text-[clamp(2.75rem,11vw,4rem)] font-semibold leading-[1.05] tracking-tight text-deep-plum sm:text-[clamp(3.25rem,9vw,3.75rem)]";
}

export function ErrorPageContent({
  code,
  title,
  description,
  primary,
  secondary,
  footer,
}: ErrorPageContentProps) {
  return (
    <article
      className="w-full rounded-3xl border border-white/60 bg-pure-ivory/75 p-6 shadow-[0_10px_40px_rgba(168,85,247,0.06)] backdrop-blur-[20px] sm:p-8"
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      <p className={codeDisplayClass(code)}>{code}</p>
      <h1 className="mt-4 font-sub-heading text-xl font-semibold leading-snug text-deep-plum sm:text-2xl sm:leading-snug">
        {title}
      </h1>
      <p className="mt-3 max-w-prose font-body-standard text-[15px] leading-relaxed text-midnight-purple sm:text-[17px] sm:leading-[1.6]">
        {description}
      </p>
      {(primary ?? secondary) ? (
        <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
          {primary ? <ActionButton action={{ variant: "primary", ...primary }} /> : null}
          {secondary ? <ActionButton action={{ variant: "secondary", ...secondary }} /> : null}
        </div>
      ) : null}
      {footer ? (
        <div className="mt-6 border-t border-crystal-border pt-5 text-sm leading-relaxed text-dusk-gray">{footer}</div>
      ) : null}
    </article>
  );
}
