const IST_OFFSET = 5.5 * 60 * 60 * 1000; // India is UTC+5:30, no daylight saving
export const DAY = 24 * 60 * 60 * 1000;
export const TIMEZONE = "Asia/Kolkata";

// Midnight (IST) at the start of the given date
export const startOfDay = (date = new Date()) => {
  const shifted = new Date(date.getTime() + IST_OFFSET);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET);
};

// First day of the month (IST) at midnight
export const startOfMonth = (date = new Date()) => {
  const s = new Date(date.getTime() + IST_OFFSET);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1) - IST_OFFSET);
};

// "2026-10-06" style key for the IST day of a date
export const dayKey = (date) =>
  new Date(date.getTime() + IST_OFFSET).toISOString().slice(0, 10);

// Parse "YYYY-MM-DD" as IST midnight, returns null if invalid
export const parseDay = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str || "")) return null;
  const d = new Date(`${str}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
};