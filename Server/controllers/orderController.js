import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Bill from "../models/Bill.js";
import Counter from "../models/Counter.js";
import { emitToShop } from "../socket.js";

const STATUSES = ["placed", "accepted", "out_for_delivery", "delivered", "rejected", "cancelled"];

// Which status can move to which
const FLOW = {
  placed: ["accepted", "rejected"],
  accepted: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
};

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/orders?status=placed,accepted&page=
export const getOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const filter = { userId: req.user._id };

    if (req.query.status) {
      const list = String(req.query.status).split(",").filter((s) => STATUSES.includes(s));
      if (list.length) filter.status = { $in: list };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/counts  -> { placed: 2, accepted: 1, ... }
export const getOrderCounts = async (req, res) => {
  try {
    const rows = await Order.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => (counts[r._id] = r.count));
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/orders/:id/status  { status }
export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const next = req.body.status;
    if (!STATUSES.includes(next)) throw fail(400, "Invalid status");
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, "Order not found");

    let result;

    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }, null, { session });
      if (!order) throw fail(404, "Order not found");
      if (!FLOW[order.status]?.includes(next)) {
        throw fail(400, `Cannot change an order from "${order.status}" to "${next}"`);
      }

      // Accept: take the stock out (fails if there is not enough)
      if (next === "accepted") {
        for (const i of order.items) {
          const p = await Product.findOneAndUpdate(
            { _id: i.productId, userId: req.user._id, stock: { $gte: i.qty } },
            { $inc: { stock: -i.qty } },
            { session }
          );
          if (!p) throw fail(400, `Not enough stock for "${i.name}". Update stock or reject the order.`);
        }
      }

      // Cancel after accepting: put the stock back
      if (next === "cancelled") {
        for (const i of order.items) {
          await Product.updateOne(
            { _id: i.productId, userId: req.user._id },
            { $inc: { stock: i.qty } },
            { session }
          );
        }
      }

      // Delivered: create a normal bill so sales and profit reports include it
      if (next === "delivered") {
        const counter = await Counter.findOneAndUpdate(
          { _id: `bill_${req.user._id}` },
          { $inc: { seq: 1 } },
          { session, new: true, upsert: true }
        );
        const [bill] = await Bill.create(
          [
            {
              userId: req.user._id,
              billNumber: counter.seq,
              items: order.items.map((i) => ({
                productId: i.productId,
                name: i.name,
                qty: i.qty,
                price: i.price,
                costPrice: i.costPrice,
              })),
              subtotal: order.subtotal,
              discount: 0,
              gstRate: 0,
              gst: 0,
              total: order.subtotal,
              paymentMode: "cash", // cash on delivery
              customerName: order.customerName,
            },
          ],
          { session }
        );
        order.billId = bill._id;
      }

      order.status = next;
      order.history.push({ status: next });
      await order.save({ session });
      result = order;
    });

    emitToShop(req.user._id, "order:update", { _id: result._id, status: result.status });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};