import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { DAY , startOfDay, dayKey , TIMEZONE } from "../utils/dateUtils.js";

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SHOP_STATUSES = ["pending", "approved", "rejected", "blocked"];
const CUSTOMER_STATUSES = ["approved", "blocked"];
const ORDER_STATUSES = [
  "placed", "accepted", "preparing", "out_for_delivery", "delivered", "rejected", "cancelled",
];

const paging = (req) => ({
  page: Math.max(Number(req.query.page) || 1, 1),
  limit: 15,
});

// Turns [{_id, n}] into a Map so rows can look up their count quickly
const toMap = (rows) => new Map(rows.map((r) => [String(r._id), r.n]));

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const [
      totalCustomers, totalShops, activeShops, pendingShops,
      totalProducts, totalOrders, pendingOrders, revenue,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "shopkeeper" }),
      User.countDocuments({ role: "shopkeeper", approvalStatus: "approved" }),
      User.countDocuments({ role: "shopkeeper", approvalStatus: "pending" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "placed" }),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$total", "$subtotal"] } } } },
      ]),
    ]);

    res.json({
      totalCustomers, totalShops, activeShops, pendingShops,
      totalProducts, totalOrders, pendingOrders,
      orderValue: Math.round((revenue[0]?.total || 0) * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/shops?status=&search=&page=
export const listShops = async (req, res) => {
  try {
    const { page, limit } = paging(req);
    const filter = { role: "shopkeeper" };

    if (SHOP_STATUSES.includes(req.query.status)) filter.approvalStatus = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), "i");
      filter.$or = [{ shopName: rx }, { name: rx }, { email: rx }, { city: rx }, { pincode: rx }];
    }

    const [total, shops, countRows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password -avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.aggregate([
        { $match: { role: "shopkeeper" } },
        { $group: { _id: "$approvalStatus", n: { $sum: 1 } } },
      ]),
    ]);

    // Product and order counts for only the shops on this page
    const ids = shops.map((s) => s._id);
    const [products, orders] = await Promise.all([
      Product.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]),
    ]);
    const pMap = toMap(products);
    const oMap = toMap(orders);

    res.json({
      shops: shops.map((s) => ({
        ...s,
        productCount: pMap.get(String(s._id)) || 0,
        orderCount: oMap.get(String(s._id)) || 0,
      })),
      counts: Object.fromEntries(countRows.map((r) => [r._id, r.n])),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/customers?search=&page=
export const listCustomers = async (req, res) => {
  try {
    const { page, limit } = paging(req);
    const filter = { role: "customer" };

    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), "i");
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [total, customers] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("name email phone approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const orders = await Order.aggregate([
      { $match: { customerId: { $in: customers.map((c) => c._id) } } },
      { $group: { _id: "$customerId", n: { $sum: 1 } } },
    ]);
    const oMap = toMap(orders);

    res.json({
      customers: customers.map((c) => ({ ...c, orderCount: oMap.get(String(c._id)) || 0 })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id/status  { status }
export const setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admins are excluded here on purpose, so an admin can never block another admin
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ["shopkeeper", "customer"] },
    }).select("role");
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed = user.role === "shopkeeper" ? SHOP_STATUSES : CUSTOMER_STATUSES;
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: { approvalStatus: status } },
      { new: true }
    ).select("name shopName role approvalStatus");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/orders?status=&search=&page=
export const listOrders = async (req, res) => {
  try {
    const { page, limit } = paging(req);
    const filter = {};

    if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const q = String(req.query.search || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      const or = [{ customerName: rx }, { phone: rx }];
      const num = Number(q.replace(/^ds/i, "")); // "DS10001" or "10001"
      if (Number.isInteger(num)) or.push({ publicNumber: num });
      filter.$or = or;
    }

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "shopName"),
    ]);

    // Chosen field by field so costPrice is never sent
    res.json({
      orders: orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        publicNumber: o.publicNumber,
        status: o.status,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        pincode: o.pincode,
        items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total: o.total ?? o.subtotal,
        createdAt: o.createdAt,
        shopName: o.userId?.shopName,
      })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/overview?days=7|30
