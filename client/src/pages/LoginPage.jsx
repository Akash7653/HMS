import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/ui/BrandLogo";
import { showAuthErrorToast, showAuthSuccessToast } from "../utils/authToasts";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      showAuthSuccessToast("✨ Logged in successfully", "Welcome back. Your account is ready 🎉");
      navigate("/hotels");
    } catch (error) {
      const message = error.response?.data?.message || "Invalid credentials";
      showAuthErrorToast("⚠ Invalid credentials", `${message} Please try again.`);
    }
  };

  return (
    <div className="auth-stage mx-auto grid max-w-6xl items-stretch gap-4 px-4 py-4 sm:gap-6 sm:py-8 lg:grid-cols-2 lg:py-10">
      <motion.section
        initial={{ opacity: 0, x: -16, rotateY: 5 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.48, ease: "easeOut" }}
        className="auth-card-3d auth-sheen card relative flex min-h-[440px] items-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 sm:min-h-[500px] sm:p-6 lg:min-h-[520px] lg:p-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        <div className="auth-light-ambient absolute inset-0" />
        <div className="auth-light-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-cyan-100/30 dark:from-slate-900/50 dark:to-cyan-900/20" />
        <div className="orb -left-16 top-10 h-40 w-40 bg-gradient-to-br from-cyan-400/40 to-blue-500/40 dark:from-cyan-700/35 dark:to-blue-800/35 blur-3xl" />
        <div className="orb right-[-24px] bottom-[-24px] h-44 w-44 bg-gradient-to-br from-indigo-400/35 to-cyan-400/35 dark:from-indigo-700/25 dark:to-cyan-700/25 blur-3xl" />
        <div className="relative space-y-6">
          <BrandLogo />
          <div className="space-y-3">
            <h1 className="mb-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text font-display text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl">Welcome back</h1>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Sign in to manage bookings, wishlist, and personalized hotel recommendations with real-time availability.
            </p>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-3"
          >
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400/25 to-blue-500/25 p-4 shadow-sm dark:from-cyan-700/25 dark:to-blue-800/25 border border-cyan-300/30 dark:border-cyan-700/30 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Guest Trust</p>
              <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">Verified account controls</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.form
        initial={{ opacity: 0, x: 16, rotateY: -5 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.48, ease: "easeOut", delay: 0.05 }}
        onSubmit={onSubmit}
        className="auth-card-3d card relative flex min-h-[440px] items-center overflow-hidden bg-gradient-to-br from-white to-slate-50 p-4 sm:min-h-[500px] sm:p-6 lg:min-h-[520px] lg:p-8 dark:from-slate-900 dark:to-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-indigo-100/25 dark:from-slate-900/30 dark:to-indigo-900/15" />
        <div className="relative w-full space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent sm:text-4xl">Login</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Use your verified email or phone with password to continue.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-3">
          <input
            className="input bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            placeholder="Email or Phone"
            type="text"
            value={form.identifier}
            onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
            required
          />
          <input
            className="input bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary glow-ring mt-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 font-semibold shadow-lg hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700" 
          type="submit"
        >
          Login Securely
        </motion.button>
        
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
          New user? <Link className="font-semibold text-brand-700 hover:text-brand-800 transition-colors" to="/register">Create verified account</Link>
        </p>
        </div>
      </motion.form>
    </div>
  );
}
