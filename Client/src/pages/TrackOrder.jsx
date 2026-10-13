import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money, orderLabel } from "../utils/format";

const STEPS = [
  ["placed", "Order placed", "We sent your order to the shop."],
  ["accepted", "Confirmed", "The shop accepted your order."],
  ["preparing", "Preparing", "Your items are being packed."],
  ["out_for_delivery", "Out for delivery", "The shopkeeper is on the way."],
  ["delivered", "Delivered", "Enjoy! Please pay cash on delivery."],
];
const FINAL = ["delivered", "rejected", "cancelled"];

const fmtTime = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const TrackOrder = () => {
  useDocumentTitle("Track your order");
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer;
    let stopped = false;

    const load = async () => {
      try {
        const { data } = await API.get(`/api/public/orders/${code}`);
        if (stopped) return;
        setOrder(data);
        setError("");
        // Keep checking every 15 seconds until the order is finished
        if (!FINAL.includes(data.status)) timer = setTimeout(load, 15000);
      } catch (err) {
        if (stopped) return;
        setError(err.response?.data?.message || err.message || "Could not load the order");
        if (err.response?.status !== 404) timer = setTimeout(load, 15000);
      }
    };

    load();
    return () => { stopped = true; clearTimeout(timer); };
  }, [code]);

  if (error && !order) {
    return <EmptyState icon="🔎" title="Order not found" message={error} actionLabel="See shops" actionTo="/shops" />;
  }
  if (!order) return <p className="text-gray-500">Loading...</p>;

  const closed = order.status === "rejected" || order.status === "cancelled";
  const current = STEPS.findIndex(([k]) => k === order.status);
  const timeOf = (key) => order.history?.find((h) => h.status === key)?.at;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-sm text-gray-500">Order {orderLabel(order)} from</p>
        <h1 className="text-xl font-bold text-gray-800 break-words">{order.shop.shopName}</h1>
        {order.shop.phone && <a href={`tel:${order.shop.phone}`} className="text-sm text-green-700 underline">📞 Call the shop</a>}
      </div>

      {closed ? (
        <p role="alert" className="bg-red-100 text-red-700 p-4 rounded-xl">
          {order.status === "rejected"
            ? "Sorry, the shop could not accept this order."
            : "This order was cancelled."} Please call the shop for details.
        </p>
      ) : (
        <ol className="bg-white rounded-xl shadow p-4">
          {STEPS.map(([key, label, hint], idx) => {
            const done = idx < current;
            const active = idx === current;
            const at = timeOf(key);
            return (
              <li key={key} className="flex gap-3">
                {/* Circle and the line below it */}
                <div className="flex flex-col items-center">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    done || active ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                  } ${active ? "ring-4 ring-green-100" : ""}`}>
                    {done ? "✓" : idx + 1}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <span className={`w-0.5 flex-1 min-h-6 ${done ? "bg-green-600" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className={active ? "font-semibold text-gray-800" : done ? "text-gray-700" : "text-gray-400"}>
                    {label}
                  </p>
                  {active && <p className="text-sm text-gray-600">{hint}</p>}
                  {at && <p className="text-xs text-gray-500">{fmtTime(at)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <ul className="text-sm divide-y">
          {order.items.map((i, idx) => (
            <li key={idx} className="py-1 flex justify-between gap-3">
              <span className="break-words min-w-0">{i.name} × {i.qty}</span>
              <span>{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-2 pt-2 text-sm space-y-1">
          <div className="flex justify-between"><span>Items</span><span>{money(order.subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{order.deliveryCharge > 0 ? money(order.deliveryCharge) : "Free"}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total (pay on delivery)</span>
            <span className="text-green-700">{money(order.total)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 break-words">
          📍 {order.address}{order.pincode ? ` - ${order.pincode}` : ""}
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center">This page refreshes by itself. Save the link to check later.</p>
      <div className="text-center">
        <Link to="/shops" className="text-green-700 underline">Order from another shop</Link>
      </div>
    </div>
  );
};

export default TrackOrder;