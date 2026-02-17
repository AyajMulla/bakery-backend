const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  mobile: String,
  password: String,
  role: { type: String, default: "owner" },

  resetOtp: String,
  resetOtpExpiry: Date
});

// hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);
