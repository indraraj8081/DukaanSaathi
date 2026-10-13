export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const shortDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const orderLabel = (o) => (o.publicNumber ? `DS${o.publicNumber}` : `#${o.orderNumber}`);