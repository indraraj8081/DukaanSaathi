export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// "2026-10-06" -> "6 Oct"
export const shortDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });