const Review = require("../models/Review");
const Hotel = require("../models/Hotel");
const { invalidateHotelsCache } = require("../services/cacheService");

async function refreshHotelRating(hotelId) {
  const stats = await Review.aggregate([
    { $match: { hotel: hotelId } },
    {
      $group: {
        _id: "$hotel",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const data = stats[0] || { average: 0, count: 0 };

  await Hotel.findByIdAndUpdate(hotelId, {
    ratingAverage: Number(data.average.toFixed(1)),
    ratingCount: data.count,
  });
}

exports.addReview = async (req, res, next) => {
  try {
    const { hotelId, rating, comment } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, hotel: hotelId },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await refreshHotelRating(hotel._id);
    await invalidateHotelsCache();

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

exports.getHotelReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ data: reviews });
  } catch (error) {
    next(error);
  }
};
