import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const hotel = location.state?.hotel;
  const pricing = location.state?.pricing;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-28 md:py-10">
      <section className="card space-y-3 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:border-emerald-700/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <p className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
          Booking Success
        </p>
        <h1 className="font-display text-2xl font-bold">Your stay is confirmed</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Booking ID: <span className="font-bold text-slate-900 dark:text-slate-100">{booking?._id || bookingId}</span></p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Hotel Summary</h2>
        <p className="font-semibold">{hotel?.name || "Horizon-Hotels Partner Stay"}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{hotel?.location?.city || "City"}, {hotel?.location?.state || "State"}, {hotel?.location?.country || "India"}</p>
        {booking ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500">Check-in</p>
              <p className="font-semibold">{new Date(booking.checkIn).toDateString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500">Check-out</p>
              <p className="font-semibold">{new Date(booking.checkOut).toDateString()}</p>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-slate-600 dark:text-slate-300">Room type: <span className="font-semibold">{booking?.roomType || "Standard"}</span></p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Total paid: <span className="font-semibold">Rs. {pricing?.total ?? booking?.totalPrice ?? 0}</span></p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Need Invoice?</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Use the download action below to save or print your booking confirmation.</p>
        <button type="button" onClick={() => window.print()} className="btn-secondary w-full">
          Download Invoice
        </button>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-secondary" onClick={() => navigate("/hotels")}>Book Another</button>
        <Link to="/bookings" className="btn-primary text-center">My Bookings</Link>
      </div>
    </div>
  );
}
