const Booking = require("../models/Booking");

const subscribers = new Set();

exports.getBookedCount = async ({ hotelId, roomType, checkIn, checkOut, excludeBookingId }) => {
  const query = {
    hotel: hotelId,
    roomType,
    bookingStatus: "confirmed",
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.countDocuments(query);
};

exports.publishAvailabilityEvent = (payload) => {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of subscribers) {
    res.write(message);
  }
};

exports.subscribe = (res) => {
  subscribers.add(res);
};

exports.unsubscribe = (res) => {
  subscribers.delete(res);
};
