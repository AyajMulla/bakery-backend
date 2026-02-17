const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "owner" },

    // 🔐 OTP RESET FIELDS
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date }
  },
  { timestamps: true }
);

// ✅ PASSWORD HASH (FIXED)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);
