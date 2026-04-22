const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const { generateIndiaHotels, generateReviewSeed } = require("./indiaHotelData");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Hotel.deleteMany(),
    Booking.deleteMany(),
    Payment.deleteMany(),
    Review.deleteMany(),
  ]);

  const [admin, demo] = await User.create([
    {
      name: "Admin User",
      email: "admin@hms.com",
      phone: "9998887771",
      password: "admin123",
      role: "admin",
      city: "Bengaluru",
      country: "India",
      emailVerified: true,
      phoneVerified: true,
    },
    {
      name: "Demo User",
      email: "user@hms.com",
      phone: "9998887772",
      password: "user123",
      role: "user",
      city: "Mumbai",
      country: "India",
      emailVerified: true,
      phoneVerified: true,
    },
  ]);

  const hotels = await Hotel.insertMany(generateIndiaHotels(36));
  const reviews = generateReviewSeed(hotels, { admin, demo }, 60);
  await Review.insertMany(reviews);

  console.log(`Seed completed with ${hotels.length} hotels and ${reviews.length} reviews`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
