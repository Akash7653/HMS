const express = require("express");
const { uploadImage } = require("../controllers/uploadController");
const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/image", protect, authorize("admin"), upload.single("image"), uploadImage);

module.exports = router;
