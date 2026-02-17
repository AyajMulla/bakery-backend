// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: "*",          // allow frontend + mobile
  credentials: true
}));
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/sales", require("./routes/sales.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/otp", require("./routes/otp.routes"));



/* =========================
   HEALTH CHECK (OPTIONAL)
========================= */
app.get("/", (req, res) => {
  res.send("Bakery Backend API is running 🚀");
});

/* =========================
   DATABASE
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* =========================
   GLOBAL ERROR HANDLER
========================= */
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED ERROR:", err);
});

/* =========================
   START SERVER (LAN + LOCAL)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
