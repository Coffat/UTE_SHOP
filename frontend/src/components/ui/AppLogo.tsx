import type { ImgHTMLAttributes } from "react";

type AppLogoVariant = "header" | "auth" | "profile";

type AppLogoProps = {
  variant?: AppLogoVariant;
  withText?: boolean;
  textClassName?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
    alt?: string;
  };

const variantClassMap: Record<AppLogoVariant, string> = {
  header: "h-9 md:h-10 lg:h-11 w-auto object-contain",
  auth: "h-16 sm:h-18 lg:h-20 w-auto object-contain drop-shadow-[0_6px_18px_rgba(168,85,247,0.18)]",
  profile: "h-20 w-20 object-contain",
};

export function AppLogo({
  variant = "header",
  className = "",
  alt = "UTESHOP logo",
  withText = false,
  textClassName = "",
  ...imgRest
}: AppLogoProps) {
  const classes = `${variantClassMap[variant]} ${className}`.trim();
  return (
    <span className="inline-flex items-center gap-2 md:gap-3">
      <img src="/images/logo.png" alt={alt} className={classes} {...imgRest} />
      {withText ? (
        <span className={`font-sub-heading text-deep-plum font-bold tracking-widest ${textClassName}`.trim()}>
          UTESHOP
        </span>
      ) : null}
    </span>
  );
}

