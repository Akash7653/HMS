const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(200).json({
        message: "Cloudinary is not configured, using local simulation URL",
        url: `https://placehold.co/1200x800?text=${encodeURIComponent(req.file.originalname)}`,
      });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "hms-hotels",
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    next(error);
  }
};
