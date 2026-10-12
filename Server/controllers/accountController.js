import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { emitToShop } from "../socket.js";

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

// GET /api/account/addresses
export const getAddresses = async (req, res) => {
  res.json(req.user.addresses || []);
};

// POST /api/account/addresses
export const addAddress = async (req, res) => {
  try {
    const label = clean(req.body.label, 20) || "Home";
    const line = clean(req.body.line, 300);
    const pincode = clean(req.body.pincode, 6);

    if (line.length < 10) return res.status(400).json({ message: "Please enter the full address" });
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ message: "Pincode must be 6 digits" });
    if ((req.user.addresses?.length || 0) >= 5) {
      return res.status(400).json({ message: "You can save up to 5 addresses" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { addresses: { label, line, pincode } } },
      { new: true }
    ).select("addresses");

    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/account/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Address not found" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: req.params.id } } },
      { new: true }
    ).select("addresses");

    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/account/orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "shopName phone");

    // Send only what a customer should see (never costPrice)
    res.json(
      orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        trackingCode: o.trackingCode,
        status: o.status,
        items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal: o.subtotal,
        deliveryCharge: o.deliveryCharge || 0,
        total: o.total ?? o.subtotal,
        createdAt: o.createdAt,
        shop: { shopName: o.userId?.shopName, phone: o.userId?.phone },
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/account/orders/:id/cancel  (only while the shop has not accepted it)
export const cancelMyOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    // The status check and the change happen in one step, so a shop accepting
    // at the same moment cannot be overwritten
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user._id, status: "placed" },
      { $set: { status: "cancelled" }, $push: { history: { status: "cancelled" } } },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({
        message: "This order can no longer be cancelled here. Please call the shop.",
      });
    }

    emitToShop(order.userId, "order:update", { _id: order._id, status: order.status });
    res.json({ message: "Order cancelled", status: order.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};