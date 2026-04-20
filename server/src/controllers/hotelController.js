const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const Review = require("../models/Review");
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
      checkIn,
      checkOut,
      roomType,
    } = req.query;

    const query = { isActive: true };

    if (city) query["location.city"] = new RegExp(city, "i");
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
