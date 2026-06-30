const { z } = require("zod");

// Generic validation middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }))
    });
  }
};

// Expiry Date Preprocessor
const dateSchema = z.preprocess((val) => {
  if (!val) return undefined;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  capacity: z.number({ required_error: "Capacity is required" }).positive("Capacity must be a positive number"),
  quantity: z.number({ required_error: "Quantity is required" }).nonnegative("Quantity cannot be negative"),
  buyingPrice: z.number({ required_error: "Buying price is required" }).positive("Buying price must be positive"),
  sellingPrice: z.number({ required_error: "Selling price is required" }).positive("Selling price must be positive"),
  expiryDate: dateSchema
});

const saleSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
  qty: z.number({ required_error: "Quantity is required" }).int("Quantity must be an integer").positive("Quantity must be positive")
});

const wastageSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
  quantity: z.number({ required_error: "Quantity is required" }).positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required")
});

module.exports = {
  validate,
  productSchema,
  saleSchema,
  wastageSchema
};
