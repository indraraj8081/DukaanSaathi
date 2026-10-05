import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import Product from "../models/Product.js";
import Counter from "../models/Counter.js";

const round = (n) => Math.round(n * 100) / 100;

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Merge duplicate products and validate quantities
const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw fail(400, "Cart is empty");
  }
  const map = new Map();
  for (const item of items) {
    const qty = Number(item.qty);
    if (!mongoose.isValidObjectId(item.productId)) {
      throw fail(400, "Invalid product in cart");
    }
    if (!Number.isInteger(qty) || qty < 1) {
      throw fail(400, "Quantity must be a whole number of at least 1");
    }
    const id = String(item.productId);
    map.set(id, (map.get(id) || 0) + qty);
  }
  return [...map.entries()].map(([productId, qty]) => ({ productId, qty }));
};

// POST /api/bills
export const createBill = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const items = normalizeItems(req.body.items);
    const discount = Number(req.body.discount) || 0;
    const gstRate = Number(req.body.gstRate) || 0;
    const paymentMode = req.body.paymentMode || "cash";

    if (!["cash", "upi", "card"].includes(paymentMode)) {
      throw fail(400, "Invalid payment mode");
    }
    if (gstRate < 0 || gstRate > 28) throw fail(400, "GST rate must be between 0 and 28");
    if (discount < 0) throw fail(400, "Discount cannot be negative");

    let bill;

    await session.withTransaction(async () => {
      const billItems = [];

      for (const { productId, qty } of items) {
        // Reduce stock only if enough is available (atomic check + update)
        const product = await Product.findOneAndUpdate(
          { _id: productId, userId: req.user._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { session, new: true }
        );

        if (!product) {
          const existing = await Product.findOne(
            { _id: productId, userId: req.user._id },
            null,
            { session }
          );
          if (!existing) throw fail(404, "A product in the cart was not found");
          throw fail(400, `Not enough stock for "${existing.name}" (available: ${existing.stock})`);
        }

        billItems.push({
          productId: product._id,
          name: product.name,
          qty,
          price: product.price,
          costPrice: product.costPrice,
        });
      }

      // All amounts are calculated on the server from database prices
      const subtotal = round(billItems.reduce((sum, i) => sum + i.price * i.qty, 0));
      if (discount > subtotal) throw fail(400, "Discount cannot be more than the subtotal");

      const gst = round(((subtotal - discount) * gstRate) / 100);
      const total = round(subtotal - discount + gst);

      // Next bill number for this shop
      const counter = await Counter.findOneAndUpdate(
        { _id: `bill_${req.user._id}` },
        { $inc: { seq: 1 } },
        { session, new: true, upsert: true }
      );

      const [created] = await Bill.create(
        [
          {
            userId: req.user._id,
            billNumber: counter.seq,
            items: billItems,
            subtotal,
            discount,
            gstRate,
            gst,
            total,
            paymentMode,
          },
        ],
        { session }
      );
      bill = created;
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/bills?page=&limit=
export const getBills = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = { userId: req.user._id };

    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ bills, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bills/:id
export const getBill = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bill not found" });
    }
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};