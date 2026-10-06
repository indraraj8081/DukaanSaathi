import mongoose from "mongoose";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";

const round = (n) => Math.round(n * 100) / 100;

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ---------- Suppliers ----------

// GET /api/suppliers
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.user._id }).sort({ name: 1 }).limit(200);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/suppliers
export const createSupplier = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Supplier name is required" });
    const supplier = await Supplier.create({
      userId: req.user._id,
      name,
      phone: req.body.phone?.trim() || undefined,
    });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/suppliers/:id
export const deleteSupplier = async (req, res) => {
  try {
    const s = await Supplier.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!s) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Purchases ----------

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) throw fail(400, "Add at least one product");

  const seen = new Set();
  return items.map((item) => {
    const qty = Number(item.qty);
    const costPrice = Number(item.costPrice);

    if (!mongoose.isValidObjectId(item.productId)) throw fail(400, "Invalid product");
    if (!Number.isInteger(qty) || qty < 1) throw fail(400, "Quantity must be a whole number of at least 1");
    if (!Number.isFinite(costPrice) || costPrice < 0) throw fail(400, "Cost price must be 0 or more");

    const id = String(item.productId);
    if (seen.has(id)) throw fail(400, "The same product is added twice");
    seen.add(id);

    return { productId: id, qty, costPrice };
  });
};

// POST /api/purchases
export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const items = normalizeItems(req.body.items);
    const supplierId = req.body.supplierId || null;
    if (supplierId && !mongoose.isValidObjectId(supplierId)) throw fail(400, "Invalid supplier");

    let purchase;

    await session.withTransaction(async () => {
      let supplierName;
      if (supplierId) {
        const supplier = await Supplier.findOne(
          { _id: supplierId, userId: req.user._id },
          null,
          { session }
        );
        if (!supplier) throw fail(404, "Supplier not found");
        supplierName = supplier.name;
      }

      const purchaseItems = [];
      for (const { productId, qty, costPrice } of items) {
        // Add stock and save the latest cost price
        const product = await Product.findOneAndUpdate(
          { _id: productId, userId: req.user._id },
          { $inc: { stock: qty }, $set: { costPrice } },
          { session, new: true }
        );
        if (!product) throw fail(404, "A product in the list was not found");

        purchaseItems.push({ productId: product._id, name: product.name, qty, costPrice });
      }

      const total = round(purchaseItems.reduce((s, i) => s + i.costPrice * i.qty, 0));

      const [created] = await Purchase.create(
        [
          {
            userId: req.user._id,
            supplierId: supplierId || undefined,
            supplierName,
            invoiceNo: req.body.invoiceNo?.trim() || undefined,
            items: purchaseItems,
            total,
            note: req.body.note?.trim() || undefined,
          },
        ],
        { session }
      );
      purchase = created;
    });

    res.status(201).json(purchase);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/purchases?page=&limit=
export const getPurchases = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = { userId: req.user._id };

    const total = await Purchase.countDocuments(filter);
    const purchases = await Purchase.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ purchases, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};