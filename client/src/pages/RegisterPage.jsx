import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/ui/BrandLogo";
import { showAuthSuccessToast } from "../utils/authToasts";

export default function RegisterPage() {
  const { register, verifyContact, resendOtp } = useAuth();
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
  const [phoneOtp, setPhoneOtp] = useState("");
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const resolveErrorMessage = (error, fallback) => {
    const apiMessage = error?.response?.data?.message;
    const validationMessage = error?.response?.data?.errors?.[0]?.msg;
    return apiMessage || validationMessage || fallback;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    requestPhoneOtp(e);
  };

  const requestPhoneOtp = async (e) => {
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
      setContact({ email: form.email, phone: form.phone });
      localStorage.setItem("hms_pending_verification_email", form.email);
      setShowOtpPanel(true);
      showAuthSuccessToast("OTP sent successfully", "Check your phone and verify to complete signup.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Registration failed"));
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (!phoneOtp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      await verifyContact({ ...contact, phoneOtp, emailOtp: "" });
      setIsVerified(true);
      setShowOtpPanel(false);
      localStorage.removeItem("hms_pending_verification_email");
      showAuthSuccessToast("Registration complete", "Phone verified. Redirecting you to hotels.");
      navigate("/hotels");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "OTP verification failed"));
    }
  };

  const onResend = async () => {
    try {
      await resendOtp(contact);
      toast.success("New OTP sent");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to resend OTP"));
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
            <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-display text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl">Create your verified account</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Join Horizon-Hotels and enjoy seamless hotel bookings with enhanced security and exclusive features.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            <div className="rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 p-3 shadow-sm dark:from-purple-700/25 dark:to-pink-700/25">
              <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Simple Setup</p>
              <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">Phone verification only for security</p>
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
        <p className="text-sm text-slate-600 dark:text-slate-300">Fill all required details for a secure account.</p>
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
          Send OTP & Create Account
        </button>
        
        {isVerified && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Verified: Phone is confirmed and account is ready
          </div>
        )}
        
        <div className="space-y-2 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Already have an account? <Link className="font-semibold text-brand-700" to="/login">Login</Link>
          </p>
          <button type="button" className="btn-secondary w-full" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
        </div>
      </motion.form>

      {showOtpPanel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onSubmit={onVerify}
            className="panel-slide w-full max-w-lg rounded-2xl border border-white/30 bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl dark:border-slate-700/50 dark:from-slate-900 dark:to-slate-800"
          >
            <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Verify your phone</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Enter the OTP sent to <span className="font-semibold">{contact.phone}</span>
            </p>

            <div className="mt-4">
              <input
                className="input text-center text-lg font-semibold tracking-widest"
                placeholder="000000"
                maxLength="6"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary w-full sm:flex-1">Verify & Continue</button>
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onResend}>Resend</button>
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShowOtpPanel(false)}>Close</button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </div>
  );
}

