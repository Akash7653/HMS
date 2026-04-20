import { useEffect, useState } from "react";
import api from "../../api";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get("/admin/bookings").then((res) => setBookings(res.data.data));
  }, []);

  return (
    <section className="space-y-2">
      {bookings.map((b) => (
        <article key={b._id} className="card flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold">{b.hotel?.name} - {b.roomType}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">User: {b.user?.name} ({b.user?.email})</p>
            <p className="text-sm">{new Date(b.checkIn).toDateString()} to {new Date(b.checkOut).toDateString()}</p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
            {b.bookingStatus}
          </span>
        </article>
      ))}
    </section>
  );
}
