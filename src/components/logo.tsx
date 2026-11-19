import Link from "next/link";

export function HopeMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hopeGrad" x1="4" y1="42" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EF2C8" />
          <stop offset="0.55" stopColor="#B6FFE6" />
          <stop offset="1" stopColor="#79C9FF" />
        </linearGradient>
        <linearGradient id="hopeGlow" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EF2C8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6EF2C8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#0A141E" stroke="url(#hopeGrad)" strokeOpacity="0.55" />
      <path d="M24 6.5C15.4 6.5 8.5 13.4 8.5 22c0 8.6 6.9 15.5 15.5 15.5S39.5 30.6 39.5 22c0-8.6-6.9-15.5-15.5-15.5Z" fill="url(#hopeGlow)" />
      <path d="M13.5 30.5 24 12l10.5 18.5" stroke="url(#hopeGrad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.2 30.5h11.6" stroke="url(#hopeGrad)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="m24 20.5 3.6 6.4h-7.2l3.6-6.4Z" fill="#6EF2C8" />
      <circle cx="24" cy="12" r="2.1" fill="#E7F0F5" />
    </svg>
  );
}

export function HopeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3 no-underline">
      <span className="relative shrink-0">
        <span className="absolute inset-0 rounded-2xl bg-mint/25 blur-lg transition group-hover:bg-mint/40" />
        <span className="relative block"><HopeMark size={38} /></span>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[19px] font-bold tracking-tight text-ice">Rising<span className="text-mint">Hope</span></span>
          <span className="mt-1 block font-mono-tech text-[8px] uppercase tracking-[0.28em] text-muted">Global charity network</span>
        </span>
      )}
    </Link>
  );
}
