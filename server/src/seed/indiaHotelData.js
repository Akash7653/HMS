const REGION_DATA = [
  { state: "Andhra Pradesh", city: "Visakhapatnam", lat: 17.6868, lng: 83.2185, address: "Beach Road", priceBase: 4200 },
  { state: "Arunachal Pradesh", city: "Itanagar", lat: 27.0844, lng: 93.6053, address: "NH-415 Corridor", priceBase: 3800 },
  { state: "Assam", city: "Guwahati", lat: 26.1445, lng: 91.7362, address: "GS Road", priceBase: 3600 },
  { state: "Bihar", city: "Patna", lat: 25.5941, lng: 85.1376, address: "Boring Road", priceBase: 3200 },
  { state: "Chhattisgarh", city: "Raipur", lat: 21.2514, lng: 81.6296, address: "VIP Road", priceBase: 3300 },
  { state: "Goa", city: "Panaji", lat: 15.4909, lng: 73.8278, address: "Miramar Beach Road", priceBase: 5200 },
  { state: "Gujarat", city: "Ahmedabad", lat: 23.0225, lng: 72.5714, address: "SG Highway", priceBase: 3900 },
  { state: "Haryana", city: "Gurugram", lat: 28.4595, lng: 77.0266, address: "Golf Course Road", priceBase: 4800 },
  { state: "Himachal Pradesh", city: "Shimla", lat: 31.1048, lng: 77.1734, address: "Mall Road", priceBase: 4700 },
  { state: "Jharkhand", city: "Ranchi", lat: 23.3441, lng: 85.3096, address: "Main Road", priceBase: 3100 },
  { state: "Karnataka", city: "Bengaluru", lat: 12.9716, lng: 77.5946, address: "MG Road", priceBase: 4300 },
  { state: "Kerala", city: "Kochi", lat: 9.9312, lng: 76.2673, address: "Marine Drive", priceBase: 4100 },
  { state: "Madhya Pradesh", city: "Indore", lat: 22.7196, lng: 75.8577, address: "Ring Road", priceBase: 3400 },
  { state: "Maharashtra", city: "Mumbai", lat: 19.076, lng: 72.8777, address: "Marine Drive", priceBase: 6500 },
  { state: "Manipur", city: "Imphal", lat: 24.817, lng: 93.9368, address: "Airport Road", priceBase: 3000 },
  { state: "Meghalaya", city: "Shillong", lat: 25.5788, lng: 91.8933, address: "Police Bazar", priceBase: 3600 },
  { state: "Mizoram", city: "Aizawl", lat: 23.7271, lng: 92.7176, address: "Chhinga Veng", priceBase: 2900 },
  { state: "Nagaland", city: "Kohima", lat: 25.6751, lng: 94.1086, address: "TCP Gate", priceBase: 2800 },
  { state: "Odisha", city: "Bhubaneswar", lat: 20.2961, lng: 85.8245, address: "Jayadev Vihar", priceBase: 3500 },
  { state: "Punjab", city: "Amritsar", lat: 31.634, lng: 74.8723, address: "Mall Road", priceBase: 3900 },
  { state: "Rajasthan", city: "Jaipur", lat: 26.9124, lng: 75.7873, address: "MI Road", priceBase: 4600 },
  { state: "Sikkim", city: "Gangtok", lat: 27.3389, lng: 88.6065, address: "MG Marg", priceBase: 4300 },
  { state: "Tamil Nadu", city: "Chennai", lat: 13.0827, lng: 80.2707, address: "T Nagar", priceBase: 4400 },
  { state: "Telangana", city: "Hyderabad", lat: 17.385, lng: 78.4867, address: "HITEC City", priceBase: 4700 },
  { state: "Tripura", city: "Agartala", lat: 23.8315, lng: 91.2868, address: "Airport Road", priceBase: 2900 },
  { state: "Uttar Pradesh", city: "Lucknow", lat: 26.8467, lng: 80.9462, address: "Gomti Nagar", priceBase: 3500 },
  { state: "Uttarakhand", city: "Dehradun", lat: 30.3165, lng: 78.0322, address: "Rajpur Road", priceBase: 4000 },
  { state: "West Bengal", city: "Kolkata", lat: 22.5726, lng: 88.3639, address: "Park Street", priceBase: 4200 },
];

