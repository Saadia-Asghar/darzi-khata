/** Scissors + ledger-line mark. Uses theme tokens so it follows dark mode. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Darzi Khata" className="shrink-0">
      <rect x="1" y="1" width="62" height="62" rx="10" className="fill-card stroke-border" strokeWidth="2" />
      <g className="stroke-primary" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <circle cx="17" cy="17" r="6" />
        <circle cx="17" cy="35" r="6" />
        <line x1="22" y1="20" x2="52" y2="34" />
        <line x1="22" y1="32" x2="52" y2="18" />
        <line x1="12" y1="50" x2="52" y2="50" />
      </g>
      <line x1="12" y1="56" x2="36" y2="56" className="stroke-accent" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
