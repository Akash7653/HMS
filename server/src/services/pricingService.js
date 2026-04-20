const dayjs = require("dayjs");

exports.calculateNights = (checkIn, checkOut) => {
  const inDate = dayjs(checkIn).startOf("day");
  const outDate = dayjs(checkOut).startOf("day");
  return outDate.diff(inDate, "day");
};

exports.calculateDynamicPrice = ({ basePrice, checkIn, checkOut }) => {
  const nights = exports.calculateNights(checkIn, checkOut);

  if (nights < 1) {
    throw new Error("Checkout date must be after check-in date");
  }

  const inDate = dayjs(checkIn);
  const weekendNights = Array.from({ length: nights }).reduce((acc, _, idx) => {
    const d = inDate.add(idx, "day").day();
    return d === 0 || d === 6 ? acc + 1 : acc;
  }, 0);

  const weekdayNights = nights - weekendNights;
  const total = weekdayNights * basePrice + weekendNights * basePrice * 1.2;

  return {
    nights,
    totalPrice: Math.round(total),
  };
};
