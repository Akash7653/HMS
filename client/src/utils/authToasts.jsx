import toast from "react-hot-toast";

function renderToast(t, config) {
  const {
    borderClass,
    gradientClass,
    title,
    subtitle,
  } = config;

  return (
    <div
      className={`pointer-events-auto w-[min(94vw,420px)] rounded-3xl border ${borderClass} ${gradientClass} p-[1px] shadow-2xl transition-all duration-300 ${
        t.visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
      }`}
    >
      <div className="rounded-3xl bg-white/95 px-5 py-4 text-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
        <p className="text-base font-extrabold leading-tight">{title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
}

export function showAuthSuccessToast(title, subtitle) {
  toast.custom(
    (t) =>
      renderToast(t, {
        borderClass: "border-cyan-200/60",
        gradientClass: "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600",
        title,
        subtitle,
      }),
    { duration: 2600, position: "bottom-right" }
  );
}

export function showAuthErrorToast(title, subtitle) {
  toast.custom(
    (t) =>
      renderToast(t, {
        borderClass: "border-rose-200/70",
        gradientClass: "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500",
        title,
        subtitle,
      }),
    { duration: 2800, position: "bottom-right" }
  );
}
