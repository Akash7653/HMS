import BrandLogo from "./BrandLogo";

export default function GlobalFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200/70 bg-white/40 dark:border-slate-700/60 dark:bg-slate-950/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-3">
          <BrandLogo textClassName="text-xl" />
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Horizon HMS helps travelers discover trusted stays with smooth booking and secure payments.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide">Horizon HMS</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>About Horizon HMS</li>
            <li>Email: support@horizonhms.com</li>
            <li>Phone: +91 90000 00000</li>
            <li>Address: Horizon HMS, Bengaluru, India</li>
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
        2026 Horizon HMS. All rights reserved.
      </div>
    </footer>
  );
}
