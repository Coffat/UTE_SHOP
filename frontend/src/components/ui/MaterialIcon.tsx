import type { ComponentPropsWithoutRef } from "react";

type MaterialIconProps = {
  name: string;
  filled?: boolean;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

export function MaterialIcon({
  name,
  filled = false,
  className = "",
  style,
  ...rest
}: MaterialIconProps) {
  const classes = ["material-symbols-outlined", filled ? "icon-fill" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={style} aria-hidden="true" {...rest}>
      {name}
    </span>
  );
}
