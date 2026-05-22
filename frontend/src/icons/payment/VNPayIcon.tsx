import React from "react";

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
}

export function VNPayIcon({ className, size = 44, ...props }: IconProps) {
  // Since VNPay is a horizontal logo (138.32 x 42), we scale its height
  // to about 60% of the standard size so it matches the visual weight of
  // square icons, while keeping the aspect ratio perfectly intact.
  const height = Math.round(size * 0.6);
  const width = Math.round(height * (138.32 / 42));

  return (
    <img
      src="/images/payment/vnpay.svg"
      alt="VNPay"
      width={width}
      height={height}
      className={className}
      style={{
        objectFit: "contain",
        display: "block",
        ...props.style,
      }}
      {...props}
    />
  );
}


