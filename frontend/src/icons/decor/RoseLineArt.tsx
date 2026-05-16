type RoseLineArtProps = {
  className?: string;
};

export function RoseLineArt({ className = "" }: RoseLineArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M60 20c-8 0-14 6-16 14-2-6-8-10-15-10-10 0-18 8-18 18 0 6 3 11 8 14-10 2-17 11-17 22 0 12 10 22 22 22 5 0 10-2 14-5 2 8 9 14 18 14 9 0 16-6 18-14 4 3 9 5 14 5 12 0 22-10 22-22 0-11-7-20-17-22 5-3 8-8 8-14 0-10-8-18-18-18-7 0-13 4-15 10-2-8-8-14-16-14Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path
        d="M60 52v58M48 96c8 4 16 4 24 0M54 110h12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
