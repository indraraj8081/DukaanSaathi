import { useEffect, useState } from "react";
import API from "../api/axios";
import InvoiceModal from "../components/InvoiceModal";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const Bills = () => {
  useDocumentTitle("Bills");

  const [data, setData] = useState({ bills: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get("/api/bills", { params: { page, limit: 10 } });
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Could not load bills");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Bills ({data.total})</h1>

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading bills...</p>
      ) : data.bills.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No bills yet"
          message="Bills you create will show up here, and you can reprint them any time."
          actionLabel="Create your first bill"
          actionTo="/billing"
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-green-100 text-gray-700 text-sm">
                <tr>
                  <th className="p-3">Bill #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.bills.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">#{b.billNumber}</td>
                    <td className="p-3">{fmtDate(b.createdAt)}</td>
                    <td className="p-3">{b.customerName || "Walk-in"}</td>
                    <td className="p-3 capitalize">{b.paymentMode}</td>
                    <td className="p-3 font-semibold">{money(b.total)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelected(b)}
                        className="px-3 py-1 border rounded hover:bg-green-50"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {data.bills.map((b) => (
              <div key={b._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold">Bill #{b.billNumber}</p>
                  <p className="font-bold text-green-700">{money(b.total)}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">{fmtDate(b.createdAt)}</p>
                <p className="text-sm text-gray-500 capitalize break-words">
                  {b.customerName || "Walk-in"} · {b.items.length} items · {b.paymentMode}
                </p>
                <button
                  onClick={() => setSelected(b)}
                  className="w-full mt-3 border rounded-lg py-2 hover:bg-green-50"
                >
                  View / Print
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {data.page} of {data.pages}</span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {selected && <InvoiceModal bill={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Bills;