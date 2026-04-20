export default function BrandLogo({ size = 34, withText = true, textClassName = "", bubbleText = false }) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Horizon HMS logo"
        className="rounded-2xl shadow-xl shadow-cyan-500/30 ring-1 ring-white/60 dark:ring-slate-700/50"
      >
        <defs>
          <linearGradient id="hmsLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="hmsLogoSoft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.68" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#hmsLogoGrad)" />
        <path d="M14 30V18h4.2v4.6h11.6V18H34v12h-4.2v-4.6H18.2V30H14z" fill="url(#hmsLogoSoft)" />
        <circle cx="35.5" cy="12.5" r="2.3" fill="#ffffff" fillOpacity="0.88" />
      </svg>
      {withText ? (
        bubbleText ? (
          <span className={`rounded-full border border-cyan-200/70 bg-gradient-to-r from-white/90 via-cyan-50/95 to-blue-50/90 px-3 py-1 font-display text-lg font-bold tracking-tight text-cyan-800 shadow-sm dark:border-slate-700/60 dark:from-slate-900/85 dark:via-slate-800/85 dark:to-slate-900/85 dark:text-cyan-300 ${textClassName}`}>
            Horizon HMS
          </span>
        ) : (
          <span className={`bubble-title font-display text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-transparent ${textClassName}`}>
            Horizon HMS
          </span>
        )
      ) : null}
    </div>
  );
}
