const router = require("express").Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

/* ============================
   SMTP CONFIG (BREVO)
============================ */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: `"Taj Enterprises" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "🔐 Password Reset OTP - Taj Enterprises",
      html: `
        <h2>Your OTP</h2>
        <p style="font-size:24px;font-weight:bold;">${otp}</p>
        <p>Valid for 5 minutes</p>
      `
    });

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

    const user = await User.findOne({ email });
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