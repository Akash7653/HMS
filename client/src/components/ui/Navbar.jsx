import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "./BrandLogo";
import { showAuthSuccessToast } from "../../utils/authToasts";

export default function Navbar({ darkMode, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);

  const onLogout = () => {
    logout();
    setIsMenuOpen(false);
    setShowUserPanel(false);
    showAuthSuccessToast("👋 Logged out successfully", "You have been signed out safely. See you soon ✨");
    navigate("/");
  };

  const navItemClass = ({ isActive }) =>
    `relative rounded-full border border-cyan-200/60 bg-gradient-to-r from-white/85 via-cyan-50/90 to-blue-50/85 px-3 py-2 text-center transition-all hover:-translate-y-0.5 hover:from-cyan-100 hover:to-blue-100 hover:text-cyan-800 hover:shadow-md dark:border-slate-700/60 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 dark:hover:from-slate-800 dark:hover:to-slate-700 dark:hover:text-cyan-300 ${
      isActive ? "text-cyan-800 shadow-sm dark:text-cyan-300" : ""
    }`;

  const renderNavItem = (to, label, options = {}) => (
    <NavLink to={to} end={options.end} onClick={() => setIsMenuOpen(false)} className={navItemClass}>
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link to="/" className="hover-lift" onClick={() => setIsMenuOpen(false)}>
          <BrandLogo size={38} bubbleText textClassName="text-base md:text-lg" />
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          className="btn-secondary border border-cyan-200/70 bg-white/80 shadow-sm md:hidden dark:border-slate-700/60 dark:bg-slate-900/70"
        >
          {isMenuOpen ? "Close" : "Menu"}
        </button>

        <nav className={`${isMenuOpen ? "flex" : "hidden"} w-full flex-col items-stretch gap-2 text-sm font-semibold md:flex md:w-auto md:flex-row md:items-center md:gap-3`}>
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

          {user ? (
            <motion.div className="relative" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <button
                type="button"
                onClick={() => setShowUserPanel((v) => !v)}
                className="w-full rounded-2xl border border-cyan-200/70 bg-gradient-to-r from-white via-cyan-50 to-white px-3 py-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:w-auto dark:border-cyan-900/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
              >
                <p className="font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
              </button>

              {showUserPanel ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="panel-slide mt-2 w-full rounded-3xl border border-white/30 bg-white/92 p-4 shadow-2xl backdrop-blur-xl md:absolute md:right-0 md:top-full md:z-30 md:w-72 dark:border-slate-700/40 dark:bg-slate-950/90"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
                  <p className="mt-1 font-bold">{user.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Role: {user.role}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      Email {user.emailVerified ? "Verified" : "Pending"}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.phoneVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      Phone {user.phoneVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}

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
    </header>
  );
}
