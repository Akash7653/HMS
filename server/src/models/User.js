const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    avatar: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],
    refreshTokenHash: { type: String, default: "", select: false },
    refreshTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

// Add indexes after schema definition to avoid duplicate warnings
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
