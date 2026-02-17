const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Temporary in-memory OTP store
const otpStore = {};

/* =========================
   SEND OTP
========================= */
router.post("/send", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile is required" });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: "Mobile not registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[mobile] = {
      otp,
      expires: Date.now() + 2 * 60 * 1000 // 2 minutes
    };

    console.log("OTP for", mobile, "is:", otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("OTP SEND ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   VERIFY OTP + RESET PASSWORD
========================= */
router.post("/verify", async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const record = otpStore[mobile];

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expires < Date.now()) {
      delete otpStore[mobile];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { mobile },
      { $set: { password: hashedPassword } }
    );

    delete otpStore[mobile];

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
