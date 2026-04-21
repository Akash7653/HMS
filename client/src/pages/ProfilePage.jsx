import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, updateProfile, verifyContact, resendOtp } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    country: user?.country || "",
  });
  const [otp, setOtp] = useState({ emailOtp: "", phoneOtp: "" });
  const [showVerify, setShowVerify] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  const isVerified = useMemo(() => user?.emailVerified && user?.phoneVerified, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(form);
      toast.success("Profile updated");
      if (res.verificationRequired) {
        setShowVerify(true);
        setDevOtp(res.devOtp || null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyContact({ email: form.email, phone: form.phone, ...otp });
      toast.success("Contact verification completed");
      setShowVerify(false);
      setOtp({ emailOtp: "", phoneOtp: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  const onResend = async () => {
    const res = await resendOtp({ email: form.email, phone: form.phone });
    setDevOtp(res.devOtp || null);
    toast.success("OTP resent");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 font-display text-3xl font-bold">My Profile</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user?.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          Email {user?.emailVerified ? "Verified" : "Not Verified"}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user?.phoneVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          Phone {user?.phoneVerified ? "Verified" : "Not Verified"}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isVerified ? "bg-cyan-100 text-cyan-700" : "bg-slate-200 text-slate-700"}`}>
          Security {isVerified ? "Strong" : "Pending Verification"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link to="/bookings" className="btn-secondary text-center">My Bookings</Link>
        <Link to="/wishlist" className="btn-secondary text-center">Wishlist</Link>
      </div>

      <form onSubmit={onSave} className="card grid gap-3 p-6 sm:grid-cols-2">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} />
        <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        <input className="input sm:col-span-2" placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
        <button className="btn-primary sm:col-span-2" type="submit">Save Profile</button>
      </form>

      {showVerify ? (
        <div className="panel-slide mt-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80">
          <h2 className="font-display text-xl font-bold">Verify updated contact details</h2>
          {devOtp ? <p className="mt-2 text-sm text-amber-700">Dev OTP - Email: {devOtp.emailOtp}, Phone: {devOtp.phoneOtp}</p> : null}
          <form onSubmit={onVerify} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Email OTP" value={otp.emailOtp} onChange={(e) => setOtp((p) => ({ ...p, emailOtp: e.target.value.replace(/\D/g, "") }))} required />
            <input className="input" placeholder="Phone OTP" value={otp.phoneOtp} onChange={(e) => setOtp((p) => ({ ...p, phoneOtp: e.target.value.replace(/\D/g, "") }))} required />
            <button type="submit" className="btn-primary">Verify</button>
            <button type="button" className="btn-secondary" onClick={onResend}>Resend OTP</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
