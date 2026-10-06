import Bill from "../models/Bill.js";
import { DAY, TIMEZONE, dayKey } from "./dateUtils.js";

const round = (n) => Math.round(n * 100) / 100;

// Total cost of all items in one bill
const costExpr = {
  $sum: {
    $map: {
      input: "$items",
      as: "i",
      in: { $multiply: ["$$i.costPrice", "$$i.qty"] },
    },
  },
};

// from is inclusive, to is exclusive
const dateMatch = (userId, from, to) => ({
  $match: { userId, createdAt: { $gte: from, $lt: to } },
});

export const getSummary = async (userId, from, to) => {
  const [r] = await Bill.aggregate([
    dateMatch(userId, from, to),
    { $addFields: { cost: costExpr } },
    {
      $group: {
        _id: null,
        sales: { $sum: "$total" },
        bills: { $sum: 1 },
        revenue: { $sum: { $subtract: ["$subtotal", "$discount"] } },
        cost: { $sum: "$cost" },
      },
    },
  ]);

  if (!r) return { sales: 0, bills: 0, profit: 0 };
  return {
    sales: round(r.sales),
    bills: r.bills,
    profit: round(r.revenue - r.cost),
  };
};

export const getDailySales = async (userId, from, to) => {
  const rows = await Bill.aggregate([
    dateMatch(userId, from, to),
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE },
        },
        sales: { $sum: "$total" },
        bills: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r]));

  // Fill days that had no sales with zero, so the chart has no gaps
  const result = [];
  for (let t = from.getTime(); t < to.getTime(); t += DAY) {
    const key = dayKey(new Date(t));
    const row = byDay.get(key);
    result.push({ date: key, sales: row ? round(row.sales) : 0, bills: row ? row.bills : 0 });
  }
  return result;
};

export const getTopProducts = async (userId, from, to, limit = 5) => {
  const rows = await Bill.aggregate([
    dateMatch(userId, from, to),
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        qty: { $sum: "$items.qty" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ productId: r._id, name: r.name, qty: r.qty, revenue: round(r.revenue) }));
};

export const getPaymentSplit = async (userId, from, to) => {
  const rows = await Bill.aggregate([
    dateMatch(userId, from, to),
    { $group: { _id: "$paymentMode", total: { $sum: "$total" }, bills: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ mode: r._id, total: round(r.total), bills: r.bills }));
};