const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Hotel.deleteMany(),
    Booking.deleteMany(),
    Payment.deleteMany(),
    Review.deleteMany(),
  ]);

  const [admin, user] = await User.create([
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

  const hotels = await Hotel.create([
    {
      name: "Ocean Crest Resort",
      description: "Beachfront luxury stay with spa, pool, and sea-view rooms.",
      location: { city: "Goa", address: "Candolim Beach Road", country: "India" },
      amenities: ["WiFi", "Pool", "Spa", "Breakfast", "Parking"],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4500, totalRooms: 20 },
        { type: "Double", basePrice: 6500, totalRooms: 15 },
        { type: "Suite", basePrice: 11000, totalRooms: 8 }
      ],
    },
    {
      name: "Metro Grand Hotel",
      description: "Premium business hotel in city center with conference halls.",
      location: { city: "Bengaluru", address: "MG Road", country: "India" },
      amenities: ["WiFi", "Gym", "Business Center", "Restaurant"],
      images: [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c"
      ],
      roomTypes: [
        { type: "Single", basePrice: 3500, totalRooms: 30 },
        { type: "Double", basePrice: 5200, totalRooms: 20 },
        { type: "Suite", basePrice: 9000, totalRooms: 10 }
      ],
    },
    {
      name: "Arctic Bay Retreat",
      description: "Scenic waterfront stay with curated experiences and wellness suites.",
      location: { city: "Kochi", address: "Marine Drive", country: "India" },
      amenities: ["WiFi", "Infinity Pool", "Spa", "Cruise Desk", "Airport Transfer"],
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
        "https://images.unsplash.com/photo-1455587734955-081b22074882"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4700, totalRooms: 18 },
        { type: "Double", basePrice: 6800, totalRooms: 14 },
        { type: "Suite", basePrice: 12500, totalRooms: 6 }
      ],
    },
    {
      name: "Skyline Luxe Towers",
      description: "Urban skyline property with premium work lounges and rooftop dining.",
      location: { city: "Hyderabad", address: "HITEC City", country: "India" },
      amenities: ["WiFi", "Gym", "Rooftop Bar", "Meeting Rooms", "Smart Check-in"],
      images: [
        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
        "https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5300, totalRooms: 28 },
        { type: "Double", basePrice: 7600, totalRooms: 22 },
        { type: "Suite", basePrice: 13800, totalRooms: 9 }
      ],
    },
    {
      name: "Desert Bloom Palace",
      description: "A heritage luxury property offering cultural evenings and palace-style suites.",
      location: { city: "Jodhpur", address: "Old Fort Road", country: "India" },
      amenities: ["WiFi", "Cultural Events", "Spa", "Fine Dining", "Private Tours"],
      images: [
        "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c",
        "https://images.unsplash.com/photo-1549294413-26f195200c16"
      ],
      roomTypes: [
        { type: "Single", basePrice: 6100, totalRooms: 16 },
        { type: "Double", basePrice: 8900, totalRooms: 12 },
        { type: "Suite", basePrice: 16200, totalRooms: 7 }
      ],
    },
    {
      name: "Pine Valley Lodge",
      description: "Mountain-side modern lodge with fireplace suites and nature trails.",
      location: { city: "Manali", address: "Solang Road", country: "India" },
      amenities: ["WiFi", "Mountain View", "Bonfire", "Adventure Desk", "Heated Rooms"],
      images: [
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4200, totalRooms: 20 },
        { type: "Double", basePrice: 6400, totalRooms: 16 },
        { type: "Suite", basePrice: 11900, totalRooms: 8 }
      ],
    },
    {
      name: "Emerald Lake Residency",
      description: "Lakeside luxury retreat with sunrise decks and private yacht dining.",
      location: { city: "Udaipur", address: "Lake Pichola Front", country: "India" },
      amenities: ["WiFi", "Lake View", "Infinity Pool", "Spa", "Butler Service"],
      images: [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb210f7",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd",
        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
        "https://images.unsplash.com/photo-1568495248636-6432b97bd949"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5900, totalRooms: 18 },
        { type: "Double", basePrice: 8200, totalRooms: 14 },
        { type: "Suite", basePrice: 15400, totalRooms: 7 }
      ],
    },
    {
      name: "Aurora Heights Boutique",
      description: "Art-inspired boutique hotel with skyline terraces and curated local experiences.",
      location: { city: "Pune", address: "Koregaon Park", country: "India" },
      amenities: ["WiFi", "Rooftop Cafe", "Co-working Lounge", "Yoga Deck", "Airport Pickup"],
      images: [
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427"
      ],
      roomTypes: [
        { type: "Single", basePrice: 3900, totalRooms: 26 },
        { type: "Double", basePrice: 6100, totalRooms: 20 },
        { type: "Suite", basePrice: 10800, totalRooms: 9 }
      ],
    },
    {
      name: "Coral Reef Grand",
      description: "Island-style resort with marine adventures and family-friendly villas.",
      location: { city: "Chennai", address: "East Coast Road", country: "India" },
      amenities: ["WiFi", "Private Beach", "Kids Club", "Pool", "Scuba Assistance"],
      images: [
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
        "https://images.unsplash.com/photo-1455587734955-081b22074882"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5200, totalRooms: 22 },
        { type: "Double", basePrice: 7600, totalRooms: 18 },
        { type: "Suite", basePrice: 13300, totalRooms: 8 }
      ],
    },
    {
      name: "Maple Crown Suites",
      description: "High-altitude escape with cedar interiors, snow trails, and wellness cuisine.",
      location: { city: "Shimla", address: "Mall Road Extension", country: "India" },
      amenities: ["WiFi", "Mountain View", "Heated Pool", "Spa", "Guided Trek Desk"],
      images: [
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
        "https://images.unsplash.com/photo-1590490359683-658d3d23f972"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4800, totalRooms: 24 },
        { type: "Double", basePrice: 7000, totalRooms: 18 },
        { type: "Suite", basePrice: 12100, totalRooms: 10 }
      ],
    },
    {
      name: "Harbor Mist Pavilion",
      description: "Coastal contemporary stay with private decks and oceanfront brunches.",
      location: { city: "Visakhapatnam", address: "Beachline Boulevard", country: "India" },
      amenities: ["WiFi", "Beach Access", "Pool", "Seafood Bistro", "Airport Transfer"],
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5100, totalRooms: 22 },
        { type: "Double", basePrice: 7300, totalRooms: 16 },
        { type: "Suite", basePrice: 13100, totalRooms: 8 }
      ],
    },
    {
      name: "Golden Dunes Habitat",
      description: "Elegant desert retreat with cultural nights and luxury tent suites.",
      location: { city: "Jaisalmer", address: "Sam Sand Road", country: "India" },
      amenities: ["WiFi", "Cultural Nights", "Camel Safari", "Spa", "Bonfire"],
      images: [
        "https://images.unsplash.com/photo-1549294413-26f195200c16",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4600, totalRooms: 24 },
        { type: "Double", basePrice: 6900, totalRooms: 18 },
        { type: "Suite", basePrice: 12000, totalRooms: 9 }
      ],
    },
    {
      name: "Monsoon Pearl Hotel",
      description: "Rainforest-inspired getaway with immersive wellness programs.",
      location: { city: "Munnar", address: "Tea Garden Heights", country: "India" },
      amenities: ["WiFi", "Rainforest View", "Ayurveda Spa", "Tea Lounge", "Nature Walks"],
      images: [
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4300, totalRooms: 26 },
        { type: "Double", basePrice: 6400, totalRooms: 20 },
        { type: "Suite", basePrice: 11200, totalRooms: 8 }
      ],
    },
    {
      name: "Cityline Aura Inn",
      description: "Smart business hotel with lightning-fast check-in and coworking floors.",
      location: { city: "Noida", address: "Sector 62", country: "India" },
      amenities: ["WiFi", "Coworking", "Gym", "Cafe", "Express Check-in"],
      images: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed"
      ],
      roomTypes: [
        { type: "Single", basePrice: 3400, totalRooms: 34 },
        { type: "Double", basePrice: 5300, totalRooms: 24 },
        { type: "Suite", basePrice: 9400, totalRooms: 10 }
      ],
    },
    {
      name: "Regal Orchid Stay",
      description: "Art deco inspired property featuring curated dining and music lounges.",
      location: { city: "Lucknow", address: "Hazratganj Circle", country: "India" },
      amenities: ["WiFi", "Fine Dining", "Live Music", "Spa", "Concierge"],
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4100, totalRooms: 28 },
        { type: "Double", basePrice: 6200, totalRooms: 20 },
        { type: "Suite", basePrice: 10300, totalRooms: 9 }
      ],
    },
    {
      name: "Silverline Quarters",
      description: "Minimalist hotel focused on comfort, speed, and modern urban living.",
      location: { city: "Ahmedabad", address: "SG Highway", country: "India" },
      amenities: ["WiFi", "Gym", "Smart Rooms", "Business Lounge", "Parking"],
      images: [
        "https://images.unsplash.com/photo-1590490359683-658d3d23f972",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427"
      ],
      roomTypes: [
        { type: "Single", basePrice: 3600, totalRooms: 30 },
        { type: "Double", basePrice: 5600, totalRooms: 22 },
        { type: "Suite", basePrice: 9700, totalRooms: 10 }
      ],
    },
    {
      name: "Velvet Horizon Estate",
      description: "Luxury estate retreat with vineyard dining and private lawn events.",
      location: { city: "Nashik", address: "Wine Valley Road", country: "India" },
      amenities: ["WiFi", "Vineyard View", "Pool", "Spa", "Private Dining"],
      images: [
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd",
        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a"
      ],
      roomTypes: [
        { type: "Single", basePrice: 6200, totalRooms: 20 },
        { type: "Double", basePrice: 9100, totalRooms: 14 },
        { type: "Suite", basePrice: 16800, totalRooms: 7 }
      ],
    },
    {
      name: "Bluebay Crown Plaza",
      description: "Family resort with lagoon pools, kid zones, and panoramic sunset decks.",
      location: { city: "Pondicherry", address: "Seaside Promenade", country: "India" },
      amenities: ["WiFi", "Lagoon Pool", "Kids Zone", "Cafe", "Bicycle Rentals"],
      images: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5000, totalRooms: 25 },
        { type: "Double", basePrice: 7400, totalRooms: 18 },
        { type: "Suite", basePrice: 12900, totalRooms: 8 }
      ],
    },
    {
      name: "Tranquil Fern Retreat",
      description: "Eco-resort surrounded by forests and guided wildlife trails.",
      location: { city: "Coorg", address: "Misty Hills", country: "India" },
      amenities: ["WiFi", "Forest Trails", "Spa", "Organic Dining", "Campfire"],
      images: [
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8"
      ],
      roomTypes: [
        { type: "Single", basePrice: 4500, totalRooms: 22 },
        { type: "Double", basePrice: 6700, totalRooms: 16 },
        { type: "Suite", basePrice: 11500, totalRooms: 8 }
      ],
    },
    {
      name: "Royal Meridian Palace",
      description: "Opulent palace hotel with heritage architecture and royal dining halls.",
      location: { city: "Mysuru", address: "Palace Loop Road", country: "India" },
      amenities: ["WiFi", "Heritage Tours", "Spa", "Pool", "Royal Banquet Hall"],
      images: [
        "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c",
        "https://images.unsplash.com/photo-1549294413-26f195200c16"
      ],
      roomTypes: [
        { type: "Single", basePrice: 6500, totalRooms: 16 },
        { type: "Double", basePrice: 9300, totalRooms: 12 },
        { type: "Suite", basePrice: 17500, totalRooms: 7 }
      ],
    },
    {
      name: "Sunset Marina Hotel",
      description: "Modern marina-side property with yacht berths and ocean dining.",
      location: { city: "Kochi", address: "Harbor Front", country: "India" },
      amenities: ["WiFi", "Marina View", "Seafood Grill", "Gym", "Airport Transfer"],
      images: [
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb210f7"
      ],
      roomTypes: [
        { type: "Single", basePrice: 5600, totalRooms: 20 },
        { type: "Double", basePrice: 7900, totalRooms: 16 },
        { type: "Suite", basePrice: 14200, totalRooms: 8 }
      ],
    },
  ]);

  const reviewDocs = hotels.map((hotel, index) => ({
    user: index % 2 === 0 ? user._id : admin._id,
    hotel: hotel._id,
    rating: [5, 4, 4, 5, 3, 4, 5, 4, 5, 4, 4, 5, 3, 4, 5, 4, 5, 4, 5, 4, 4, 5][index] || 4,
    comment: [
      "Amazing stay and very friendly staff.",
      "Excellent location for business travel.",
      "Great food and quick service.",
      "Loved the room ambience and cleanliness.",
      "Good value for money and smooth check-in.",
      "Beautiful views and relaxing atmosphere.",
      "Premium amenities and helpful concierge.",
      "Perfect weekend escape with family.",
      "Rooms were spacious and beautifully designed.",
      "Staff supported all requests promptly.",
      "Very good experience, will return again.",
      "One of the best properties in this city.",
      "Cozy interiors and calm environment.",
      "Great location and easy accessibility.",
      "Luxury feel with excellent hospitality.",
      "Breakfast spread and room service were great.",
      "Memorable stay with top notch comfort.",
      "Smooth booking and quick support from team.",
      "Fantastic property and scenic surroundings.",
      "Highly recommend for couples and families.",
      "Well maintained rooms and premium facilities.",
      "A near-perfect stay with strong value.",
    ][index] || "Great hotel experience.",
  }));

  const bonusReviews = hotels.slice(0, 8).map((hotel, index) => ({
    user: reviewDocs[index].user.equals(user._id) ? admin._id : user._id,
    hotel: hotel._id,
    rating: [4, 5, 3, 4, 5, 4, 5, 4][index],
    comment: [
      "Second stay was equally good.",
      "Outstanding property and service.",
      "Decent stay with nice amenities.",
      "Great comfort and easy booking flow.",
      "Wonderful heritage and dining experience.",
      "Calm location and clean rooms.",
      "Luxury experience worth the price.",
      "Very smooth and reliable hospitality.",
    ][index],
  }));

  await Review.create([...reviewDocs, ...bonusReviews]);

  const ratingStats = await Review.aggregate([
    {
      $group: {
        _id: "$hotel",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await Promise.all(
    ratingStats.map((item) =>
      Hotel.findByIdAndUpdate(item._id, {
        ratingAverage: Number(item.avgRating.toFixed(1)),
        ratingCount: item.count,
      })
    )
  );

  console.log("Seed completed");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
