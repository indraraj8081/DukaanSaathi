import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import Pager from "../components/Pager";
import StatusBadge from "../components/StatusBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money, orderLabel } from "../utils/format";

const STATUSES = ["", "placed", "accepted", "preparing", "out_for_delivery", "delivered", "rejected", "cancelled"];

const AdminOrders = () => {
  useDocumentTitle("Orders | Admin");
  const [params, setParams] = useSearchParams();
  const status = STATUSES.includes(params.get("status") || "") ? params.get("status") || "" : "";

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await API.get("/api/admin/orders", { params: { status, search: debounced, page } });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [status, debounced, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Orders ({data.total})</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Order no. (DS10001), customer or phone"
          className="flex-1 border rounded-lg p-3 bg-white"
        />
        <select
          value={status}
          onChange={(e) => { setParams(e.target.value ? { status: e.target.value } : {}); setPage(1); }}
          className="border rounded-lg p-3 bg-white capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading orders...</p>
      ) : data.orders.length === 0 ? (
        <EmptyState icon="🛵" title="No orders found" message="Try a different status or search." />
      ) : (
        <div className="space-y-3">
          {data.orders.map((o) => (
            <div key={o._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 break-words">
                    {orderLabel(o)} <span className="font-normal text-gray-500">· {o.shopName || "Deleted shop"}</span>
                  </p>
                  <p className="text-xs text-gray-500">{fmt(o.createdAt)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <p className="text-sm text-gray-600 mt-2 break-words">
                {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
              </p>
              <p className="font-bold mt-1">Total <span className="text-green-700">{money(o.total)}</span></p>

              <p className="text-sm text-gray-600 mt-2 break-words">
                {o.customerName} ·{" "}
                <a href={`tel:${o.phone}`} className="text-green-700 underline">{o.phone}</a>
              </p>
              <p className="text-sm text-gray-500 break-words">📍 {o.address}{o.pincode ? ` - ${o.pincode}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default AdminOrders;