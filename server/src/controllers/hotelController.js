const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const { getBookedCount } = require("../services/availabilityService");

exports.getHotels = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      minPrice,
      maxPrice,
      rating,
      sortBy = "createdAt",
      order = "desc",
      q,
      state,
      checkIn,
      checkOut,
      roomType,
    } = req.query;

    const query = { isActive: true };

    if (city) query["location.city"] = new RegExp(city, "i");
    if (state) query["location.state"] = new RegExp(state, "i");
    if (rating) query.ratingAverage = { $gte: Number(rating) };
    if (q) query.name = new RegExp(q, "i");

    if (minPrice || maxPrice) {
      query.roomTypes = {
        $elemMatch: {
          basePrice: {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
          },
        },
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };

    const [hotels, total] = await Promise.all([
      Hotel.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Hotel.countDocuments(query),
    ]);

    let data = hotels;

    if (checkIn && checkOut && roomType) {
      data = await Promise.all(
        hotels.map(async (hotel) => {
          const type = hotel.roomTypes.find((r) => r.type === roomType);
          if (!type) return null;

          const booked = await getBookedCount({
            hotelId: hotel._id,
            roomType,
            checkIn,
            checkOut,
          });

          return {
            ...hotel.toObject(),
            availability: {
              roomType,
              availableRooms: Math.max(type.totalRooms - booked, 0),
            },
          };
        })
      );
      data = data.filter(Boolean);
    }

    res.json({
      data,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getHotelById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid hotel id" });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const reviews = await Review.find({ hotel: hotel._id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ hotel, reviews });
  } catch (error) {
    next(error);
  }
};

exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const safeRegex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;

    const [trendingCities, citySuggestions, stateSuggestions, hotelSuggestions] = await Promise.all([
      Booking.aggregate([
        { $match: { bookingStatus: "confirmed" } },
        {
          $lookup: {
            from: "hotels",
            localField: "hotel",
            foreignField: "_id",
            as: "hotel",
          },
        },
        { $unwind: "$hotel" },
        { $group: { _id: "$hotel.location.city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Hotel.find(safeRegex ? { "location.city": safeRegex, isActive: true } : { isActive: true })
        .select("location.city")
        .limit(8),
      Hotel.find(safeRegex ? { "location.state": safeRegex, isActive: true } : { isActive: true })
        .select("location.state")
        .limit(8),
      Hotel.find(safeRegex ? { name: safeRegex, isActive: true } : { isActive: true })
        .select("name location.city location.state")
        .sort({ ratingAverage: -1, ratingCount: -1 })
        .limit(8),
    ]);

    const uniqueCities = [...new Set(citySuggestions.map((h) => h.location.city).filter(Boolean))].slice(0, 8);
    const uniqueStates = [...new Set(stateSuggestions.map((h) => h.location.state).filter(Boolean))].slice(0, 8);

    res.json({
      query: q,
      suggestions: {
        trendingCities: trendingCities.map((city) => city._id).filter(Boolean),
        cities: uniqueCities,
        states: uniqueStates,
        hotels: hotelSuggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSimilarHotels = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid hotel id" });
    }

    const current = await Hotel.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Hotel not found" });

    const currentAvgPrice = Math.round(
      current.roomTypes.reduce((sum, room) => sum + room.basePrice, 0) / Math.max(current.roomTypes.length, 1)
    );
    const minPrice = Math.max(1000, currentAvgPrice - 1800);
    const maxPrice = currentAvgPrice + 1800;

    const similar = await Hotel.find({
      _id: { $ne: current._id },
      isActive: true,
      "location.state": current.location.state,
      roomTypes: { $elemMatch: { basePrice: { $gte: minPrice, $lte: maxPrice } } },
    })
      .sort({ ratingAverage: -1, ratingCount: -1 })
      .limit(12);

    res.json({ data: similar });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendedHotels = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [recentBookings, userWithFavorites] = await Promise.all([
      Booking.find({ user: userId, bookingStatus: "confirmed" })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate("hotel", "location.city location.state"),
      req.user.populate("favorites", "_id location.city location.state"),
    ]);

    const preferredCities = [...new Set(
      recentBookings.map((booking) => booking.hotel?.location?.city).filter(Boolean)
    )];
    const preferredStates = [...new Set(
      recentBookings.map((booking) => booking.hotel?.location?.state).filter(Boolean)
    )];
    const excludedIds = [
      ...new Set([
        ...recentBookings.map((booking) => String(booking.hotel?._id)).filter(Boolean),
        ...userWithFavorites.favorites.map((fav) => String(fav._id)),
      ]),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const query = {
      isActive: true,
      ...(excludedIds.length ? { _id: { $nin: excludedIds } } : {}),
      ...(preferredCities.length || preferredStates.length
        ? {
            $or: [
              ...(preferredCities.length ? [{ "location.city": { $in: preferredCities } }] : []),
              ...(preferredStates.length ? [{ "location.state": { $in: preferredStates } }] : []),
            ],
          }
        : {}),
    };

    let recommendations = await Hotel.find(query)
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(16);

    if (!recommendations.length) {
      recommendations = await Hotel.find({ isActive: true })
        .sort({ ratingAverage: -1, ratingCount: -1 })
        .limit(16);
    }

    res.json({
      data: recommendations,
      meta: {
        preferredCities,
        preferredStates,
      },
    });
  } catch (error) {
    next(error);
  }
};
