import { DAY, startOfDay, parseDay } from "../utils/dateUtils.js";
import {
  getSummary,
  getDailySales,
  getTopProducts,
  getPaymentSplit,
} from "../utils/reportQueries.js";

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStart = startOfDay();

    // Default range: last 30 days including today
    const fromDate = req.query.from ? parseDay(req.query.from) : new Date(todayStart.getTime() - 29 * DAY);
    const toDay = req.query.to ? parseDay(req.query.to) : todayStart;

    if (!fromDate || !toDay) {
      return res.status(400).json({ message: "Dates must be in YYYY-MM-DD format" });
    }
    if (fromDate > toDay) {
      return res.status(400).json({ message: "'From' date cannot be after 'To' date" });
    }

    const toExclusive = new Date(toDay.getTime() + DAY); // include the whole 'to' day
    const days = Math.round((toExclusive - fromDate) / DAY);
    if (days > 366) {
      return res.status(400).json({ message: "Please select a range of up to 366 days" });
    }

    const [summary, daily, topProducts, payments] = await Promise.all([
      getSummary(userId, fromDate, toExclusive),
      getDailySales(userId, fromDate, toExclusive),
      getTopProducts(userId, fromDate, toExclusive, 10),
      getPaymentSplit(userId, fromDate, toExclusive),
    ]);

    res.json({ days, summary, daily, topProducts, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};