import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/ui/BrandLogo";
import { showAuthSuccessToast } from "../utils/authToasts";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    password: "",
    confirmPassword: "",
  });

  const resolveErrorMessage = (error, fallback) => {
    const apiMessage = error?.response?.data?.message;
    const validationMessage = error?.response?.data?.errors?.[0]?.msg;
    return apiMessage || validationMessage || fallback;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Password and confirm password must match");
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        country: form.country,
        password: form.password,
      };
      await register(payload);
      showAuthSuccessToast("Account created successfully", "Your account is ready. Redirecting you to hotels.");
      navigate("/hotels");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Registration failed"));
    }
  };

  return (
    <div className="auth-stage mx-auto grid max-w-6xl items-stretch gap-4 px-4 py-4 sm:gap-6 sm:py-8 lg:grid-cols-2 lg:py-10">
      <motion.section
        initial={{ opacity: 0, x: -16, rotateY: 5 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.48, ease: "easeOut" }}
        className="auth-card-3d auth-sheen card relative flex min-h-[460px] items-center overflow-hidden p-4 sm:min-h-[530px] sm:p-6 lg:min-h-[560px] lg:p-8"
      >
        <div className="auth-light-ambient absolute inset-0" />
        <div className="auth-light-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/65 via-transparent to-purple-100/30 dark:from-slate-900/45 dark:to-purple-900/20" />
        <div className="orb -right-20 top-16 h-56 w-56 bg-gradient-to-br from-purple-400/40 to-pink-500/40 dark:from-purple-600/35 dark:to-pink-700/35" />
        <div className="orb left-[-24px] bottom-[-24px] h-44 w-44 bg-gradient-to-br from-cyan-400/30 to-violet-400/35 dark:from-cyan-700/25 dark:to-violet-700/25 blur-3xl" />
        <div className="relative space-y-5">
          <BrandLogo />
          <div className="space-y-3">
            <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-display text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl">Create your account</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Join Horizon-Hotels and enjoy seamless hotel bookings with a faster signup flow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            <div className="rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 p-3 shadow-sm dark:from-purple-700/25 dark:to-pink-700/25">
              <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Simple Setup</p>
              <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">Create your account in one step</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.form
        initial={{ opacity: 0, x: 16, rotateY: -5 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.48, ease: "easeOut", delay: 0.05 }}
        onSubmit={onSubmit}
        className="auth-card-3d card relative flex min-h-[460px] items-center overflow-hidden p-4 sm:min-h-[530px] sm:p-6 lg:min-h-[560px] lg:p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-pink-100/25 dark:from-slate-900/30 dark:to-pink-900/15" />
        <div className="relative w-full space-y-3">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Register</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Fill all required details to create your account.</p>
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Phone (10-15 digits)"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
          />
        </div>
        
        <button className="btn-primary glow-ring mt-1 w-full" type="submit">
          Create Account
        </button>

        <div className="space-y-2 text-center">
          <button
            type="button"
            className="w-full rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:text-cyan-300"
            onClick={() => navigate("/login")}
          >
            Sign in to existing account
          </button>
        </div>
        </div>
      </motion.form>
    </div>
  );
}

