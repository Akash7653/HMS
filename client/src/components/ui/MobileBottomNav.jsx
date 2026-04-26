import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
  const [showKeyOptions, setShowKeyOptions] = useState(false);
  
  const visibleItems = isLoggedIn ? items : items.filter((item) => item.to !== "/bookings" && item.to !== "/profile");
  const rightItems = items.slice(2); // Trips, Profile

  const visibleLeftItems = isLoggedIn ? leftItems : leftItems.filter((item) => item.to !== "/bookings" && item.to !== "/profile");
  const visibleRightItems = isLoggedIn ? rightItems : rightItems.filter((item) => item.to !== "/bookings" && item.to !== "/profile");

  const toggleKeyOptions = () => {
    setShowKeyOptions(!showKeyOptions);
  };

  return (
    <>
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

      {/* Key Options Button - Only show when logged in */}
      {isLoggedIn && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={toggleKeyOptions}
          className="tap-target fixed bottom-24 right-4 z-30 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 p-3 text-white shadow-lg md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 0M8 12h.01M19 19l-7-7 7-7" />
          </svg>
        </motion.button>
      )}

      {/* Key Options Panel */}
      <AnimatePresence>
        {showKeyOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-32 right-4 z-30 w-64 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95 md:hidden"
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isLoggedIn ? "Quick Actions" : "Get Started"}
            </h3>
            <div className="space-y-2">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => {
                      // Trigger global location function
                      if (window.getUserLocation) {
                        window.getUserLocation();
                      }
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:from-blue-600 hover:to-cyan-600"
                  >
                    Near Me Hotels
                  </button>
                  <button className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-600">
                    My Bookings
                  </button>
                  <button className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:from-green-600 hover:to-emerald-600">
                    Quick Booking
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      // Trigger global location function
                      if (window.getUserLocation) {
                        window.getUserLocation();
                      }
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:from-blue-600 hover:to-cyan-600"
                  >
                    Find Hotels
                  </button>
                  <button className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-600">
                    Sign Up
                  </button>
                  <button className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:from-green-600 hover:to-emerald-600">
                    Login
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
