const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Wastage = require("../models/Wastage");
const auth = require("../middleware/auth.route");
const checkRole = require("../middleware/role");

/* =========================
   LOG WASTAGE
   POST /api/wastage
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;

    if (!productId || !quantity || quantity <= 0 || !reason) {
      return res.status(400).json({ message: "Invalid data. All fields are required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({ message: "Wastage quantity exceeds current inventory stock" });
    }

    // Calculations
    const cost = quantity * product.buyingPrice;

    // Update product stock
    product.quantity -= quantity;
    await product.save();

    // Create wastage entry
    const wastage = new Wastage({
      productId: product._id,
      productName: product.name,
      quantity,
      cost,
      reason
    });

    await wastage.save();

    res.status(201).json({
      product,
      wastage
    });

  } catch (error) {
    console.error("LOG WASTAGE ERROR:", error);
    res.status(500).json({ message: "Failed to record wastage" });
  }
});

/* =========================
   GET ALL WASTAGE RECORDS
   GET /api/wastage
========================= */
router.get("/", auth, async (req, res) => {
  try {
    const wastageList = await Wastage.find().sort({ date: -1 });
    res.json(wastageList);
  } catch (error) {
    console.error("GET WASTAGE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch wastage records" });
  }
});

module.exports = router;
