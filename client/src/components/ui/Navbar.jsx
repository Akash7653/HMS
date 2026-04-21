import { useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "./BrandLogo";
import { showAuthSuccessToast } from "../../utils/authToasts";

export default function Navbar({ darkMode, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onNavigate = () => setIsMenuOpen(false);

  const mobilePrimaryLinks = useMemo(() => {
    const base = [
      { to: "/", label: "Home", end: true },
      { to: "/hotels", label: "Search" },
    ];
    if (user) {
      base.push({ to: "/bookings", label: "Trips" });
      base.push({ to: "/profile", label: "Profile" });
    }
    return base;
  }, [user]);

  const routeBadgeLabel = useMemo(() => {
    if (location.pathname === "/") return "Home";
    if (location.pathname.startsWith("/hotels")) return "Hotles";
    if (location.pathname.startsWith("/bookings")) return "Bookings";
    if (location.pathname.startsWith("/wishlist")) return "Wishlist";
    if (location.pathname.startsWith("/payments")) return "Payments";
    if (location.pathname.startsWith("/profile")) return "Profile";
    if (location.pathname.startsWith("/admin")) return "Admin";
    return "Home";
  }, [location.pathname]);

  const onLogout = () => {
    logout();
    setIsMenuOpen(false);
    showAuthSuccessToast("👋 Logged out successfully", "You have been signed out safely. See you soon ✨");
    navigate("/");
  };

  const mobileIconBtnClass = "tap-target flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/70 bg-white/80 text-base font-bold text-cyan-700 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:text-cyan-300";

  const navItemClass = ({ isActive }) => {
    const active = isActive ? "text-cyan-800 shadow-sm dark:text-cyan-300" : "text-slate-600 dark:text-slate-300";
    return `relative rounded-full border border-cyan-200/60 bg-gradient-to-r from-white/90 via-cyan-50/95 to-blue-50/90 px-3 py-2 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:from-slate-900/85 dark:via-slate-800/85 dark:to-slate-900/85 ${active}`;
  };

  const renderNavItem = (to, label, options = {}) => (
    <NavLink to={to} end={options.end} onClick={onNavigate} className={navItemClass}>
      {({ isActive }) => (
        <span className="relative inline-flex items-center justify-center px-1 pb-1">
          {label}
          {isActive ? (
            <motion.span
              layoutId="active-nav-line"
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"
            />
          ) : null}
        </span>
      )}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-gradient-to-r from-white/85 via-cyan-50/60 to-white/85 shadow-lg shadow-cyan-100/30 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950/90 dark:shadow-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link to="/" className="hover-lift" onClick={onNavigate}>
          <BrandLogo size={38} bubbleText textClassName="text-base md:text-lg" />
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onToggleTheme}
            title="Toggle Theme"
            className={mobileIconBtnClass}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          {user && (
            <>
              <Link
                to="/profile"
                title="Profile"
                className={mobileIconBtnClass}
              >
                👤
              </Link>
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className={mobileIconBtnClass}
              >
                🚪
              </button>
            </>
          )}
          {!user && location.pathname !== "/register" && (
            <Link
              to="/login"
              title="Login"
              className={mobileIconBtnClass}
            >
              🔑
            </Link>
          )}
        </div>

        <nav className="hidden items-center gap-3 md:flex">
          {renderNavItem("/", "Home", { end: true })}
          {renderNavItem("/hotels", "Hotels")}
          {user && (
            <>
              {renderNavItem("/bookings", "Bookings")}
              {renderNavItem("/wishlist", "Wishlist")}
              {renderNavItem("/payments", "Payments")}
              {renderNavItem("/profile", "Profile")}
            </>
          )}
          {user?.role === "admin" && (
            renderNavItem("/admin", "Admin")
          )}

          <button type="button" className="btn-secondary w-full border border-cyan-200/70 bg-white/80 shadow-sm md:w-auto dark:border-slate-700/60 dark:bg-slate-900/70" onClick={onToggleTheme}>
            {darkMode ? "Light" : "Dark"}
          </button>

          {!user ? (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-secondary w-full text-center border border-cyan-200/70 bg-white/80 shadow-sm md:w-auto dark:border-slate-700/60 dark:bg-slate-900/70">
                Login
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full text-center bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-lg shadow-cyan-500/20 md:w-auto">
                Register
              </Link>
            </>
          ) : (
            <button type="button" onClick={onLogout} className="btn-primary w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 shadow-lg shadow-rose-500/20 md:w-auto">
              Logout
            </button>
          )}
        </nav>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-white/30 px-3 pb-3 pt-2 md:hidden"
          >
            <div className="grid grid-cols-4 gap-2">
              {mobilePrimaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => `rounded-xl border px-2 py-2 text-center text-xs font-semibold ${isActive ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white/85 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {user ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-2xl border border-cyan-200/60 bg-gradient-to-r from-white via-cyan-50 to-blue-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
              >
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </motion.div>
            ) : (
              <div className="mt-2">
                <Link to="/register" onClick={onNavigate} className="btn-primary w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 py-2 text-center text-sm">Register</Link>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {user ? (
        <div className="border-t border-white/40 bg-white/80 px-3 py-2 text-xs backdrop-blur md:hidden dark:border-slate-700/40 dark:bg-slate-900/75">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {routeBadgeLabel}
            </span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
