import BrandLogo from "./BrandLogo";

export default function GlobalFooter() {
  return (
    <footer className="mt-2 border-t border-slate-200/70 bg-white/40 pb-[calc(6.75rem+var(--safe-bottom))] dark:border-slate-700/60 dark:bg-slate-950/30 md:mt-6 md:pb-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-3 py-4 md:hidden">
        <div className="shrink-0">
          <BrandLogo textClassName="text-base" />
        </div>
        <div className="shrink-0 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          Hotels
        </div>
        <div className="shrink-0 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          Support
        </div>
        <div className="shrink-0 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          Policies
        </div>
      </div>

      <div className="mx-auto hidden max-w-7xl gap-8 px-4 py-10 md:grid md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-3">
          <BrandLogo textClassName="text-xl" />
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Horizon-Hotels helps travelers discover trusted stays with smooth booking and secure payments.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide">Horizon-Hotels</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>About Horizon-Hotels</li>
            <li>Email: support@horizonhms.com</li>
            <li>Phone: +91 90000 00000</li>
            <li>Address: Horizon-Hotels, Bengaluru, India</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide">Services</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Hotel Discovery</li>
            <li>Real-Time Availability</li>
            <li>Secure Payments</li>
            <li>Booking & Refund Tracking</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide">Policies</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Privacy Policy</li>
            <li>Cancellation Policy</li>
            <li>Terms & Conditions</li>
            <li>Support Hours: 24 x 7</li>
          </ul>
        </div>

      </div>

      <div className="border-t border-slate-200/70 px-4 py-4 text-center text-sm text-slate-500 dark:border-slate-700/50 dark:text-slate-400">
        2026 Horizon-Hotels. All rights reserved.
      </div>
    </footer>
  );
}

