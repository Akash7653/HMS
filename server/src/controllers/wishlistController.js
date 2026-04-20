const User = require("../models/User");

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      match: { isActive: true },
    });

    res.json({ data: user.favorites || [] });
  } catch (error) {
    next(error);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { hotelId } = req.body;

    const user = await User.findById(req.user._id);
    const exists = user.favorites.some((id) => String(id) === String(hotelId));

    if (exists) {
      user.favorites = user.favorites.filter((id) => String(id) !== String(hotelId));
    } else {
      user.favorites.push(hotelId);
    }

    await user.save();

    res.json({
      message: exists ? "Removed from wishlist" : "Added to wishlist",
      favorites: user.favorites,
    });
  } catch (error) {
    next(error);
  }
};
