const router = require("express").Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

/* ============================
   EMAIL TRANSPORT (GMAIL)
============================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
    user.resetOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

   await transporter.sendMail({
  from: `"Taj Enterprises" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "🔐 Password Reset OTP - Taj Enterprises",
  html: `
    <div style="
      max-width:600px;
      margin:auto;
      font-family:Arial,sans-serif;
      background:#ffffff;
      border-radius:8px;
      overflow:hidden;
      border:1px solid #eaeaea;
    ">
      <div style="
        background:#6d4c41;
        padding:20px;
        color:white;
        text-align:center;
      ">
        <h1>Taj Enterprises</h1>
        <p>Secure Password Reset</p>
      </div>

      <div style="padding:30px;">
        <p>Hello,</p>
        <p>You requested to reset your password.</p>

        <p style="font-size:16px;">Your One-Time Password (OTP):</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          text-align:center;
          margin:20px 0;
          color:#6d4c41;
          letter-spacing:4px;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>

        <hr style="margin:30px 0;" />

        <p style="font-size:12px;color:#777;">
          © ${new Date().getFullYear()} Taj Enterprises  
          <br/>This is an automated email. Do not reply.
        </p>
      </div>
    </div>
  `
});


    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("OTP SEND ERROR:", err);
    res.status(500).json({ message: "OTP send failed" });
  }
});

/* ============================
   VERIFY OTP & RESET PASSWORD
   POST /api/otp/verify
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

    // Reset password
    user.password = newPassword; // hashed by pre-save hook
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
