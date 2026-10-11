import mongoose from "mongoose";
import crypto from "crypto";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { emitToShop } from "../socket.js";

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round = (n) => Math.round(n * 100) / 100;

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const shopFields = "shopName businessType address city pincode phone acceptingOrders minOrder";

// GET /api/public/shops?search=
export const listShops = async (req, res) => {
  try {
    // Only shops that have at least one product in stock
    const ownerIds = await Product.distinct("userId", { stock: { $gt: 0 } });
    const filter = { _id: { $in: ownerIds }, role: "shopkeeper", approvalStatus: "approved" };

    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), "i");
      filter.$or = [{ shopName: rx }, { city: rx }, { pincode: rx }, { businessType: rx }];
    }

    const shops = await User.find(filter)
      .select("shopName businessType city address acceptingOrders minOrder")
      .sort({ acceptingOrders: -1, shopName: 1 })
      .limit(60);
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/shops/:shopId
export const getShop = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.shopId)) {
      return res.status(404).json({ message: "Shop not found" });
    }
    const shop = await User.findOne({
  _id: req.params.shopId,
  role: "shopkeeper",
  approvalStatus: "approved",
  }).select(shopFields);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/shops/:shopId/products?search=&category=&page=
export const getShopProducts = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(404).json({ message: "Shop not found" });
    }
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 30;

    const and = [
      { userId: new mongoose.Types.ObjectId(shopId) },
      { stock: { $gt: 0 } },
      // hide expired products (no expiry date, or expiry in the future)
      { $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }] },
    ];
    if (req.query.search) {
      and.push({ name: new RegExp(escapeRegex(String(req.query.search)), "i") });
    }
    if (req.query.category) and.push({ category: String(req.query.category) });

    const filter = { $and: and };
    const [total, products, categories] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select("name category price stock") // costPrice and others stay private
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.distinct("category", { userId: shopId, stock: { $gt: 0 } }),
    ]);

    res.json({ products, categories: categories.sort(), page, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/public/shops/:shopId/orders
export const createOrder = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!mongoose.isValidObjectId(shopId)) throw fail(404, "Shop not found");

    const shop = await User.findOne({
    _id: shopId,
    role: "shopkeeper",
    approvalStatus: "approved",
    }).select("shopName acceptingOrders minOrder");
    if (!shop) throw fail(404, "Shop not found");
    if (!shop.acceptingOrders) throw fail(400, "This shop is not accepting orders right now");

    const customerName = String(req.body.customerName || "").trim().slice(0, 80);
    const phone = String(req.body.phone || "").trim();
    const address = String(req.body.address || "").trim().slice(0, 300);
    const note = String(req.body.note || "").trim().slice(0, 200);

    if (!customerName) throw fail(400, "Please enter your name");
    if (!/^[6-9]\d{9}$/.test(phone)) throw fail(400, "Enter a valid 10-digit mobile number");
    if (address.length < 10) throw fail(400, "Please enter your full delivery address");

    const rawItems = req.body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) throw fail(400, "Your cart is empty");
    if (rawItems.length > 50) throw fail(400, "Too many items in one order");

    // Merge duplicates and validate quantities
    const qtyById = new Map();
    for (const it of rawItems) {
      const qty = Number(it.qty);
      if (!mongoose.isValidObjectId(it.productId)) throw fail(400, "Invalid item in cart");
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) throw fail(400, "Invalid quantity");
      const id = String(it.productId);
      qtyById.set(id, (qtyById.get(id) || 0) + qty);
    }

    // Prices always come from the database, never from the customer
    const products = await Product.find({ _id: { $in: [...qtyById.keys()] }, userId: shop._id });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    for (const [id, qty] of qtyById) {
      const p = byId.get(id);
      if (!p) throw fail(400, "An item in your cart is no longer available");
      if (p.expiryDate && p.expiryDate < new Date()) throw fail(400, `"${p.name}" is not available`);
      if (p.stock < qty) {
        throw fail(400, p.stock === 0 ? `"${p.name}" is out of stock` : `Only ${p.stock} of "${p.name}" left`);
      }
      items.push({ productId: p._id, name: p.name, qty, price: p.price, costPrice: p.costPrice });
    }

    const subtotal = round(items.reduce((s, i) => s + i.price * i.qty, 0));
    if (subtotal < shop.minOrder) throw fail(400, `Minimum order for this shop is ₹${shop.minOrder}`);

    const counter = await Counter.findOneAndUpdate(
      { _id: `order_${shop._id}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const order = await Order.create({
      userId: shop._id,
      orderNumber: counter.seq,
      trackingCode: crypto.randomBytes(8).toString("hex"),
      customerName,
      phone,
      address,
      note: note || undefined,
      items,
      subtotal,
      history: [{ status: "placed" }],
    });

    // Live alert to the shopkeeper
    emitToShop(shop._id, "order:new", {
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName,
      total: subtotal,
    });

    res.status(201).json({ trackingCode: order.trackingCode, orderNumber: order.orderNumber });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// GET /api/public/orders/:code
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ trackingCode: String(req.params.code) });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const shop = await User.findById(order.userId).select("shopName phone");

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      history: order.history,
      customerName: order.customerName,
      address: order.address,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal: order.subtotal,
      createdAt: order.createdAt,
      shop: { shopName: shop?.shopName, phone: shop?.phone },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};