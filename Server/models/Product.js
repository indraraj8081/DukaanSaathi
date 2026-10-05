import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },       // selling price
    costPrice: { type: Number, required: true, min: 0 },   // buying price
    stock: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, min: 0, default: 5 },        // low-stock alert level
    expiryDate: { type: Date },
    barcode: { type: String, trim: true },
  },
  { timestamps: true }
);

// Barcode must be unique per shop, but only when a barcode is actually set
productSchema.index(
  { userId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string" } } }
);

export default mongoose.model("Product", productSchema);