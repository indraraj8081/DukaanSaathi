import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    mode: { type: String, enum: ["cash", "upi", "card"], default: "cash" },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);