const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Sale = require("../models/Sale");

/* =========================
   SELL PRODUCT
========================= */
router.post("/sell", async (req, res) => {
  try {
    const { productId, qty } = req.body;

    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (qty > product.quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // calculations
    const revenue = qty * product.sellingPrice;
    const profit =
      (product.sellingPrice - product.buyingPrice) * qty;

    // update product stock
    product.quantity -= qty;
    product.soldQty += qty;
    await product.save();

    // save sale
    const sale = new Sale({
      productId: product._id,
      productName: product.name,
      quantity: qty,
      total: revenue,
      profit
    });

    await sale.save();

    res.status(201).json({
      product,
      sale
    });

  } catch (error) {
    console.error("SELL ERROR:", error);
    res.status(500).json({ message: "Sell failed" });
  }
});

/* =========================
   GET ALL SALES (FOR REPORTS)
========================= */
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch {
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

module.exports = router;
