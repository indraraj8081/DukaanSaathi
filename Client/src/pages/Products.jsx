import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import ProductModal from "../components/ProductModal";

const daysUntil = (date) =>
  Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

const ExpiryBadge = ({ date }) => {
  if (!date) return <span className="text-gray-400">-</span>;
  const d = daysUntil(date);
  const text = new Date(date).toLocaleDateString("en-IN");
  if (d < 0) return <span className="text-red-600 font-medium">{text} (expired)</span>;
  if (d <= 30) return <span className="text-orange-600 font-medium">{text} ({d}d)</span>;
  return <span>{text}</span>;
};

const StockBadge = ({ p }) => {
  const color =
    p.stock === 0 ? "bg-red-100 text-red-700"
    : p.stock <= p.minStock ? "bg-orange-100 text-orange-700"
    : "bg-green-100 text-green-700";
  return <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>{p.stock}</span>;
};

const Products = () => {
  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, product: null });
  const [toast, setToast] = useState("");

  // Wait 400ms after typing stops before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/api/products", {
        params: { search: debounced, category, stock, page, limit: 10 },
      });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [debounced, category, stock, page]);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/api/products/categories");
      setCategories(data);
    } catch {
      /* categories are optional, ignore errors */
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSave = async (form) => {
    if (modal.product) {
      await API.put(`/api/products/${modal.product._id}`, form);
      showToast("Product updated");
    } else {
      await API.post("/api/products", form);
      showToast("Product added");
    }
    setModal({ open: false, product: null });
    fetchProducts();
    fetchCategories();
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/api/products/${p._id}`);
      showToast("Product deleted");
      // If we deleted the last item on a page, go back one page
      if (data.products.length === 1 && page > 1) setPage(page - 1);
      else fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product");
    }
  };

  const selectClass = "border rounded p-2 bg-white";

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Products ({data.total})</h1>
        <button
          onClick={() => setModal({ open: true, product: null })}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + New Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name or barcode"
          className="border rounded p-2 flex-1 min-w-[200px] bg-white"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={stock}
          onChange={(e) => { setStock(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-green-100 text-gray-700 text-sm">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Expiry</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : data.products.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No products found.{" "}
                  <button
                    className="text-green-700 font-medium underline"
                    onClick={() => setModal({ open: true, product: null })}
                  >
                    Add your first product
                  </button>
                </td>
              </tr>
            ) : (
              data.products.map((p) => (
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">₹{p.price}</td>
                  <td className="p-3"><StockBadge p={p} /></td>
                  <td className="p-3"><ExpiryBadge date={p.expiryDate} /></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setModal({ open: true, product: p })}
                      className="px-2 py-1 hover:bg-green-100 rounded"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="px-2 py-1 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {modal.open && (
        <ProductModal
          product={modal.product}
          categories={categories}
          onClose={() => setModal({ open: false, product: null })}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Products;