export const getOverview = async (req, res) => {
  try {
    const days = req.query.days === "30" ? 30 : 7;
    const tomorrow = new Date(startOfDay().getTime() + DAY);
    const chartFrom = new Date(tomorrow.getTime() - days * DAY);
    const weekAgo = new Date(Date.now() - 7 * DAY);
    const twoWeeksAgo = new Date(Date.now() - 14 * DAY);

    // Count documents created in a time window (to is optional)
    const since = (Model, extra, from, to) =>
      Model.countDocuments({
        ...extra,
        createdAt: to ? { $gte: from, $lt: to } : { $gte: from },
      });

    const [
      totalCustomers, totalShops, activeShops, pendingShops,
      totalProducts, totalOrders, pendingOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "shopkeeper" }),
      User.countDocuments({ role: "shopkeeper", approvalStatus: "approved" }),
      User.countDocuments({ role: "shopkeeper", approvalStatus: "pending" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "placed" }),
    ]);

    // This week compared with the week before
    const [cNow, cPrev, sNow, sPrev, pNow, pPrev, oNow, oPrev] = await Promise.all([
      since(User, { role: "customer" }, weekAgo),
      since(User, { role: "customer" }, twoWeeksAgo, weekAgo),
      since(User, { role: "shopkeeper" }, weekAgo),
      since(User, { role: "shopkeeper" }, twoWeeksAgo, weekAgo),
      since(Product, {}, weekAgo),
      since(Product, {}, twoWeeksAgo, weekAgo),
      since(Order, {}, weekAgo),
      since(Order, {}, twoWeeksAgo, weekAgo),
    ]);

    const [statusRows, dailyRows, recentOrders, recentShops] = await Promise.all([
      Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: chartFrom, $lt: tomorrow } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
            n: { $sum: 1 },
          },
        },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "shopName"),
      User.find({ role: "shopkeeper" })
        .select("shopName name approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Days with no orders become 0, so the chart has no gaps
    const byDay = new Map(dailyRows.map((r) => [r._id, r.n]));
    const daily = [];
    for (let t = chartFrom.getTime(); t < tomorrow.getTime(); t += DAY) {
      const key = dayKey(new Date(t));
      daily.push({ date: key, orders: byDay.get(key) || 0 });
    }

    const productRows = await Product.aggregate([
      { $match: { userId: { $in: recentShops.map((s) => s._id) } } },
      { $group: { _id: "$userId", n: { $sum: 1 } } },
    ]);
    const pMap = toMap(productRows);

    res.json({
      totals: { totalCustomers, totalShops, activeShops, pendingShops, totalProducts, totalOrders, pendingOrders },
      growth: {
        customers: { current: cNow, previous: cPrev },
        shops: { current: sNow, previous: sPrev },
        products: { current: pNow, previous: pPrev },
        orders: { current: oNow, previous: oPrev },
      },
      statusCounts: Object.fromEntries(statusRows.map((r) => [r._id, r.n])),
      daily,
      recentOrders: recentOrders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        publicNumber: o.publicNumber,
        customerName: o.customerName,
        shopName: o.userId?.shopName,
        total: o.total ?? o.subtotal,
        status: o.status,
        createdAt: o.createdAt,
      })),
      recentShops: recentShops.map((s, i) => ({
        _id: s._id,
        no: totalShops - i, // shop number by joining order
        shopName: s.shopName,
        owner: s.name,
        status: s.approvalStatus,
        productCount: pMap.get(String(s._id)) || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/products?search=&page=
export const listProducts = async (req, res) => {
  try {
    const { page, limit } = paging(req);
    const filter = {};
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), "i");
      filter.$or = [{ name: rx }, { category: rx }];
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select("name category price stock userId") // costPrice is not selected
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "shopName"),
    ]);

    res.json({
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        shopName: p.userId?.shopName,
      })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