const HOTEL_PREFIXES = ["Grand", "Heritage", "Premium", "Royal", "Celestial", "Vista", "Serene", "Horizon", "Marina", "Orchid", "Amber", "Palm", "Summit", "Luxe", "Crest", "Aster", "Bluebell", "Coral", "Zen", "Sapphire", "Emerald", "Regal", "Terra", "Elysian"];
const HOTEL_SUFFIXES = ["Stay", "Residency", "Suites", "Retreat", "Palace", "Heights", "Manor", "Pavilion", "House", "Plaza", "Inn", "Resort", "Boutique", "Haven", "Estate", "Lodge"];
const HOTEL_TYPES = ["business hotel", "family retreat", "boutique stay", "luxury resort", "city stay", "wellness escape", "premium apartment-hotel", "heritage property"];
const DESCRIPTORS = ["Modern interiors", "Locally inspired dining", "Fast check-in", "Quiet rooms", "Signature suites", "Rooftop views", "Wellness services", "Thoughtful hospitality", "Smart-room controls", "Contemporary comfort"];
const AMENITY_POOL = ["WiFi", "AC", "Pool", "Spa", "Gym", "Breakfast", "Parking", "Restaurant", "Business Center", "Airport Transfer", "Rooftop Lounge", "Concierge", "Family Rooms", "Smart Check-in", "Laundry"];
const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
  "https://images.unsplash.com/photo-1455587734955-081b22074882",
  "https://images.unsplash.com/photo-1501117716987-c8e1ecb210f7",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
  "https://images.unsplash.com/photo-1590490359683-658d3d23f972",
  "https://images.unsplash.com/photo-1595658658481-d53d3f999875",
];

function createSeededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  return function random() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMany(items, count, random) {
  const shuffled = [...items].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function offsetCoordinate(value, spread, random) {
  return round(value + (random() - 0.5) * spread, 6);
}

function generateIndiaHotels(perState = 36) {
  const hotels = [];

  REGION_DATA.forEach((region, regionIndex) => {
    for (let hotelIndex = 0; hotelIndex < perState; hotelIndex += 1) {
      const seed = (regionIndex + 1) * 1000 + hotelIndex + 17;
      const random = createSeededRandom(seed);
      const prefix = HOTEL_PREFIXES[Math.floor(random() * HOTEL_PREFIXES.length)];
      const suffix = HOTEL_SUFFIXES[Math.floor(random() * HOTEL_SUFFIXES.length)];
      const hotelNumber = String(hotelIndex + 1).padStart(2, "0");
      const stateTag = region.state.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
      const name = `${prefix} ${region.city} ${suffix} ${hotelNumber}`;
      const description = `${DESCRIPTORS[Math.floor(random() * DESCRIPTORS.length)]} ${HOTEL_TYPES[Math.floor(random() * HOTEL_TYPES.length)]} in ${region.city}, ${region.state}.`;
      const area = `${region.address} ${hotelNumber}`;
      const basePrice = Math.round(region.priceBase + random() * 2200);
      const single = Math.round(basePrice * (0.78 + random() * 0.06));
      const double = Math.round(single * (1.32 + random() * 0.08));
      const suite = Math.round(double * (1.58 + random() * 0.1));
      const ratingAverage = round(3.7 + random() * 1.2, 1);
      const ratingCount = 12 + Math.floor(random() * 190);

      hotels.push({
        name,
        description,
        location: {
          state: region.state,
          city: region.city,
          address: `${area}, ${region.city}`,
          country: "India",
          coordinates: {
            lat: offsetCoordinate(region.lat, 0.36, random),
            lng: offsetCoordinate(region.lng, 0.36, random),
          },
        },
        amenities: pickMany(AMENITY_POOL, 5 + Math.floor(random() * 2), random),
        images: pickMany(IMAGE_POOL, 3, random),
        roomTypes: [
          { type: "Single", basePrice: single, totalRooms: 12 + Math.floor(random() * 18) },
          { type: "Double", basePrice: double, totalRooms: 8 + Math.floor(random() * 14) },
          { type: "Suite", basePrice: suite, totalRooms: 4 + Math.floor(random() * 8) },
        ],
        ratingAverage,
        ratingCount,
        isActive: true,
        meta: {
          stateTag,
          regionSeed: seed,
        },
      });
    }
  });

  return hotels;
}

function generateReviewSeed(hotels, users, limit = 60) {
  const comments = [
    "Very clean rooms and smooth check-in.",
    "Great location and helpful staff.",
    "Comfortable stay with good amenities.",
    "Excellent value for the price.",
    "Breakfast was fresh and service was fast.",
    "Would book again for the same city.",
    "Easy booking flow and reliable support.",
    "Loved the room view and the quiet ambience.",
    "Professional staff and good maintenance.",
    "A polished stay from arrival to checkout.",
  ];

  const reviews = [];
  const selectedHotels = hotels.slice(0, limit);

  selectedHotels.forEach((hotel, index) => {
    const random = createSeededRandom(index + 2026);
    const baseRating = hotel.ratingAverage || 4;
    reviews.push({
      user: index % 2 === 0 ? users.demo._id : users.admin._id,
      hotel: hotel._id,
      rating: Math.min(5, Math.max(3, Math.round(baseRating))),
      comment: comments[index % comments.length],
    });
    reviews.push({
      user: index % 2 === 0 ? users.admin._id : users.demo._id,
      hotel: hotel._id,
      rating: Math.min(5, Math.max(3, Math.round(baseRating + (random() > 0.5 ? 1 : -1) * 0.2))),
      comment: comments[(index + 3) % comments.length],
    });
  });

  return reviews;
}

module.exports = {
  REGION_DATA,
  generateIndiaHotels,
  generateReviewSeed,
};
