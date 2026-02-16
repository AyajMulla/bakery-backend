const express = require("express");
const router = express.Router();   // ✅ THIS WAS MISSING
const Product = require("../models/Product");

/* =========================
   GET ALL PRODUCTS
========================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* =========================
   ADD PRODUCT (SAFE)
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      capacity,
      quantity,
      buyingPrice,
      sellingPrice
    } = req.body;

    // 🔒 VALIDATION
    if (
      !name ||
      !category ||
      isNaN(capacity) ||
      isNaN(quantity) ||
      isNaN(buyingPrice) ||
      isNaN(sellingPrice)
    ) {
      return res.status(400).json({
        message: "Invalid input data"
      });
    }

    const product = new Product({
      name,
      category,
      capacity: Number(capacity),
      quantity: Number(quantity),
      buyingPrice: Number(buyingPrice),
      sellingPrice: Number(sellingPrice),
      soldQty: 0
    });

    await product.save();
    res.status(201).json(product);

  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
});

/* =========================
   UPDATE PRODUCT
========================= */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;   // ✅ REQUIRED
