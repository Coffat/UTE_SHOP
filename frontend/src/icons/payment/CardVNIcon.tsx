import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function CardVNIcon({ className, size = 40, ...props }: IconProps) {
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
      {/* Credit card rounded shape with deep purple/midnight gradient */}
      <rect x="2" y="8" width="44" height="32" rx="4" fill="url(#cardGrad)" stroke="#311B92" strokeWidth="1.5" />
      
      <defs>
        <linearGradient id="cardGrad" x1="2" y1="8" x2="46" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E1645" />
          <stop offset="0.5" stopColor="#2D1B4B" />
          <stop offset="1" stopColor="#4A148C" />
        </linearGradient>
      </defs>

      {/* Holographic Chip shape on the left */}
      <rect x="7" y="16" width="8" height="7" rx="1.5" fill="#E2E8F0" opacity="0.9" />
      <rect x="9" y="18" width="4" height="3" rx="0.5" fill="#CBD5E1" />
      <line x1="11" y1="16" x2="11" y2="23" stroke="#94A3B8" strokeWidth="0.5" />
      <line x1="7" y1="19.5" x2="15" y2="19.5" stroke="#94A3B8" strokeWidth="0.5" />

      {/* Abstract contact-less signal wave lines */}
      <path d="M 18 16 A 4 4 0 0 1 18 23" stroke="#E2E8F0" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M 20 14 A 6 6 0 0 1 20 25" stroke="#E2E8F0" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* Stylized domestic card numbers placeholders */}
      <rect x="7" y="27" width="22" height="1.5" rx="0.5" fill="#E2E8F0" opacity="0.65" />
      <rect x="7" y="31" width="12" height="1.5" rx="0.5" fill="#E2E8F0" opacity="0.45" />

      {/* Napas Vietnam Brand logotype vector placeholder in bottom-right */}
      {/* napas logo has signature overlapping red & blue triangles pointing right */}
      <g transform="translate(32, 26) scale(0.9)">
        {/* Visa blue/yellow accent card representation */}
        <circle cx="-1" cy="5" r="4.5" fill="#FF5F00" opacity="0.8" />
        <circle cx="4" cy="5" r="4.5" fill="#F43F5E" opacity="0.8" />
        
        {/* napas overlapping symbol styling */}
        <path d="M 8 1 L 11 5 L 8 9 L 10 9 L 13 5 L 10 1 Z" fill="#005BAA" />
        <path d="M 11 1 L 14 5 L 11 9 L 13 9 L 16 5 L 13 1 Z" fill="#ED1C24" />
      </g>
    </svg>
  );
}
