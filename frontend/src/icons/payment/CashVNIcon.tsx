import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function CashVNIcon({ className, size = 40, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Background card representing banknote shape */}
      <rect x="2" y="8" width="44" height="32" rx="4" fill="#E6F4EA" stroke="#059669" strokeWidth="2.5" />
      
      {/* Intricate decorative border inside the note */}
      <rect x="5" y="11" width="38" height="26" rx="2" stroke="#059669" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
      
      {/* Decorative corner accents */}
      <circle cx="9" cy="15" r="2" fill="#10B981" />
      <circle cx="39" cy="15" r="2" fill="#10B981" />
      <circle cx="9" cy="33" r="2" fill="#10B981" />
      <circle cx="39" cy="33" r="2" fill="#10B981" />
      
      {/* Banknote central decorative rosette */}
      <circle cx="24" cy="24" r="8" fill="#10B981" fillOpacity="0.15" stroke="#059669" strokeWidth="1.5" />
      
      {/* Detailed center emblem with VND text */}
      <circle cx="24" cy="24" r="5" fill="#059669" />
      <text
        x="24"
        y="26.5"
        fill="#FFFFFF"
        fontSize="7px"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        ₫
      </text>

      {/* Decorative Guilloche pattern lines */}
      <path d="M 6 24 Q 15 18, 24 24 T 42 24" stroke="#059669" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      
      {/* Small currency values in the corners */}
      <text x="8" y="20" fill="#059669" fontSize="4.5px" fontWeight="bold" fontFamily="sans-serif" opacity="0.9">500k</text>
      <text x="36" y="20" fill="#059669" fontSize="4.5px" fontWeight="bold" fontFamily="sans-serif" opacity="0.9">500k</text>
    </svg>
  );
}
