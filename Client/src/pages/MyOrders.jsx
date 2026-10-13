import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

import { money, orderLabel } from "../utils/format";

const STATUS = {
  placed: ["Placed", "bg-orange-100 text-orange-700"],
  accepted: ["Confirmed", "bg-blue-100 text-blue-700"],
  preparing: ["Preparing", "bg-yellow-100 text-yellow-700"],
  out_for_delivery: ["Out for delivery", "bg-purple-100 text-purple-700"],
  delivered: ["Delivered", "bg-green-100 text-green-700"],
  rejected: ["Rejected", "bg-red-100 text-red-700"],
  cancelled: ["Cancelled", "bg-red-100 text-red-700"],
};

const MyOrders = () => {
  useDocumentTitle("My Orders");
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await API.get("/api/account/orders");
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (o) => {
    if (!window.confirm(`Cancel order #${orderLabel(o)}?`)) return;
    setBusyId(o._id);
    try {
      await API.post(`/api/account/orders/${o._id}/cancel`);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not cancel the order");
    } finally {
      setBusyId("");
      load(); // shows the real latest status either way
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <EmptyState icon="🛍️" title="No orders yet" message="Orders you place while logged in will show up here."
          actionLabel="Find shops" actionTo="/shops" />
      ) : (
        orders.map((o) => {
          const [label, style] = STATUS[o.status];
          return (
            <div key={o._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 wrap-break-words">{o.shop.shopName}</p>
                  <p className="text-xs text-gray-500">
                    Order #{o.orderNumber} · {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${style}`}>{label}</span>
              </div>

              <p className="text-sm text-gray-600 mt-2 wrap-break-words">
                {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
              </p>
              <p className="font-bold mt-2">
                Total <span className="text-green-700">{money(o.total)}</span>
                {o.deliveryCharge > 0 && <span className="text-xs font-normal text-gray-500"> (incl. delivery {money(o.deliveryCharge)})</span>}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <Link to={`/track/${o.trackingCode}`} className="px-4 py-2 border rounded-lg hover:bg-green-50">Track order</Link>
                {o.status === "placed" && (
                  <button
                    onClick={() => cancel(o)}
                    disabled={busyId === o._id}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel order
                  </button>
                )}
                {o.shop.phone && <a href={`tel:${o.shop.phone}`} className="px-4 py-2 text-green-700 underline">Call shop</a>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyOrders;