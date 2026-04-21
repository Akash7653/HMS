import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const items = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
      </svg>
    ),
  },
  {
    to: "/hotels",
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l5 5" />
      </svg>
    ),
  },
  {
    to: "/bookings",
    label: "Trips",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0115 0" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({ isLoggedIn }) {
  const visibleItems = isLoggedIn ? items : items.filter((item) => item.to !== "/bookings" && item.to !== "/profile");

  return (
    <nav className="safe-bottom-nav fixed inset-x-3 z-40 rounded-3xl border border-white/60 bg-white/90 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 md:hidden">
      <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
        {visibleItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === "/"} className="block">
              {({ isActive }) => (
                <motion.span
                  whileTap={{ scale: 0.96 }}
                  className={`tap-target relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
