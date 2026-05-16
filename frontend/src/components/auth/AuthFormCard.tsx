import type { ReactNode } from "react";
import { RoseLineArt } from "@/icons";

type AuthFormCardProps = {
  children: ReactNode;
};

export function AuthFormCard({ children }: AuthFormCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-pure-ivory/35 p-6 shadow-lg backdrop-blur-[32px] sm:rounded-[28px] sm:p-8 md:p-9">
      <div className="pointer-events-none absolute left-5 top-5 flex gap-2">
        <span className="size-3 rounded-full bg-[#ff758c]/90 shadow-sm" />
        <span className="size-3 rounded-full bg-[#7158e2]/90 shadow-sm" />
      </div>
      <RoseLineArt className="pointer-events-none absolute -right-2 top-4 h-24 w-20 text-soft-amethyst md:h-28 md:w-24" />
      {children}
    </div>
  );
}
