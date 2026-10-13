import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Pager from "../components/Pager";
import StatusBadge from "../components/StatusBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";

const AdminCustomers = () => {
  useDocumentTitle("Customers | Admin");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ customers: [], pages: 1, total: 0 });
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
      const { data } = await API.get("/api/admin/customers", { params: { search: debounced, page } });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const toggle = async (c) => {
    const status = c.approvalStatus === "blocked" ? "approved" : "blocked";
    if (status === "blocked" && !window.confirm(`Block ${c.name}? They will not be able to log in.`)) return;
    setBusyId(c._id);
    try {
      await API.patch(`/api/admin/users/${c._id}/status`, { status });
      toast.success(`${c.name}: ${status === "blocked" ? "blocked" : "unblocked"}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not update the customer");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Customers ({data.total})</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search name, email or phone"
        className="w-full border rounded-lg p-3 bg-white"
      />

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading customers...</p>
      ) : data.customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers found" message="Customers who sign up will appear here." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {data.customers.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-gray-800 break-words min-w-0">{c.name}</p>
                <StatusBadge status={c.approvalStatus} />
              </div>
              <a href={`mailto:${c.email}`} className="block text-sm text-green-700 underline break-all mt-1">{c.email}</a>
              <a href={`tel:${c.phone}`} className="block text-sm text-green-700 underline">{c.phone}</a>
              <p className="text-xs text-gray-500 mt-2">
                {c.orderCount} orders · joined {new Date(c.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
              <button
                disabled={busyId === c._id}
                onClick={() => toggle(c)}
                className={`mt-3 px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                  c.approvalStatus === "blocked" ? "bg-green-600 text-white" : "border border-red-200 text-red-600"
                }`}
              >
                {c.approvalStatus === "blocked" ? "Unblock" : "Block"}
              </button>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default AdminCustomers;