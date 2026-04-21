import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const paymentModes = ["UPI", "Card", "Wallet"];

function getMethod(mode) {
  if (mode === "UPI") return "upi";
  if (mode === "Wallet") return "wallet";
  return "card";
}

export default function BookingCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(location.state?.hotel || null);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    roomType: location.state?.booking?.roomType || "Single",
    checkIn: location.state?.booking?.checkIn || "",
    checkOut: location.state?.booking?.checkOut || "",
    guests: location.state?.booking?.guests || 1,
    coupon: "",
    paymentMode: "UPI",
  });

  useEffect(() => {
    if (!user) {
      toast.error("Please login to continue checkout");
      navigate("/login");
      return;
    }

    if (hotel) return;
    api.get(`/hotels/${id}`).then((res) => setHotel(res.data.hotel)).catch(() => {
      toast.error("Unable to load hotel details");
      navigate("/hotels");
    });
  }, [id, hotel, navigate, user]);

  useEffect(() => {
    if (!form.checkIn || !form.checkOut || !form.roomType) return;

    api.get("/bookings/availability", {
      params: {
        hotelId: id,
        roomType: form.roomType,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
      },
    })
      .then((res) => setAvailability(res.data))
      .catch(() => setAvailability(null));
  }, [id, form.checkIn, form.checkOut, form.roomType]);

  const price = useMemo(() => {
    const base = availability?.totalPrice || 0;
    const tax = Math.round(base * 0.12);
    const discount = form.coupon.trim().toUpperCase() === "SAVE10" ? Math.round(base * 0.1) : 0;
    return {
      base,
      tax,
      discount,
      total: Math.max(base + tax - discount, 0),
    };
  }, [availability, form.coupon]);

  const onConfirm = async (e) => {
    e.preventDefault();

    if (!availability) {
      toast.error("Please choose valid dates and room type");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/bookings", {
        hotelId: id,
        roomType: form.roomType,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        paymentMethod: getMethod(form.paymentMode),
      });

      toast.success("Booking confirmed successfully");
      navigate(`/confirmation/${res.data.booking._id}`, {
        state: {
          booking: res.data.booking,
          hotel,
          pricing: price,
          guest: { name: form.name, phone: form.phone, email: form.email },
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to complete booking");
    } finally {
      setLoading(false);
    }
  };

  if (!hotel) return <div className="mx-auto max-w-3xl px-4 py-8">Loading checkout...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-3 px-3 py-4 pb-28 md:space-y-4 md:px-4 md:py-8">
      <div className="card space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">Checkout</p>
        <h1 className="font-display text-[22px] font-bold leading-tight sm:text-2xl">Complete Your Booking</h1>
        <p className="text-[13px] text-slate-600 dark:text-slate-300 sm:text-sm">Secure your stay at {hotel.name} in a few quick steps.</p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-900/35 dark:text-blue-300">{hotel.location?.city}, {hotel.location?.country}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Room: {form.roomType}</span>
        </div>
      </div>

      <form onSubmit={onConfirm} className="space-y-3">
        <section className="card space-y-2.5">
          <h2 className="text-base font-bold sm:text-lg">Guest Details</h2>
          <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} required />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        </section>

        <section className="card space-y-2.5">
          <h2 className="text-base font-bold sm:text-lg">Room & Stay</h2>
          <select className="input" value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))}>
            {(hotel.roomTypes || []).map((room) => (
              <option key={room.type} value={room.type}>{room.type} - Rs. {room.basePrice}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">
              Start Date
              <input className="input" type="date" value={form.checkIn} onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))} required />
            </label>
            <label className="space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">
              End Date
              <input className="input" type="date" value={form.checkOut} onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))} required />
            </label>
          </div>
          <input className="input" type="number" min="1" max="10" value={form.guests} onChange={(e) => setForm((p) => ({ ...p, guests: e.target.value }))} />
          {availability ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 sm:text-sm">
              {availability.availableRooms} rooms available for selected dates.
            </p>
          ) : null}
        </section>

        <section className="card space-y-2.5">
          <h2 className="text-base font-bold sm:text-lg">Price Breakdown</h2>
          <input className="input" placeholder="Coupon code (try SAVE10)" value={form.coupon} onChange={(e) => setForm((p) => ({ ...p, coupon: e.target.value }))} />
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-[12px] dark:border-slate-700 dark:bg-slate-800/60 sm:text-sm">
            <div className="flex items-center justify-between"><span>Room total</span><b>Rs. {price.base}</b></div>
            <div className="flex items-center justify-between"><span>Taxes</span><b>Rs. {price.tax}</b></div>
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300"><span>Discount</span><b>- Rs. {price.discount}</b></div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700"><span>Total</span><span>Rs. {price.total}</span></div>
          </div>
        </section>

        <section className="card space-y-2.5">
          <h2 className="text-base font-bold sm:text-lg">Payment Option</h2>
          <div className="grid grid-cols-3 gap-2">
            {paymentModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-xl border px-3 py-2 text-[12px] font-semibold sm:text-sm ${form.paymentMode === mode ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
                onClick={() => setForm((p) => ({ ...p, paymentMode: mode }))}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Selected mode: <span className="font-semibold text-slate-700 dark:text-slate-200">{form.paymentMode}</span></p>
        </section>

        <button type="submit" disabled={loading} className="btn-primary w-full bg-gradient-to-r from-orange-500 to-emerald-500 py-2.5 text-sm font-bold disabled:opacity-60 sm:py-3 sm:text-base">
          {loading ? "Confirming..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
