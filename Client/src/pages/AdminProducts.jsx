import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import Pager from "../components/Pager";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const AdminProducts = () => {
  useDocumentTitle("Products | Admin");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await API.get("/api/admin/products", { params: { search: debounced, page } });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Products ({data.total})</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search product or category"
        className="w-full border rounded-lg p-3 bg-white"
      />

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading products...</p>
      ) : data.products.length === 0 ? (
        <EmptyState icon="📦" title="No products found" message="Products added by shops will appear here." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.products.map((p) => (
            <div key={p._id} className="bg-white rounded-xl shadow p-4">
              <p className="font-semibold text-gray-800 break-words">{p.name}</p>
              <p className="text-sm text-gray-500 break-words">{p.category} · {p.shopName || "Deleted shop"}</p>
              <div className="flex justify-between mt-2">
                <span className="font-bold text-green-700">{money(p.price)}</span>
                <span className={`text-sm font-medium ${p.stock === 0 ? "text-red-600" : "text-gray-600"}`}>
                  {p.stock === 0 ? "Out of stock" : `Stock: ${p.stock}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default AdminProducts;