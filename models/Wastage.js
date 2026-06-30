const mongoose = require("mongoose");

const wastageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    cost: {
      type: Number,
      required: true // quantity * product.buyingPrice
    },
    reason: {
      type: String,
      required: true // e.g. "Expired", "Damaged", "Spoiled"
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wastage", wastageSchema);
