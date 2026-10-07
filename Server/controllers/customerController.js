import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round = (n) => Math.round(n * 100) / 100;

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// POST /api/customers
export const createCustomer = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const phone = req.body.phone?.trim() || undefined;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const customer = await Customer.create({ name, phone, userId: req.user._id });
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This phone number is already used" });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/customers?search=&due=true&page=&limit=
export const getCustomers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = { userId: req.user._id };

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [{ name: regex }, { phone: regex }];
    }
    if (req.query.due === "true") filter.balance = { $gt: 0 };

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ balance: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [totals] = await Customer.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, due: { $sum: "$balance" } } },
    ]);

    res.json({
      customers,
      page,
      pages: Math.ceil(total / limit),
      total,
      totalDue: round(totals?.due || 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/customers/:id
export const updateCustomer = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name is required" });

    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.name = name;
    customer.phone = req.body.phone?.trim() || undefined;
    await customer.save();
    res.json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This phone number is already used" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/customers/:id (only if nothing is owed)
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    if (customer.balance > 0) {
      return res.status(400).json({ message: "Cannot delete a customer who still owes money" });
    }
    await customer.deleteOne();
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/customers/:id/payments  { amount, mode, note }
export const receivePayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const amount = round(Number(req.body.amount));
    const mode = req.body.mode || "cash";
    if (!Number.isFinite(amount) || amount <= 0) throw fail(400, "Enter a valid amount");
    if (!["cash", "upi", "card"].includes(mode)) throw fail(400, "Invalid payment mode");

    let result;
    await session.withTransaction(async () => {
      // Reduce balance only if the customer owes at least this much
      const customer = await Customer.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session, new: true }
      );

      if (!customer) {
        const existing = await Customer.findOne(
          { _id: req.params.id, userId: req.user._id },
          null,
          { session }
        );
        if (!existing) throw fail(404, "Customer not found");
        throw fail(400, `Amount is more than the balance due (₹${existing.balance})`);
      }

      customer.balance = round(customer.balance);

      const [payment] = await Payment.create(
        [{
          userId: req.user._id,
          customerId: customer._id,
          amount,
          mode,
          note: req.body.note?.trim() || undefined,
        }],
        { session }
      );
      result = { customer, payment };
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/customers/:id/ledger  (credit bills + payments, newest first)
export const getLedger = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const { default: Bill } = await import("../models/Bill.js");
    const [bills, payments] = await Promise.all([
      Bill.find({ userId: req.user._id, customerId: customer._id, paymentMode: "credit" })
        .sort({ createdAt: -1 }).limit(50).select("billNumber total createdAt"),
      Payment.find({ userId: req.user._id, customerId: customer._id })
        .sort({ createdAt: -1 }).limit(50),
    ]);

    const entries = [
      ...bills.map((b) => ({
        type: "credit",
        label: `Bill #${b.billNumber}`,
        amount: b.total,
        date: b.createdAt,
      })),
      ...payments.map((p) => ({
        type: "payment",
        label: `Payment received (${p.mode})${p.note ? ` - ${p.note}` : ""}`,
        amount: p.amount,
        date: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ customer, entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};