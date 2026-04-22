import { Link } from "react-router-dom";

export default function MobileSupportStrip() {
  return (
    <div className="mx-3 mb-[calc(5.6rem+var(--safe-bottom))] mt-2 rounded-2xl border border-cyan-100/80 bg-gradient-to-r from-white via-cyan-50 to-blue-50 px-3 py-2 shadow-sm dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Need help with booking or payments?</p>
        <Link to="/hotels" className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">Explore</Link>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">24x7 Support</span>
        <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">Secure Pay</span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Trusted Stays</span>
      </div>
    </div>
  );
}
