const router = require("express").Router();
const bcrypt = require("bcryptjs");
const axios = require("axios");
const User = require("../models/User");

/* ============================
   BREVO HTTP API SETUP
============================ */

/* ============================
   SEND OTP
   POST /api/otp/send
============================ */
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Taj Enterprises",
          email: process.env.MAIL_FROM
        },
        to: [{ email }],
        subject: "🔐 Password Reset OTP - Taj Enterprises",
        htmlContent: `
          <h2>Your OTP</h2>
          <p style="font-size:24px;font-weight:bold;">${otp}</p>
          <p>Valid for 5 minutes</p>
        `
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_PASS
        }
      }
    );

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("OTP SEND ERROR:", err.message);
    res.status(500).json({
      message: "OTP send failed",
      error: err.message
    });
  }
});

/* ============================
   VERIFY OTP
============================ */
router.post("/verify", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp.trim(), user.resetOtp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;