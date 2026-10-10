import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import InvoiceModal from "../components/InvoiceModal";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const round = (n) => Math.round(n * 100) / 100;

const Billing = () => {
  useDocumentTitle("Billing");
  const toast = useToast();

  const searchRef = useRef(null);
  const cartRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [gstRate, setGstRate] = useState("0");
  const [paymentMode, setPaymentMode] = useState("cash");

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doneBill, setDoneBill] = useState(null);

  // Wait 300ms after typing stops before searching
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/api/products", {
        params: { search: debounced, limit: 24 },
      });
      setProducts(data.products);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = () =>
    API.get("/api/customers", { params: { limit: 100 } })
      .then((r) => setCustomers(r.data.customers))
      .catch(() => {});

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    fetchCustomers();
    searchRef.current?.focus(); // useful for barcode scanners
  }, []);

  const addToCart = (p) => {
    if (p.stock <= 0) return;
    setError("");
    setCart((prev) => {
      const found = prev.find((i) => i.productId === p._id);
      if (found) {
        if (found.qty >= p.stock) return prev; // cannot exceed stock
        return prev.map((i) =>
          i.productId === p._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        { productId: p._id, name: p.name, price: p.price, stock: p.stock, qty: 1 },
      ];
    });
  };

  const changeQty = (productId, qty) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, qty: Math.max(1, Math.min(i.stock, qty || 1)) }
          : i
      )
    );
  };

  const removeItem = (productId) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  // Barcode scanners type the code and press Enter
  const handleSearchKey = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = products.find((p) => p.barcode && p.barcode === search.trim());
    const target = exact || (products.length === 1 ? products[0] : null);
    if (target) {
      addToCart(target);
      setSearch("");
    }
  };

  // These numbers are only for display. The server recalculates everything.
  const subtotal = round(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const discountNum = Number(discount) || 0;
  const gst = round(((subtotal - discountNum) * Number(gstRate)) / 100);
  const total = round(subtotal - discountNum + gst);
  const discountInvalid = discountNum < 0 || discountNum > subtotal;

  const handleSubmit = async () => {
    setError("");
    if (cart.length === 0) return setError("Add at least one product");
    if (discountInvalid) return setError("Discount is not valid");
    if (paymentMode === "credit" && !customerId) {
      return setError("Select a customer for credit sales");
    }

    setSubmitting(true);
    try {
      const { data } = await API.post("/api/bills", {
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
        discount: discountNum,
        gstRate: Number(gstRate),
        paymentMode,
        customerId: customerId || undefined,
      });
      setDoneBill(data);
      toast.success(`Bill #${data.billNumber} created`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not create the bill";
      setError(msg);
      toast.error(msg);
      fetchProducts(); // refresh stock in case it changed
    } finally {
      setSubmitting(false);
    }
  };

  const newBill = () => {
    setDoneBill(null);
    setCart([]);
    setDiscount("");
    setGstRate("0");
    setPaymentMode("cash");
    setCustomerId("");
    setSearch("");
    fetchProducts();   // stock has changed
    fetchCustomers();  // credit balance may have changed
    searchRef.current?.focus();
  };

  const modeBtn = (mode) =>
    `py-2 rounded border font-medium capitalize ${
      paymentMode === mode
        ? "bg-green-600 text-white border-green-600"
        : "bg-white text-gray-700 hover:bg-green-50"
    }`;

  return (
    <div className="grid lg:grid-cols-3 gap-4 pb-24 lg:pb-0">
      {/* LEFT: product search and cards */}
      <div className="lg:col-span-2">
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="🔍 Search product or scan barcode"
          className="w-full border rounded-lg p-3 text-lg bg-white mb-4"
        />

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : products.length === 0 ? (
          debounced ? (
            <EmptyState
              icon="🔍"
              title="No matching products"
              message="Check the spelling or scan the barcode again."
            />
          ) : (
            <EmptyState
              icon="📦"
              title="No products to bill yet"
              message="Add products first, then come back to create bills."
              actionLabel="Add products"
              actionTo="/products"
            />
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => {
              const out = p.stock <= 0;
              const low = !out && p.stock <= p.minStock;
              return (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  disabled={out}
                  className={`text-left p-3 rounded-xl shadow bg-white border ${
                    out ? "opacity-50 cursor-not-allowed" : "hover:border-green-500"
                  }`}
                >
                  <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-green-700 font-bold">{money(p.price)}</p>
                  <p
                    className={`text-sm ${
                      out ? "text-red-600" : low ? "text-orange-600" : "text-gray-500"
                    }`}
                  >
                    {out ? "Out of stock" : `Stock: ${p.stock}${low ? " ⚠" : ""}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: cart */}
      <div ref={cartRef} className="bg-white rounded-xl shadow p-4 h-fit lg:sticky lg:top-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Current Bill</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">
            Cart is empty. Tap a product to add it.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {cart.map((i) => (
              <div key={i.productId} className="border-b pb-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium text-gray-800 break-words min-w-0">{i.name}</p>
                  <button
                    onClick={() => removeItem(i.productId)}
                    className="text-red-500 hover:bg-red-50 rounded px-1"
                    title="Remove"
                  >
                    🗑
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                  <span className="text-sm text-gray-500">{money(i.price)} each</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(i.productId, i.qty - 1)}
                      className="w-8 h-8 border rounded hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={i.stock}
                      value={i.qty}
                      onChange={(e) => changeQty(i.productId, Number(e.target.value))}
                      className="w-14 text-center border rounded p-1"
                    />
                    <button
                      onClick={() => changeQty(i.productId, i.qty + 1)}
                      disabled={i.qty >= i.stock}
                      className="w-8 h-8 border rounded hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold">{money(i.price * i.qty)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Discount (₹)</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={`w-24 text-right border rounded p-1 ${
                discountInvalid ? "border-red-500" : ""
              }`}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>GST</span>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className="border rounded p-1 bg-white"
            >
              {["0", "5", "12", "18", "28"].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
            <span>{money(gst)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>TOTAL</span>
            <span className="text-green-700">{money(total)}</span>
          </div>
        </div>

        {/* Customer */}
        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-1">
            Customer {paymentMode === "credit" ? "(required)" : "(optional)"}
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full border rounded p-2 bg-white"
          >
            <option value="">Walk-in customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}{c.balance > 0 ? ` (due ${money(c.balance)})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Payment mode */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 mt-4">
          {["cash", "upi", "card", "credit"].map((m) => (
            <button key={m} onClick={() => setPaymentMode(m)} className={modeBtn(m)}>
              {m}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded mt-3">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? "Creating bill..." : "✅ Create Bill"}
        </button>
      </div>

      {/* Mobile total bar */}
      {cart.length > 0 && !doneBill && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t shadow px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{cart.length} item(s)</p>
            <p className="text-lg font-bold text-green-700">{money(total)}</p>
          </div>
          <button
            onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold"
          >
            View Cart
          </button>
        </div>
      )}

      {/* Success popup with invoice */}
      {doneBill && (
        <InvoiceModal bill={doneBill} onClose={newBill} closeLabel="New Bill" />
      )}
    </div>
  );
};

export default Billing;