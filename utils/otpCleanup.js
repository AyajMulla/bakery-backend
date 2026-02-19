const User = require("../models/User");

const startOtpCleanupJob = () => {
  setInterval(async () => {
    try {
      const result = await User.updateMany(
        {
          resetOtpExpiry: { $lt: Date.now() }
        },
        {
          $unset: {
            resetOtp: "",
            resetOtpExpiry: ""
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`🧹 OTP Cleanup: ${result.modifiedCount} expired OTP(s) removed`);
      }
    } catch (err) {
      console.error("OTP CLEANUP ERROR:", err.message);
    }
  }, 5 * 60 * 1000); // every 5 minutes
};

module.exports = startOtpCleanupJob;
