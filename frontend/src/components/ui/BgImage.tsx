import type { CSSProperties } from "react";

type BgImageProps = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export function BgImage({ src, alt, className = "", style }: BgImageProps) {
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt}
      data-alt={alt}
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url('${src}')`, ...style }}
    />
  );
}
