const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const { calculateDynamicPrice } = require("../services/pricingService");
const razorpayService = require("../services/razorpayService");
const { sendInvoiceEmail } = require("../services/invoiceService");
const { sendEmail } = require("../services/emailService");
const { sendSms } = require("../services/smsService");

async function dispatchBookingPaidNotifications({ user, booking, hotelName, paymentReference }) {
  const emailHtml = `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>Your booking is confirmed</h2><p><strong>Hotel:</strong> ${hotelName}</p><p><strong>Room:</strong> ${booking.roomType}</p><p><strong>Dates:</strong> ${booking.checkIn} to ${booking.checkOut}</p><p><strong>Guests:</strong> ${booking.guests}</p><p><strong>Amount:</strong> Rs. ${booking.totalPrice}</p><p><strong>Payment Ref:</strong> ${paymentReference}</p></div>`;

  const smsText = `Horizon HMS: Booking confirmed at ${hotelName}. ${booking.checkIn} to ${booking.checkOut}, ${booking.roomType}, guests ${booking.guests}, amount Rs. ${booking.totalPrice}. Ref: ${paymentReference}.`;

  const results = await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: "Booking Confirmed - Horizon HMS",
      html: emailHtml,
    }),
    sendSms({ phone: user.phone, body: smsText }),
  ]);

  const rejected = results.filter((item) => item.status === "rejected");
  if (rejected.length) {
    console.error("[PAYMENT_BOOKING_NOTIFICATION_WARNING]", rejected.map((r) => r.reason?.message || String(r.reason)));
  }
}

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("hotel", "name location images")
      .populate("booking", "checkIn checkOut bookingStatus")
      .sort({ createdAt: -1 });

    res.json({ data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentConfig = (_req, res) => {
  res.json({
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || "",
      enabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
  });
};

/**
 * Create a Razorpay order for booking
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, bookingId, hotelId, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    if (!razorpayService.isConfigured()) {
      return res.status(503).json({ message: "Payment service not configured" });
    }

    const order = await razorpayService.createOrder(amount, "INR", {
      bookingId: bookingId ? String(bookingId) : "",
      hotelId: hotelId ? String(hotelId) : "",
      userId: String(req.user._id),
      ...notes,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId,
      hotelId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Razorpay payment and create payment record
 */
exports.verifyRazorpayPayment = async (req, res, next) => {
  let booking = null;
  let createdBookingHere = false;

  try {
    const { orderId, paymentId, signature, bookingId, hotelId, amount, roomType, checkIn, checkOut, guests } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify HMAC signature
    const isValid = razorpayService.verifySignature(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      reference: paymentId,
    });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment already processed" });
    }

    let paymentAmount = amount;

    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      if (!hotelId || !roomType || !checkIn || !checkOut || !guests) {
        return res.status(400).json({ message: "Booking details are required" });
      }

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });

      const selectedRoom = hotel.roomTypes.find((room) => room.type === roomType);
      if (!selectedRoom) return res.status(404).json({ message: "Room type not found" });

      const pricing = calculateDynamicPrice({
        basePrice: selectedRoom.basePrice,
        checkIn,
        checkOut,
      });

      paymentAmount = pricing.totalPrice;
      booking = await Booking.create({
        user: req.user._id,
        hotel: hotel._id,
        roomType,
        checkIn,
        checkOut,
        nights: pricing.nights,
        guests,
        basePricePerNight: selectedRoom.basePrice,
        totalPrice: pricing.totalPrice,
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        paymentReference: paymentId,
        bookingStatus: "confirmed",
      });
      createdBookingHere = true;
    } else {
      booking.paymentStatus = "paid";
      booking.paymentMethod = "razorpay";
      booking.paymentReference = paymentId;
      booking.bookingStatus = "confirmed";
      await booking.save();
    }

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      hotel: booking.hotel,
      amount: paymentAmount,
      currency: "INR",
      paymentMethod: "razorpay",
      provider: "razorpay",
      status: "paid",
      reference: paymentId,
      note: "Payment verified and captured",
    });

    const populatedPayment = await payment.populate("hotel", "name location");
    const invoiceData = {
      ...populatedPayment.toObject(),
      userName: req.user.name,
      userEmail: req.user.email,
      userPhone: req.user.phone,
      hotelName: populatedPayment.hotel.name,
    };

    await sendInvoiceEmail(invoiceData, req.user.email);

    await dispatchBookingPaidNotifications({
      user: req.user,
      booking,
      hotelName: populatedPayment.hotel.name,
      paymentReference: paymentId,
    });

    res.json({
      message: "Payment verified and recorded",
      booking: {
        id: booking._id,
        hotel: booking.hotel,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        totalPrice: booking.totalPrice,
      },
      payment: {
        id: payment._id,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
      },
    });
  } catch (error) {
    if (createdBookingHere && booking?._id) {
      await Booking.findByIdAndDelete(booking._id).catch(() => null);
    }
    next(error);
  }
};

/**
 * Record a failed Razorpay payment attempt so it appears in payment history.
 */
exports.recordFailedRazorpayPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      paymentId,
      hotelId,
      amount,
      reason,
      code,
      description,
      source,
      step,
      metadata,
    } = req.body;

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel is required" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const reference = paymentId || orderId || `failed_${Date.now()}`;

    const existing = await Payment.findOne({ reference, user: req.user._id });
    if (existing) {
      return res.json({
        message: "Payment failure already recorded",
        payment: {
          id: existing._id,
          reference: existing.reference,
          status: existing.status,
          amount: existing.amount,
        },
      });
    }

    const failureDetails = [
      reason,
      code,
      description,
      source,
      step,
      metadata?.order_id,
      metadata?.payment_id,
    ]
      .filter(Boolean)
      .join(" | ");

    const payment = await Payment.create({
      booking: null,
      user: req.user._id,
      hotel: hotel._id,
      amount: Number(amount) || 0,
      currency: "INR",
      paymentMethod: "razorpay",
      provider: "razorpay",
      status: "failed",
      reference,
      note: failureDetails || "Payment failed at gateway",
    });

    res.status(201).json({
      message: "Failed payment recorded",
      payment: {
        id: payment._id,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
      },
    });
  } catch (error) {
    next(error);
  }
};
