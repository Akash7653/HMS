import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api";

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    const res = await api.get("/bookings/me");
    setBookings(res.data.data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (id) => {
    const shouldCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!shouldCancel) return;

    try {
      await api.patch(`/bookings/${id}/cancel`, { reason: "Cancelled from dashboard" });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel booking");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="card bg-gradient-to-br from-white via-slate-50 to-fuchsia-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Trips</p>
        <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-4xl">My Bookings</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage your active stays and cancel with one action.</p>
      </section>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="card text-center">
            <p className="font-semibold">No active bookings found</p>
          </div>
        ) : (
          bookings.map((b, index) => (
            <motion.article
              key={b._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card overflow-hidden bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            >
              <div className="grid gap-4 lg:grid-cols-[140px_1fr_auto] lg:items-center">
                <img
                  src={b.hotel?.images?.[0] || "https://images.unsplash.com/photo-1502920917128-1aa500764b86?auto=format&fit=crop&w=800&q=80"}
                  alt={b.hotel?.name || "Hotel"}
                  className="h-24 w-full rounded-2xl object-cover shadow-md"
                />
                <div>
                  <h2 className="font-display text-lg font-semibold sm:text-xl">{b.hotel?.name} - {b.roomType}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(b.checkIn).toDateString()} to {new Date(b.checkOut).toDateString()} ({b.nights} nights)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {b.bookingStatus}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {b.paymentStatus}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Rs. {b.totalPrice}
                    </span>
                  </div>
                </div>
                {b.bookingStatus !== "cancelled" && (
                  <button className="btn-secondary self-start lg:self-center" type="button" onClick={() => cancelBooking(b._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}
