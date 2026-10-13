import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Pager from "../components/Pager";
import StatusBadge from "../components/StatusBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";

const TABS = ["pending", "approved", "rejected", "blocked", "all"];

// [label, new status, style, needs confirm]
const ACTIONS = {
  pending: [
    ["Approve", "approved", "bg-green-600 text-white", false],
    ["Reject", "rejected", "border border-red-200 text-red-600", true],
  ],
  approved: [["Block", "blocked", "border border-red-200 text-red-600", true]],
  rejected: [["Approve", "approved", "bg-green-600 text-white", false]],
  blocked: [["Unblock", "approved", "bg-green-600 text-white", false]],
};

const AdminShops = () => {
  useDocumentTitle("Shops | Admin");
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("status")) ? params.get("status") : "pending";

  const [search, setSearch] = useState("");
    // The header search box sends the text in the URL (?search=...)
  const urlSearch = params.get("search") || "";
  useEffect(() => {
    if (urlSearch) setSearch(urlSearch);
  }, [urlSearch]);
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ shops: [], counts: {}, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await API.get("/api/admin/shops", {
        params: { status: tab === "all" ? "" : tab, search: debounced, page },
      });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load shops");
    } finally {
      setLoading(false);
    }
  }, [tab, debounced, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const changeStatus = async (shop, status, confirm) => {
    if (confirm && !window.confirm(`Mark "${shop.shopName}" as ${status}?`)) return;
    setBusyId(shop._id);
    try {
      await API.patch(`/api/admin/users/${shop._id}/status`, { status });
      toast.success(`${shop.shopName}: ${status}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not update the shop");
    } finally {
      setBusyId("");
    }
  };

  const pick = (t) => {
    setParams({ status: t });
    setPage(1);
  };

  const countOf = (t) => (t === "all" ? null : data.counts[t] || 0);
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Shops</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => pick(t)}
            className={`px-4 py-2 rounded-full border whitespace-nowrap capitalize ${
              tab === t ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700"
            }`}
          >
            {t}
            {countOf(t) > 0 && (
              <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
                tab === t ? "bg-white text-green-700" : t === "pending" ? "bg-red-600 text-white" : "bg-gray-200"
              }`}>
                {countOf(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search shop, owner, email, city or pincode"
        className="w-full border rounded-lg p-3 bg-white"
      />

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading shops...</p>
      ) : data.shops.length === 0 ? (
        <EmptyState icon="🏪" title="No shops here" message="Nothing matches this tab or search." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {data.shops.map((s) => (
            <div key={s._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 break-words">{s.shopName}</p>
                  <p className="text-sm text-gray-600 break-words">{s.name}</p>
                </div>
                <StatusBadge status={s.approvalStatus} />
              </div>

              <div className="text-sm mt-2 space-y-1">
                <a href={`mailto:${s.email}`} className="block text-green-700 underline break-all">{s.email}</a>
                <a href={`tel:${s.phone}`} className="block text-green-700 underline">{s.phone}</a>
                {(s.address || s.city || s.pincode) && (
                  <p className="text-gray-600 break-words">
                    📍 {[s.address, s.city, s.pincode].filter(Boolean).join(", ")}
                  </p>
                )}
                {s.businessType && <p className="text-gray-500">{s.businessType}</p>}
                {s.gstin && <p className="text-gray-500">GSTIN: {s.gstin}</p>}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {s.productCount} products · {s.orderCount} orders · joined {fmt(s.createdAt)}
              </p>
              {!s.pincode && (
                <p className="text-xs text-orange-700 mt-1">No pincode set, so customers cannot find this shop by area.</p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {(ACTIONS[s.approvalStatus] || []).map(([label, status, style, confirm]) => (
                  <button
                    key={label}
                    disabled={busyId === s._id}
                    onClick={() => changeStatus(s, status, confirm)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${style}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default AdminShops;