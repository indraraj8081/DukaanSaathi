const STYLES = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  blocked: "bg-gray-800 text-white",
  placed: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const LABELS = { placed: "Pending", accepted: "Confirmed" };

const StatusBadge = ({ status, label }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap capitalize ${STYLES[status] || "bg-gray-100 text-gray-700"}`}>
    {label || LABELS[status] || String(status).replace(/_/g, " ")}
  </span>
);

export default StatusBadge;