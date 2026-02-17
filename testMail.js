require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: "Test OTP Mail",
  text: "This is a test email"
}).then(() => {
  console.log("✅ Email sent successfully");
}).catch(err => {
  console.error("❌ Email failed:", err);
});
