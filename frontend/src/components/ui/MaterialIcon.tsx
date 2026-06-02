import { Icon } from "@iconify/react";
import type { CSSProperties } from "react";

type MaterialIconProps = {
  name: string;
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Icon không có biến thể `-outline` trên Iconify `material-symbols` — dùng glyph mặc định. */
const NO_OUTLINE_SUFFIX = new Set([
  "search",
  "arrow_forward",
  "logout",
  "lock_reset",
  "chevron_right",
  "add",
  "redeem",
  "add_shopping_cart",
  "check",
]);

/** Một số tên MD dùng bộ `ic` (Material Icons) vì `material-symbols` không có hoặc khác tên. */
const LEGACY_ICONS: Record<string, { filled: string; outline: string }> = {
  card_giftcard: {
    filled: "ic:round-card-giftcard",
    outline: "ic:outline-card-giftcard",
  },
};

function resolveIconifyId(name: string, filled: boolean): string {
  const legacy = LEGACY_ICONS[name];
  if (legacy) {
    return filled ? legacy.filled : legacy.outline;
  }
  const kebab = name.replace(/_/g, "-");
  if (filled) {
    return `material-symbols:${kebab}`;
  }
  if (NO_OUTLINE_SUFFIX.has(name)) {
    return `material-symbols:${kebab}`;
  }
  return `material-symbols:${kebab}-outline`;
}

export function MaterialIcon({ name, filled = false, className = "", style }: MaterialIconProps) {
  const icon = resolveIconifyId(name, filled);
  const mergedClass = ["inline-block shrink-0 leading-none align-middle", className].filter(Boolean).join(" ");

  return (
    <Icon
      icon={icon}
      className={mergedClass}
      style={style}
      width="1em"
      height="1em"
      aria-hidden="true"
    />
  );
}
