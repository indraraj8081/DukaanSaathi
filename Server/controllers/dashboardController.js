import Product from "../models/Product.js";
import { DAY, startOfDay, startOfMonth } from "../utils/dateUtils.js";
import { getSummary, getDailySales, getTopProducts } from "../utils/reportQueries.js";

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrow = new Date(todayStart.getTime() + DAY);
    const monthStart = startOfMonth(now);
    const weekStart = new Date(todayStart.getTime() - 6 * DAY);
    const expiryLimit = new Date(now.getTime() + 30 * DAY);

    const lowStockFilter = { userId, $expr: { $lte: ["$stock", "$minStock"] } };
    const expiringFilter = { userId, expiryDate: { $lte: expiryLimit } };

    const [
      today,
      month,
      last7Days,
      topProducts,
      totalProducts,
      lowStockCount,
      lowStock,
      expiringCount,
      expiring,
    ] = await Promise.all([
      getSummary(userId, todayStart, tomorrow),
      getSummary(userId, monthStart, tomorrow),
      getDailySales(userId, weekStart, tomorrow),
      getTopProducts(userId, monthStart, tomorrow, 5),
      Product.countDocuments({ userId }),
      Product.countDocuments(lowStockFilter),
      Product.find(lowStockFilter).sort({ stock: 1 }).limit(5).select("name stock minStock"),
      Product.countDocuments(expiringFilter),
      Product.find(expiringFilter).sort({ expiryDate: 1 }).limit(5).select("name expiryDate stock"),
    ]);

    res.json({
      today,
      month,
      last7Days,
      topProducts,
      totalProducts,
      lowStockCount,
      lowStock,
      expiringCount,
      expiring,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};