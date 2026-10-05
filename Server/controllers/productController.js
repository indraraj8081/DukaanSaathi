import Product from "../models/Product.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Pick only allowed fields and clean them
const cleanBody = (body) => {
  const data = {
    name: body.name,
    category: body.category,
    price: Number(body.price),
    costPrice: Number(body.costPrice),
    stock: Number(body.stock),
    minStock: body.minStock === "" || body.minStock == null ? 5 : Number(body.minStock),
    expiryDate: body.expiryDate || undefined,
    barcode: body.barcode?.trim() || undefined, // "" becomes undefined
  };
  return data;
};

const validate = (data) => {
  if (!data.name?.trim() || !data.category?.trim()) {
    return "Name and category are required";
  }
  const numbers = [data.price, data.costPrice, data.stock, data.minStock];
  if (numbers.some((n) => Number.isNaN(n) || n < 0)) {
    return "Price, cost price and stock must be valid non-negative numbers";
  }
  return null;
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const data = cleanBody(req.body);
    const error = validate(data);
    if (error) return res.status(400).json({ message: error });

    const product = await Product.create({ ...data, userId: req.user._id });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This barcode is already used" });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products?search=&category=&stock=&page=&limit=
export const getProducts = async (req, res) => {
  try {
    const { search, category, stock } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const filter = { userId: req.user._id };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { barcode: regex }];
    }
    if (category) filter.category = category;
    if (stock === "low") filter.$expr = { $lte: ["$stock", "$minStock"] };
    if (stock === "out") filter.stock = 0;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { userId: req.user._id });
    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const data = cleanBody(req.body);
    const error = validate(data);
    if (error) return res.status(400).json({ message: error });

    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, data);
    // Object.assign skips undefined, so clear optional fields explicitly
    if (!data.barcode) product.barcode = undefined;
    if (!data.expiryDate) product.expiryDate = undefined;

    await product.save();
    res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This barcode is already used" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};