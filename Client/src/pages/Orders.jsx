import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import EmptyState from "../components/EmptyState";
import StoreLink from "../components/StoreLink";
import { money } from "../utils/format";

const TABS = [
  { key: "new", label: "New", statuses: "placed" },
  { key: "active", label: "Active", statuses: "accepted,out_for_delivery" },
  { key: "done", label: "Delivered", statuses: "delivered" },
  { key: "closed", label: "Closed", statuses: "rejected,cancelled" },
];

const STATUS_STYLE = {
  placed: ["New", "bg-orange-100 text-orange-700"],
  accepted: ["Accepted", "bg-blue-100 text-blue-700"],
  out_for_delivery: ["Out for delivery", "bg-purple-100 text-purple-700"],
  delivered: ["Delivered", "bg-green-100 text-green-700"],
  rejected: ["Rejected", "bg-red-100 text-red-700"],
  cancelled: ["Cancelled", "bg-red-100 text-red-700"],
};

// Next actions for each status: [label, new status, style, needs confirm]
const ACTIONS = {
  placed: [
    ["Accept", "accepted", "bg-green-600 text-white", false],
    ["Reject", "rejected", "border border-red-200 text-red-600", true],
  ],
  accepted: [
    ["Out for delivery", "out_for_delivery", "bg-purple-600 text-white", false],
    ["Cancel", "cancelled", "border border-red-200 text-red-600", true],
  ],
  out_for_delivery: [
    ["Mark delivered", "delivered", "bg-green-600 text-white", false],
    ["Cancel", "cancelled", "border border-red-200 text-red-600", true],
  ],
};

const Orders = () => {
  useDocumentTitle("Orders");
  const toast = useToast();
  const { user } = useAuth();

  const [tab, setTab] = useState("new");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], page: 1, pages: 1, total: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const statuses = TABS.find((t) => t.key === tab).statuses;
      const [list, c] = await Promise.all([
        API.get("/api/orders", { params: { status: statuses, page } }),
        API.get("/api/orders/counts"),
      ]);
      setData(list.data);
      setCounts(c.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Reload when Layout receives a live socket event
  useEffect(() => {
    window.addEventListener("orders:changed", load);
    return () => window.removeEventListener("orders:changed", load);
  }, [load]);

  const changeStatus = async (order, status, confirm) => {
    if (confirm && !window.confirm(`Mark order #${order.orderNumber} as ${status}?`)) return;
    setBusyId(order._id);
    try {
      await API.patch(`/api/orders/${order._id}/status`, { status });
      toast.success(`Order #${order.orderNumber}: ${STATUS_STYLE[status][0]}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not update the order");
    } finally {
      setBusyId("");
    }
  };

  const tabCount = (key) => {
    if (key === "new") return counts.placed || 0;
    if (key === "active") return (counts.accepted || 0) + (counts.out_for_delivery || 0);
    return 0;
  };

  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Online Orders</h1>

      <StoreLink shopId={user._id} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-full border whitespace-nowrap font-medium ${
              tab === t.key ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700"
            }`}
          >
            {t.label}
            {tabCount(t.key) > 0 && (
              <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${tab === t.key ? "bg-white text-green-700" : "bg-red-600 text-white"}`}>
                {tabCount(t.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading orders...</p>
      ) : data.orders.length === 0 ? (
        <EmptyState
          icon="🛵"
          title="No orders here"
          message={tab === "new" ? "New customer orders will appear here with an alert." : "Nothing to show in this tab."}
        />
      ) : (
        <div className="space-y-3">
          {data.orders.map((o) => {
            const [statusLabel, statusClass] = STATUS_STYLE[o.status];
            return (
              <div key={o._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">
                      Order #{o.orderNumber} <span className="font-normal text-gray-500">· {o.customerName}</span>
                    </p>
                    <p className="text-xs text-gray-500">{fmt(o.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <ul className="mt-3 text-sm divide-y">
                  {o.items.map((i) => (
                    <li key={i.productId} className="py-1 flex justify-between gap-3">
                      <span className="break-words min-w-0">{i.name} × {i.qty}</span>
                      <span className="whitespace-nowrap">{money(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t mt-2 pt-2 text-sm space-y-1">
                  <div className="flex justify-between"><span>Items</span><span>{money(o.subtotal)}</span></div>
                  {o.deliveryCharge > 0 && (
                    <div className="flex justify-between"><span>Delivery charge</span><span>{money(o.deliveryCharge)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Collect (cash on delivery)</span>
                    <span className="text-green-700">{money(o.total ?? o.subtotal)}</span>
                  </div>
                </div>

                <div className="mt-3 text-sm space-y-1">
                  <p className="wrap-break-words">📍 {o.address}</p>
                  {o.note && <p className="text-gray-600 wrap-break-words">📝 {o.note}</p>}
                  <div className="flex flex-wrap gap-3">
                    <a href={`tel:${o.phone}`} className="text-green-700 underline">📞 {o.phone}</a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-700 underline"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>

                {ACTIONS[o.status] && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {ACTIONS[o.status].map(([label, status, style, confirm]) => (
                      <button
                        key={status}
                        disabled={busyId === o._id}
                        onClick={() => changeStatus(o, status, confirm)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${style}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-600">Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
};

export default Orders;