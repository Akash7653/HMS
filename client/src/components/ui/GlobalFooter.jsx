import BrandLogo from "./BrandLogo";

export default function GlobalFooter() {
  return (
    <footer className="mt-0 border-t border-slate-200/70 bg-gradient-to-b from-white/55 via-cyan-50/35 to-white/60 pb-[calc(6.25rem+var(--safe-bottom))] dark:border-slate-700/60 dark:from-slate-950/40 dark:via-slate-900/35 dark:to-slate-950/45 md:mt-4 md:pb-0">
      <div className="mx-auto max-w-7xl px-3 pt-2 md:hidden">
        <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/75">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo textClassName="text-sm" />
            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
              24x7 Support
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-200/70 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">Trusted Stays</span>
            <span className="rounded-full border border-slate-200/70 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">Secure Payments</span>
            <span className="rounded-full border border-slate-200/70 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">Fast Refunds</span>
          </div>
        </div>
      </div>

      <div className="mx-auto hidden max-w-7xl gap-6 px-4 py-8 md:grid md:grid-cols-2 xl:grid-cols-4">
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

      <div className="border-t border-slate-200/70 px-4 py-3 text-center text-sm text-slate-500 dark:border-slate-700/50 dark:text-slate-400">
        2026 Horizon-Hotels. All rights reserved.
      </div>
    </footer>
  );
}

