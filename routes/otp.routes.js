const router = require("express").Router();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

/* =========================
   SEND OTP
========================= */
router.post("/send", async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ mobile });
    if (!user)
      return res.status(400).json({ message: "Mobile not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry =
      Date.now() + Number(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000;

    await user.save();

    /* SEND SMS */
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        numbers: mobile,
        variables_values: otp
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP send failed" });
  }
});

/* =========================
   VERIFY OTP + RESET PASSWORD
========================= */
router.post("/verify", async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    const user = await User.findOne({ mobile });
    if (!user || !user.resetOtp)
      return res.status(400).json({ message: "Invalid request" });

    if (user.resetOtpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const isValid = await bcrypt.compare(otp, user.resetOtp);
    if (!isValid)
      return res.status(400).json({ message: "Invalid OTP" });

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password reset failed" });
  }
});

module.exports = router;
