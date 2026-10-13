import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 }, // never sent to customers
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // the shop
    orderNumber: { type: Number, required: true },
    trackingCode: { type: String, required: true, unique: true },
    publicNumber: { type: Number}, // for customers, starts from 1 for each shop
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // empty for guest orders
    deliveryCharge: { type: Number, default: 0 },
    total: { type: Number }, // subtotal + deliveryCharge
    note: { type: String },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    paymentMode: { type: String, default: "cod" },
    status: {
      type: String,
      enum: ["placed", "accepted", "preparing", "out_for_delivery", "delivered", "rejected", "cancelled"],
      default: "placed",
    },
    history: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);