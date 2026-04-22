const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const { invalidateHotelsCache } = require("../services/cacheService");

exports.createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    await invalidateHotelsCache();
    res.status(201).json({ hotel });
  } catch (error) {
    next(error);
  }
};

exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    await invalidateHotelsCache();
    res.json({ hotel });
  } catch (error) {
    next(error);
  }
};

exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    await invalidateHotelsCache();
    res.json({ message: "Hotel deactivated" });
  } catch (error) {
    next(error);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { roomType, totalRooms } = req.body;
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const target = hotel.roomTypes.find((rt) => rt.type === roomType);
    if (!target) return res.status(404).json({ message: "Room type not found" });

    target.totalRooms = totalRooms;
    await hotel.save();

    await invalidateHotelsCache();
    res.json({ hotel });
  } catch (error) {
    next(error);
  }
};

exports.getAllBookings = async (_req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("hotel", "name location")
      .sort({ createdAt: -1 });

    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (_req, res, next) => {
  try {
    const [confirmedBookings, revenueAgg, occupancyAgg, popularRoomsAgg] = await Promise.all([
      Booking.countDocuments({ bookingStatus: "confirmed" }),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        { $match: { bookingStatus: "confirmed" } },
        { $group: { _id: "$hotel", bookedNights: { $sum: "$nights" } } },
      ]),
      Booking.aggregate([
        { $match: { bookingStatus: "confirmed" } },
        {
          $group: {
            _id: "$roomType",
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const hotels = await Hotel.find({ isActive: true });
    const totalInventory = hotels.reduce(
      (sum, hotel) => sum + hotel.roomTypes.reduce((s, rt) => s + rt.totalRooms, 0),
      0
    );

    const totalBookedNights = occupancyAgg.reduce((sum, item) => sum + item.bookedNights, 0);
    const occupancyRate = totalInventory > 0
      ? Math.min((totalBookedNights / (totalInventory * 30)) * 100, 100)
      : 0;
    const activeHotels = hotels.length;
    const cityCount = new Set(hotels.map((hotel) => hotel.location?.city).filter(Boolean)).size;

    res.json({
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      occupancyRate: Number(occupancyRate.toFixed(2)),
      confirmedBookings,
      activeHotels,
      cityCount,
      popularRooms: popularRoomsAgg,
    });
  } catch (error) {
    next(error);
  }
};
