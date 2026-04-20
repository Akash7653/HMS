const express = require("express");
const { getWishlist, toggleWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlist);

module.exports = router;
