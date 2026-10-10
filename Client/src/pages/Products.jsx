import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import ProductModal from "../components/ProductModal";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

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
  useDocumentTitle("Products");
  const toast = useToast();

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
      setError(err.response?.data?.message || err.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [debounced, category, stock, page]);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/api/products/categories");
      setCategories(data);
    } catch {
      /* categories are optional */
    }
  };

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async (form) => {
    if (modal.product) {
      await API.put(`/api/products/${modal.product._id}`, form);
      toast.success("Product updated");
    } else {
      await API.post("/api/products", form);
      toast.success("Product added");
    }
    setModal({ open: false, product: null });
    fetchProducts();
    fetchCategories();
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/api/products/${p._id}`);
      toast.success("Product deleted");
      if (data.products.length === 1 && page > 1) setPage(page - 1);
      else fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not delete product");
    }
  };

  const filtered = Boolean(debounced || category || stock);

  const clearFilters = () => {
    setSearch("");
    setDebounced("");
    setCategory("");
    setStock("");
    setPage(1);
  };

  const selectClass = "border rounded p-2 bg-white w-full sm:w-auto";

  return (
    <div>
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
          className="border rounded p-2 w-full sm:flex-1 sm:min-w-[200px] bg-white"
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

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading products...</p>
      ) : data.products.length === 0 ? (
        filtered ? (
          <EmptyState
            icon="🔍"
            title="No matching products"
            message="Try a different search or clear the filters."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon="📦"
            title="No products yet"
            message="Add your products to start billing and tracking stock."
            actionLabel="+ Add first product"
            onAction={() => setModal({ open: true, product: null })}
          />
        )
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
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
                {data.products.map((p) => (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {data.products.map((p) => (
              <div key={p._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 break-words">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.category}</p>
                  </div>
                  <StockBadge p={p} />
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="font-semibold">₹{p.price}</span>
                  <ExpiryBadge date={p.expiryDate} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setModal({ open: true, product: p })}
                    className="flex-1 border rounded-lg py-2 hover:bg-green-50"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="flex-1 border border-red-200 text-red-600 rounded-lg py-2 hover:bg-red-50"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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