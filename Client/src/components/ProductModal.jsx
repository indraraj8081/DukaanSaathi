import { useState } from "react";

const empty = {
  name: "",
  category: "",
  price: "",
  costPrice: "",
  stock: "",
  minStock: "5",
  expiryDate: "",
  barcode: "",
};

const ProductModal = ({ product, categories, onClose, onSave }) => {
  const [form, setForm] = useState(
    product
      ? {
          ...empty,
          ...product,
          expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "",
          barcode: product.barcode || "",
        }
      : empty
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setSaving(false);
    }
  };

  const input = "w-full border rounded p-2";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
      >
        <h2 className="text-xl font-bold text-green-700 mb-4">
          {product ? "Edit Product" : "New Product"}
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={label}>Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className={input} />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Category *</label>
            <input
              name="category"
              list="category-list"
              value={form.category}
              onChange={handleChange}
              required
              className={input}
              
            />
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={label}>Selling Price (₹) *</label>
            <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} required className={input} />
          </div>
          <div>
            <label className={label}>Cost Price (₹) *</label>
            <input type="number" min="0" step="0.01" name="costPrice" value={form.costPrice} onChange={handleChange} required className={input} />
          </div>
          <div>
            <label className={label}>Stock *</label>
            <input type="number" min="0" name="stock" value={form.stock} onChange={handleChange} required className={input} />
          </div>
          <div>
            <label className={label}>Minimum Stock</label>
            <input type="number" min="0" name="minStock" value={form.minStock} onChange={handleChange} className={input} />
          </div>
          <div>
            <label className={label}>Expiry Date</label>
            <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className={input} />
          </div>
          <div>
            <label className={label}>Barcode</label>
            <input name="barcode" value={form.barcode} onChange={handleChange} className={input} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={saving}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductModal;