export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="relative mb-2.5 h-44 overflow-hidden rounded-xl bg-slate-200/80 dark:bg-slate-700/70">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-slate-400/20" />
      </div>
      <div className="space-y-2">
        <div className="relative h-4 w-3/4 overflow-hidden rounded bg-slate-200/80 dark:bg-slate-700/70">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-slate-400/20" />
        </div>
        <div className="relative h-3.5 w-1/2 overflow-hidden rounded bg-slate-200/80 dark:bg-slate-700/70">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-slate-400/20" />
        </div>
        <div className="relative h-9 w-full overflow-hidden rounded-xl bg-slate-200/80 dark:bg-slate-700/70">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-slate-400/20" />
        </div>
      </div>
    </div>
  );
}
