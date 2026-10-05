import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },     // selling price at time of sale
    costPrice: { type: Number, required: true, min: 0 }, // cost price at time of sale
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    billNumber: { type: Number, required: true },
    items: { type: [billItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMode: { type: String, enum: ["cash", "upi", "card"], default: "cash" },
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, billNumber: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);