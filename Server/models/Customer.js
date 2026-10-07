import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    balance: { type: Number, default: 0, min: 0 }, // amount the customer owes
  },
  { timestamps: true }
);

// Same phone cannot repeat within one shop (only when a phone is set)
customerSchema.index(
  { userId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);

export default mongoose.model("Customer", customerSchema);