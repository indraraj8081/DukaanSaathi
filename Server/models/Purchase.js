import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    invoiceNo: { type: String, trim: true },
    items: { type: [purchaseItemSchema], required: true },
    total: { type: Number, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);