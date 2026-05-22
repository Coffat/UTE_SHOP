import React from "react";

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
}

export function MomoIcon({ className, size = 44, ...props }: IconProps) {
  return (
    <img
      src="/images/payment/momo.png"
      alt="MoMo"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: "contain",
        borderRadius: "8px",
        display: "block",
        ...props.style,
      }}
      {...props}
    />
  );
}

