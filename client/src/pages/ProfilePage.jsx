import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    country: user?.country || "",
  });

  const onSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(form);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 font-display text-3xl font-bold">My Profile</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Account Active
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Profile Ready
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

    </div>
  );
}
