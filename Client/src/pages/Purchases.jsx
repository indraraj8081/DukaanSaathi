import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { money } from "../utils/format";

const Purchases = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [items, setItems] = useState([]); // { productId, name, qty, costPrice }

  const [history, setHistory] = useState({ purchases: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSuppliers = () =>
    API.get("/api/suppliers").then((r) => setSuppliers(r.data)).catch(() => {});

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await API.get("/api/purchases", { params: { page, limit: 10 } });
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load purchases");
    }
  }, [page]);

  useEffect(() => { loadSuppliers(); }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Product search (waits 300ms after typing stops)
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await API.get("/api/products", { params: { search, limit: 8 } });
        setResults(data.products);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const addItem = (p) => {
    setItems((prev) =>
      prev.some((i) => i.productId === p._id)
        ? prev
        : [...prev, { productId: p._id, name: p.name, qty: 1, costPrice: p.costPrice }]
    );
    setSearch("");
    setResults([]);
  };

  const updateItem = (productId, field, value) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)));

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const addSupplier = async () => {
    const name = window.prompt("Supplier name");
    if (!name || !name.trim()) return;
    try {
      const { data } = await API.post("/api/suppliers", { name });
      await loadSuppliers();
      setSupplierId(data._id);
      flash("Supplier added");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not add supplier");
    }
  };

  // Display only. The server recalculates the total.
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.costPrice) || 0), 0);

  const handleSave = async () => {
    setError("");
    if (items.length === 0) return setError("Add at least one product");

    setSaving(true);
    try {
      await API.post("/api/purchases", {
        supplierId: supplierId || undefined,
        invoiceNo,
        note,
        items: items.map((i) => ({
          productId: i.productId,
          qty: Number(i.qty),
          costPrice: Number(i.costPrice),
        })),
      });
      setItems([]);
      setInvoiceNo("");
      setNote("");
      setSupplierId("");
      flash("Purchase saved and stock updated");
      if (page === 1) loadHistory();
      else setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save the purchase");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border rounded p-2 bg-white";

  return (
    <div className="space-y-4">
      {message && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>

      {/* New purchase */}
      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <h2 className="font-semibold text-gray-800">New Purchase (stock in)</h2>

        {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Supplier (optional)</label>
            <div className="flex gap-2">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={input}>
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <button type="button" onClick={addSupplier} className="px-3 border rounded bg-white whitespace-nowrap hover:bg-green-50">
                + New
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Supplier invoice no. (optional)</label>
            <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={input} />
          </div>
        </div>

        {/* Product search */}
        <div className="relative">
          <label className="block text-sm text-gray-600 mb-1">Add product</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name or barcode"
            className={input}
          />
          {results.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
              {results.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => addItem(p)}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 flex justify-between gap-2"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">Stock: {p.stock}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">Search and add the products you received.</p>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="border rounded-lg p-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium break-words min-w-0">{i.name}</p>
                  <button onClick={() => removeItem(i.productId)} className="text-red-500 px-1" title="Remove">🗑</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 items-end">
                  <div>
                    <label className="block text-xs text-gray-500">Qty</label>
                    <input
                      type="number" min="1" step="1" value={i.qty}
                      onChange={(e) => updateItem(i.productId, "qty", e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Cost price (₹)</label>
                    <input
                      type="number" min="0" step="0.01" value={i.costPrice}
                      onChange={(e) => updateItem(i.productId, "costPrice", e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <p className="text-right font-semibold pb-2">
                    {money((Number(i.qty) || 0) * (Number(i.costPrice) || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-1">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-lg">
            Total: <b className="text-green-700">{money(total)}</b>
          </p>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Purchase History ({history.total})</h2>

        {history.purchases.length === 0 ? (
          <p className="text-gray-500 text-sm">No purchases yet.</p>
        ) : (
          <ul className="divide-y">
            {history.purchases.map((p) => (
              <li key={p._id} className="py-3">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{p.supplierName || "No supplier"}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      {p.invoiceNo ? ` · Inv ${p.invoiceNo}` : ""}
                    </p>
                  </div>
                  <p className="font-bold whitespace-nowrap">{money(p.total)}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  {p.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}

        {history.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-sm text-gray-600">Page {history.page} of {history.pages}</span>
            <button disabled={page >= history.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;