import { useEffect, useState } from "react";
import API from "../api/axios";
import InvoiceModal from "../components/InvoiceModal";

const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const Bills = () => {
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
        setError(err.response?.data?.message || "Could not load bills");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Bills ({data.total})</h1>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-green-100 text-gray-700 text-sm">
            <tr>
              <th className="p-3">Bill #</th>
              <th className="p-3">Date</th>
              <th className="p-3">Items</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : data.bills.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No bills yet.</td></tr>
            ) : (
              data.bills.map((b) => (
                <tr key={b._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">#{b.billNumber}</td>
                  <td className="p-3">
                    {new Date(b.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="p-3">{b.items.length}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.pages}
          </span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {selected && (
        <InvoiceModal bill={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default Bills;