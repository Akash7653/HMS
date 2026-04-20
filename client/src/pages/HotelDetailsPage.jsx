import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function GlassModal({ title, open, onClose, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-white/35 bg-white/80 p-4 shadow-2xl backdrop-blur-md sm:p-6 dark:border-slate-700/40 dark:bg-slate-900/80"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-bold sm:text-2xl">{title}</h3>
              <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [booking, setBooking] = useState({ roomType: "Single", checkIn: "", checkOut: "", guests: 1, paymentMethod: "razorpay" });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    api.get(`/hotels/${id}`).then((res) => {
      setHotel(res.data.hotel);
      setReviews(res.data.reviews);
    });

    api.get("/payments/config").then((res) => setPaymentConfig(res.data));
  }, [id]);

  useEffect(() => {
    if (!booking.checkIn || !booking.checkOut || !booking.roomType) return;

    api
      .get("/bookings/availability", {
        params: { hotelId: id, roomType: booking.roomType, checkIn: booking.checkIn, checkOut: booking.checkOut },
      })
      .then((res) => setAvailability(res.data))
      .catch(() => setAvailability(null));
  }, [booking.checkIn, booking.checkOut, booking.roomType, id]);

  const rooms = useMemo(() => hotel?.roomTypes || [], [hotel]);

  const onBook = async () => {
    if (!user) return toast.error("Login required");

    try {
      if (booking.paymentMethod === "razorpay") {
        setIsProcessingPayment(true);

        if (!paymentConfig?.razorpay?.enabled || !paymentConfig?.razorpay?.keyId) {
          toast.error("Razorpay is not configured yet");
          setIsProcessingPayment(false);
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Unable to load Razorpay checkout");
          setIsProcessingPayment(false);
          return;
        }

        const orderRes = await api.post("/payments/create-order", {
          amount: availability.totalPrice,
          hotelId: id,
          notes: {
            hotelName: hotel.name,
            roomType: booking.roomType,
          },
        });

        let failureRecorded = false;

        const recordFailure = async ({
          orderId,
          paymentId = "",
          reason,
          code = "",
          description = "",
          source = "",
          step = "",
          metadata = {},
        }) => {
          if (failureRecorded) return;

          try {
            await api.post("/payments/fail", {
              orderId,
              paymentId,
              hotelId: id,
              amount: availability?.totalPrice || 0,
              reason,
              code,
              description,
              source,
              step,
              metadata,
            });
            failureRecorded = true;
          } catch {
            // Non-blocking: failure persistence should not block checkout cleanup.
          }
        };

        const options = {
          key: paymentConfig.razorpay.keyId,
          amount: orderRes.data.amount,
          currency: orderRes.data.currency,
          name: "Horizon HMS",
          description: `${hotel.name} booking`,
          order_id: orderRes.data.orderId,
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone,
          },
          theme: {
            color: "#2563eb",
          },
          handler: async (response) => {
            try {
              await api.post("/payments/verify", {
                orderId: orderRes.data.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                hotelId: id,
                roomType: booking.roomType,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                guests: booking.guests,
                amount: availability.totalPrice,
              });

              toast.success("Payment verified and booking confirmed");
              setShowBookingModal(false);
            } catch (error) {
              toast.error(error.response?.data?.message || "Payment verification failed");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: async () => {
              await recordFailure({
                orderId: orderRes.data.orderId,
                reason: "user_cancelled",
                description: "Checkout closed by user before completing payment",
                source: "checkout_modal",
                step: "ondismiss",
              });

              toast.error("Payment cancelled. Saved in payment history.");
              setIsProcessingPayment(false);
            },
            escape: true,
            backdropclose: false,
          },
        };

        const checkout = new window.Razorpay(options);
        checkout.on("payment.failed", async (response) => {
          const gatewayError = response?.error || {};

          await recordFailure({
            orderId: gatewayError.metadata?.order_id || orderRes.data.orderId,
            paymentId: gatewayError.metadata?.payment_id || "",
            reason: gatewayError.reason || "payment_failed",
            code: gatewayError.code || "",
            description: gatewayError.description || "",
            source: gatewayError.source || "",
            step: gatewayError.step || "",
            metadata: gatewayError.metadata || {},
          });

          toast.error("Payment failed. Saved in payment history.");
          setIsProcessingPayment(false);
        });
        checkout.open();
        return;
      }

      const res = await api.post("/bookings", {
        hotelId: id,
        ...booking,
      });
      toast.success(`Booking confirmed. Ref ${res.data.booking.paymentReference || "pending"}`);
      setShowBookingModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
      setIsProcessingPayment(false);
    }
  };

  const onReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    try {
      await api.post("/reviews", { hotelId: id, ...reviewForm });
      const fresh = await api.get(`/reviews/hotel/${id}`);
      setReviews(fresh.data.data);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Review submitted");
      setShowReviewModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit review");
    }
  };

  const toggleWishlist = async () => {
    if (!user) return toast.error("Login required");
    await api.post("/wishlist/toggle", { hotelId: id });
    toast.success("Wishlist updated");
  };

  if (!hotel) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;

  const defaultHotelRules = [
    "Standard check-in is after 12:00 PM and check-out is before 11:00 AM.",
    "Outside visitors are not allowed in guest rooms after 10:00 PM.",
    "Smoking is only allowed in designated areas.",
    "Any property damage will be charged as per hotel policy.",
  ];

  const defaultRequiredDocuments = [
    "Government photo ID (Aadhaar / Passport / Driving License / Voter ID).",
    "Booking confirmation details (SMS/Email or app booking screen).",
    "For foreign guests: Valid passport and visa/OCI documents.",
  ];

  const defaultVacationPlanning = [
    "Weekday stays usually have better pricing than weekends.",
    "Book 2-4 weeks in advance for best inventory and rates.",
    "Choose room type based on trip purpose: work, family, or leisure.",
  ];

  const defaultBudgetGuidance = [
    { tier: "Budget", nightlyRange: "Rs. 2500 - Rs. 5000", note: "Good for short city trips and practical stays." },
    { tier: "Comfort", nightlyRange: "Rs. 5000 - Rs. 9000", note: "Balanced option for families and business travelers." },
    { tier: "Luxury", nightlyRange: "Rs. 9000+", note: "Premium amenities, views, and curated experiences." },
  ];

  const hotelRules = hotel?.guestPolicy?.rules?.length ? hotel.guestPolicy.rules : defaultHotelRules;
  const requiredDocuments = hotel?.guestPolicy?.requiredDocuments?.length ? hotel.guestPolicy.requiredDocuments : defaultRequiredDocuments;
  const eligibilityNote =
    hotel?.guestPolicy?.eligibilityNote ||
    "Guest must be at least 18 years old at check-in. Indian citizens should carry a valid government-issued ID.";
  const foreignGuestNote =
    hotel?.guestPolicy?.foreignGuestNote ||
    "If you are not an Indian citizen, bring your passport and valid visa/OCI documents for verification.";
  const vacationPlanning =
    hotel?.guestPolicy?.vacationPlanning?.length ? hotel.guestPolicy.vacationPlanning : defaultVacationPlanning;
  const budgetGuidance =
    hotel?.guestPolicy?.budgetGuidance?.length ? hotel.guestPolicy.budgetGuidance : defaultBudgetGuidance;
  const galleryImages = hotel?.images?.length
    ? hotel.images
    : [`https://placehold.co/1200x800?text=${encodeURIComponent(hotel?.name || "Hotel")}`];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/hotels")}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <span aria-hidden="true">←</span>
        Back to Hotels
      </button>

      <section className="card space-y-3 bg-gradient-to-br from-white via-slate-50 to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Featured stay</p>
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-4xl">{hotel.name}</h1>
          </div>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
            {hotel.location?.city}, {hotel.location?.country}
          </span>
        </div>
        <p className="max-w-3xl text-slate-600 dark:text-slate-300">{hotel.description}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img, index) => (
            <img
              key={`${img}-${index}`}
              src={img}
              alt={`${hotel.name} ${index + 1}`}
              className="h-48 w-full rounded-xl object-cover shadow-lg"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/1200x800?text=${encodeURIComponent(hotel.name)}`;
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {hotel.amenities.map((a) => (
            <span key={a} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
              {a}
            </span>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={toggleWishlist}>Add/Remove Wishlist</button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent sm:text-2xl">Book this hotel</h2>
          <select className="input" value={booking.roomType} onChange={(e) => setBooking((p) => ({ ...p, roomType: e.target.value }))}>
            {rooms.map((r) => (
              <option key={r.type} value={r.type}>{r.type} - Rs. {r.basePrice}</option>
            ))}
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" type="date" value={booking.checkIn} onChange={(e) => setBooking((p) => ({ ...p, checkIn: e.target.value }))} />
            <input className="input" type="date" value={booking.checkOut} onChange={(e) => setBooking((p) => ({ ...p, checkOut: e.target.value }))} />
          </div>
          <input className="input" type="number" min="1" max="10" value={booking.guests} onChange={(e) => setBooking((p) => ({ ...p, guests: Number(e.target.value) }))} />
          <div className="rounded-2xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-cyan-900/50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-200">
            <p className="font-semibold text-cyan-700 dark:text-cyan-300">Secure Checkout</p>
            <p className="mt-1">Razorpay opens in a popup before the booking is confirmed.</p>
          </div>

          {paymentConfig?.razorpay?.enabled ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Razorpay key loaded: {paymentConfig.razorpay.keyId}</p>
          ) : null}

          {availability ? (
            <div className="rounded-xl bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
              Available rooms: <b>{availability.availableRooms}</b><br />
              Nights: <b>{availability.nights}</b><br />
              Total: <b>Rs. {availability.totalPrice}</b>
            </div>
          ) : null}
          <button type="button" className="btn-primary bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-lg" onClick={() => setShowBookingModal(true)}>
            Open Payment Window
          </button>
        </div>

        <div className="card space-y-3 bg-gradient-to-br from-white to-fuchsia-50/60 dark:from-slate-900 dark:to-slate-800">
          <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-fuchsia-600 to-rose-600 bg-clip-text text-transparent sm:text-2xl">Reviews</h2>
          <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(true)}>Write Review (Popup)</button>

          <div className="space-y-2">
            {reviews.map((r) => (
              <article key={r._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="font-semibold">{r.user?.name || "Anonymous"} - {r.rating}/5</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3">
          <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent sm:text-2xl">Hotel Instructions & Rules</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Please review the property instructions before arrival to avoid check-in delays.
          </p>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {hotelRules.map((rule) => (
              <li key={rule} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent sm:text-2xl">Eligibility & Required Documents</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {eligibilityNote}
          </p>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200">
            {foreignGuestNote}
          </div>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {requiredDocuments.map((doc) => (
              <li key={doc} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                {doc}
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent sm:text-2xl">Vacation Planning & Budget</h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {vacationPlanning.map((tip) => (
              <li key={tip} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                {tip}
              </li>
            ))}
          </ul>

          <div className="space-y-2 pt-1">
            {budgetGuidance.map((item) => (
              <div key={`${item.tier}-${item.nightlyRange}`} className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 dark:border-indigo-900/50 dark:bg-indigo-900/20">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                  {item.tier}: {item.nightlyRange}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GlassModal title="Confirm Booking and Payment" open={showBookingModal} onClose={() => setShowBookingModal(false)}>
        {availability ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Room: <b>{booking.roomType}</b></p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Dates: <b>{booking.checkIn}</b> to <b>{booking.checkOut}</b></p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Guests: <b>{booking.guests}</b></p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Payment Method: <b>{booking.paymentMethod}</b></p>
            <p className="text-lg font-bold text-brand-700 dark:text-brand-300">Amount: Rs. {availability.totalPrice}</p>
            <button type="button" className="btn-primary w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-lg" onClick={onBook} disabled={isProcessingPayment}>
              {isProcessingPayment ? "Opening Checkout..." : "Pay And Confirm Booking"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Please select booking dates to continue.</p>
        )}
      </GlassModal>

      <GlassModal title="Share Your Review" open={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <form onSubmit={onReview} className="space-y-3">
          <select className="input" value={reviewForm.rating} onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
          </select>
          <textarea className="input min-h-24" placeholder="Write your review" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} />
          <button className="btn-primary w-full" type="submit">Submit Review</button>
        </form>
      </GlassModal>
    </div>
  );
}
