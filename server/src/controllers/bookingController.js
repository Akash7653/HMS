const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Payment = require("../models/Payment");
const { calculateDynamicPrice } = require("../services/pricingService");
const { sendEmail } = require("../services/emailService");
const { sendSms } = require("../services/smsService");
const { invalidateHotelsCache } = require("../services/cacheService");
const {
  getBookedCount,
  publishAvailabilityEvent,
  subscribe,
  unsubscribe,
} = require("../services/availabilityService");

async function dispatchBookingNotifications({ user, hotel, booking, paymentReference }) {
  const emailHtml = `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>Your booking is confirmed</h2><p><strong>Hotel:</strong> ${hotel.name}</p><p><strong>Room:</strong> ${booking.roomType}</p><p><strong>Dates:</strong> ${booking.checkIn} to ${booking.checkOut}</p><p><strong>Guests:</strong> ${booking.guests}</p><p><strong>Amount:</strong> Rs. ${booking.totalPrice}</p><p><strong>Payment Ref:</strong> ${paymentReference || "Will be shared after Razorpay payment"}</p></div>`;

  const smsText = `Horizon-Hotels: Booking confirmed at ${hotel.name}. ${booking.checkIn} to ${booking.checkOut}, ${booking.roomType}, guests ${booking.guests}, amount Rs. ${booking.totalPrice}. Ref: ${paymentReference || "pending"}.`;

  const results = await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: "Booking Confirmed - Horizon-Hotels",
      html: emailHtml,
    }),
    sendSms({ phone: user.phone, body: smsText }),
  ]);

  const rejected = results.filter((item) => item.status === "rejected");
  if (rejected.length) {
    console.error("[BOOKING_NOTIFICATION_WARNING]", rejected.map((r) => r.reason?.message || String(r.reason)));
  }
}

async function dispatchCancellationNotifications({ user, booking, refundReference }) {
  const emailHtml = `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>Your booking was cancelled</h2><p><strong>Hotel:</strong> ${booking.hotel.name}</p><p><strong>Dates:</strong> ${booking.checkIn} to ${booking.checkOut}</p><p><strong>Refund status:</strong> Initiated</p><p><strong>Amount:</strong> Rs. ${booking.totalPrice}</p><p><strong>Reference:</strong> ${refundReference}</p></div>`;

  const smsText = `Horizon-Hotels: Booking cancelled for ${booking.hotel.name}. Refund initiated for Rs. ${booking.totalPrice}. Ref: ${refundReference}.`;

  const results = await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: "Booking Cancelled - Horizon-Hotels",
      html: emailHtml,
    }),
    sendSms({ phone: user.phone, body: smsText }),
  ]);

  const rejected = results.filter((item) => item.status === "rejected");
  if (rejected.length) {
    console.error("[CANCELLATION_NOTIFICATION_WARNING]", rejected.map((r) => r.reason?.message || String(r.reason)));
  }
}

exports.checkAvailability = async (req, res, next) => {
  try {
    const { hotelId, roomType, checkIn, checkOut } = req.query;

    if (!hotelId || !roomType || !checkIn || !checkOut) {
      return res.status(400).json({ message: "hotelId, roomType, checkIn, checkOut are required" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const selectedRoom = hotel.roomTypes.find((room) => room.type === roomType);
    if (!selectedRoom) return res.status(404).json({ message: "Room type not found" });

    const bookedCount = await getBookedCount({ hotelId, roomType, checkIn, checkOut });
    const availableRooms = Math.max(selectedRoom.totalRooms - bookedCount, 0);

    const { nights, totalPrice } = calculateDynamicPrice({
      basePrice: selectedRoom.basePrice,
      checkIn,
      checkOut,
    });

    res.json({
      hotelId,
      roomType,
      totalRooms: selectedRoom.totalRooms,
      bookedCount,
      availableRooms,
      nights,
      pricePerNight: selectedRoom.basePrice,
      totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { hotelId, roomType, checkIn, checkOut, guests, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid hotel id" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const selectedRoom = hotel.roomTypes.find((room) => room.type === roomType);
    if (!selectedRoom) return res.status(404).json({ message: "Room type not found" });

    const bookedCount = await getBookedCount({ hotelId, roomType, checkIn, checkOut });

    if (bookedCount >= selectedRoom.totalRooms) {
      return res.status(409).json({ message: "No rooms available for selected dates" });
    }

    const { nights, totalPrice } = calculateDynamicPrice({
      basePrice: selectedRoom.basePrice,
      checkIn,
      checkOut,
    });

    const method = paymentMethod || process.env.PAYMENT_PROVIDER || "stripe";
    const paymentReference = method === "razorpay-sim" ? `RZP-${Date.now()}` : `PAY-${Date.now()}`;
    const paymentCaptured = method !== "razorpay";

    const booking = await Booking.create({
      user: req.user._id,
      hotel: hotel._id,
      roomType,
      checkIn,
      checkOut,
      nights,
      guests,
      basePricePerNight: selectedRoom.basePrice,
      totalPrice,
      paymentStatus: paymentCaptured ? "paid" : "pending",
      paymentMethod: method,
      paymentReference: paymentCaptured ? paymentReference : "",
      bookingStatus: "confirmed",
    });

    if (paymentCaptured) {
      await Payment.create({
        booking: booking._id,
        user: req.user._id,
        hotel: hotel._id,
        amount: totalPrice,
        paymentMethod: method,
        provider: method === "razorpay-sim" ? "razorpay" : "stripe",
        status: "paid",
        reference: paymentReference,
        note: "Payment captured successfully",
      });
    }

    if (paymentCaptured) {
      await dispatchBookingNotifications({
        user: req.user,
        hotel,
        booking,
        paymentReference,
      });
    }

    publishAvailabilityEvent({
      type: "BOOKING_CREATED",
      hotelId: String(hotel._id),
      roomType,
      checkIn,
      checkOut,
    });

    await invalidateHotelsCache();

    res.status(201).json({ booking, paymentCaptured });
  } catch (error) {
    next(error);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("hotel", "name location images")
      .sort({ createdAt: -1 });

    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate("hotel", "name images location");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    booking.bookingStatus = "cancelled";
    booking.cancellationReason = req.body.reason || "Cancelled by user";
    booking.paymentStatus = "refunded";

    await booking.save();

    await Payment.create({
      booking: booking._id,
      user: req.user._id,
      hotel: booking.hotel._id,
      amount: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
      provider: booking.paymentMethod === "razorpay-sim" ? "razorpay" : "stripe",
      status: "refunded",
      reference: `${booking.paymentReference}-REFUND`,
      note: booking.cancellationReason,
    });

    const refundReference = `${booking.paymentReference}-REFUND`;
    await dispatchCancellationNotifications({
      user: req.user,
      booking,
      refundReference,
    });

    publishAvailabilityEvent({
      type: "BOOKING_CANCELLED",
      hotelId: String(booking.hotel._id),
      roomType: booking.roomType,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    });

    await invalidateHotelsCache();

    const deletedBooking = await Booking.findByIdAndDelete(booking._id);

    res.json({ booking: deletedBooking || booking, cancelled: true });
  } catch (error) {
    next(error);
  }
};

exports.streamAvailability = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);
  subscribe(res);

  req.on("close", () => {
    unsubscribe(res);
  });
};

