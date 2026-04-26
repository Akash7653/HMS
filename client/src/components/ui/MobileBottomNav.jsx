import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const leftItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 11.5L12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10.5V20h13V10.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/hotels",
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const rightItems = [
  {
    to: "/bookings",
    label: "Trips",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0115 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({ isLoggedIn }) {
  const visibleLeftItems = leftItems; // Always show home and search
  const visibleRightItems = isLoggedIn 
    ? rightItems 
    : [
        {
          to: "/login",
          label: "Login",
          icon: (
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        },
        {
          to: "/register",
          label: "Sign Up",
          icon: (
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
      ];

  const handleAIToggle = () => {
    window.dispatchEvent(new CustomEvent("toggle-ai-chat"));
  };

  return (
    <nav className="safe-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 md:hidden">
      <div className="relative flex h-16 items-center justify-between px-2">
        {/* Left Items */}
        <div className="flex w-[40%] justify-around">
          {visibleLeftItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="flex flex-1 flex-col items-center justify-center gap-1">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center justify-center gap-1 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Center AI Button */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAIToggle}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 outline-none ring-4 ring-white dark:ring-slate-900"
          >
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 24 24" className="mb-0.5 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2a2 2 0 0 1-2-2c0-1.1.9-2 2-2zm0 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-8 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] font-bold leading-none tracking-wider">AI</span>
            </div>
          </motion.button>
        </div>

        {/* Right Items */}
        <div className="flex w-[40%] justify-around">
          {visibleRightItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="flex flex-1 flex-col items-center justify-center gap-1">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center justify-center gap-1 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
