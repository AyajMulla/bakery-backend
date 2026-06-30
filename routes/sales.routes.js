const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Sale = require("../models/Sale");
const auth = require("../middleware/auth.route");
const checkRole = require("../middleware/role");
const { validate, saleSchema } = require("../middleware/validation");

/* =========================
   SELL PRODUCT
========================= */
router.post("/sell", auth, validate(saleSchema), async (req, res) => {
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
router.get("/", auth, async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch {
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* =========================
   GET SALES SUMMARY REPORT (AGGREGATION)
   GET /api/sales/reports/summary
========================= */
router.get("/reports/summary", auth, checkRole(["owner"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) {
        matchQuery.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    }

    const report = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
          totalItemsSold: { $sum: "$quantity" },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    // Top 5 selling items aggregation
    const topItems = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$productName" },
          quantitySold: { $sum: "$quantity" },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    const result = report[0] || {
      totalRevenue: 0,
      totalProfit: 0,
      totalItemsSold: 0,
      salesCount: 0
    };

    res.json({
      summary: result,
      topItems
    });

  } catch (error) {
    console.error("REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

module.exports = router;
