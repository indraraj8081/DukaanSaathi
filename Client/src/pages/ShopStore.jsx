import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const round = (n) => Math.round(n * 100) / 100;

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem("customerInfo")) || {};
  } catch {
    return {};
  }
};

const ShopStore = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";

  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [form, setForm] = useState(() => {
    const s = loadSaved();
    return {
      customerName: (isCustomer ? user.name : s.customerName) || "",
      phone: (isCustomer ? user.phone : s.phone) || "",
      address: s.address || "",
      pincode: localStorage.getItem("pincode") || s.pincode || "",
      note: "",
    };
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useDocumentTitle(shop ? shop.shopName : "Shop");

  useEffect(() => {
    API.get(`/api/public/shops/${shopId}`)
      .then((r) => setShop(r.data))
      .catch(() => setNotFound(true));
  }, [shopId]);

  // Saved addresses exist only for logged-in customers
  useEffect(() => {
    if (!isCustomer) return;
    API.get("/api/account/addresses").then((r) => setAddresses(r.data)).catch(() => {});
  }, [isCustomer]);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    API.get(`/api/public/shops/${shopId}/products`, { params: { search: debounced, category, page } })
      .then((r) => {
        if (cancelled) return;
        setProducts((prev) => (page === 1 ? r.data.products : [...prev, ...r.data.products]));
        setCategories(r.data.categories);
        setHasMore(r.data.hasMore);
      })
      .catch((err) => !cancelled && toast.error(err.response?.data?.message || err.message || "Could not load products"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, debounced, category, page]);

  const qtyOf = (id) => cart.find((i) => i.productId === id)?.qty || 0;

  const setQty = (p, qty) => {
    const q = Math.max(0, Math.min(p.stock, qty));
    setCart((prev) => {
      const rest = prev.filter((i) => i.productId !== p._id);
      return q === 0 ? rest : [...rest, { productId: p._id, name: p.name, price: p.price, stock: p.stock, qty: q }];
    });
  };

  // These numbers are only for display. The server recalculates everything.
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = round(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const belowMin = shop && subtotal < shop.minOrder;
  const delivery = shop
    ? shop.freeDeliveryAbove > 0 && subtotal >= shop.freeDeliveryAbove ? 0 : shop.deliveryCharge || 0
    : 0;
  const total = round(subtotal + delivery);

  const pinReady = /^\d{6}$/.test(form.pincode);
  const served = shop && pinReady
    ? [shop.pincode, ...(shop.deliveryPincodes || [])].filter(Boolean).includes(form.pincode)
    : null; // null means "not checked yet"

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickAddress = (id) => {
    const a = addresses.find((x) => x._id === id);
    if (a) setForm({ ...form, address: a.line, pincode: a.pincode });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError("Enter a valid 10-digit mobile number");
    if (form.address.trim().length < 10) return setError("Please enter your full delivery address");
    if (!pinReady) return setError("Enter a valid 6-digit pincode");
    if (served === false) return setError("This shop does not deliver to your pincode");

    setPlacing(true);
    try {
      const { data } = await API.post(`/api/public/shops/${shopId}/orders`, {
        ...form,
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
      });

      try {
        localStorage.setItem("pincode", form.pincode);
        localStorage.setItem("customerInfo", JSON.stringify({
          customerName: form.customerName, phone: form.phone, address: form.address, pincode: form.pincode,
        }));
      } catch { /* storage is optional */ }

      if (isCustomer && saveAddress) {
        // The order is already placed, so a failure here is not worth showing
        await API.post("/api/account/addresses", { label: "Home", line: form.address, pincode: form.pincode }).catch(() => {});
      }

      toast.success("Order placed!");
      navigate(`/track/${data.trackingCode}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not place the order");
    } finally {
      setPlacing(false);
    }
  };

  if (notFound) {
    return <EmptyState icon="🏪" title="Shop not found" message="This link may be wrong." actionLabel="See all shops" actionTo="/shops" />;
  }
  if (!shop) return <p className="text-gray-500">Loading...</p>;

  const input = "w-full border rounded p-2 bg-white";

  return (
    <div className="space-y-4">
      <Link to="/shops" className="text-sm text-green-700">← All shops</Link>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-800 wrap-break-words min-w-0">{shop.shopName}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${shop.acceptingOrders ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
            {shop.acceptingOrders ? "Open" : "Closed"}
          </span>
        </div>
        {shop.businessType && <p className="text-sm text-gray-500">{shop.businessType}</p>}
        {(shop.address || shop.city) && (
          <p className="text-sm text-gray-600 mt-1 wrap-break-words">📍 {[shop.address, shop.city, shop.pincode].filter(Boolean).join(", ")}</p>
        )}
        {shop.phone && <a href={`tel:${shop.phone}`} className="text-sm text-green-700 underline">📞 {shop.phone}</a>}
        <p className="text-xs text-gray-500 mt-2">
          {shop.deliveryCharge > 0 ? `Delivery ${money(shop.deliveryCharge)}` : "Free delivery"}
          {shop.deliveryCharge > 0 && shop.freeDeliveryAbove > 0 ? ` (free above ${money(shop.freeDeliveryAbove)})` : ""}
          {shop.minOrder > 0 ? ` · Minimum order ${money(shop.minOrder)}` : ""} · Cash on delivery
        </p>
        {!shop.acceptingOrders && (
          <p className="mt-2 bg-orange-50 text-orange-800 text-sm p-2 rounded">This shop is not taking orders right now. You can still browse.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search products" className="flex-1 border rounded-lg p-3 bg-white" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border rounded-lg p-3 bg-white">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && page === 1 ? (
        <p className="text-gray-500 py-8 text-center">Loading products...</p>
      ) : products.length === 0 ? (
        <EmptyState icon="📦" title="No products found" message="Try a different search." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => {
              const q = qtyOf(p._id);
              return (
                <div key={p._id} className="bg-white rounded-xl shadow p-3 flex flex-col">
                  <p className="font-semibold text-gray-800 wrap-break-words">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                  <p className="text-green-700 font-bold mt-1">{money(p.price)}</p>
                  {p.stock <= 5 && <p className="text-xs text-orange-600">Only {p.stock} left</p>}
                  <div className="mt-auto pt-3">
                    {q === 0 ? (
                      <button
                        onClick={() => setQty(p, 1)}
                        disabled={!shop.acceptingOrders}
                        className="w-full border border-green-600 text-green-700 rounded-lg py-2 font-medium hover:bg-green-50 disabled:opacity-40"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button onClick={() => setQty(p, q - 1)} className="w-10 h-10 border rounded-lg text-lg">−</button>
                        <span className="font-semibold">{q}</span>
                        <button onClick={() => setQty(p, q + 1)} disabled={q >= p.stock} className="w-10 h-10 border rounded-lg text-lg disabled:opacity-40">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="text-center">
              <button onClick={() => setPage(page + 1)} disabled={loading} className="px-5 py-2 border rounded-lg bg-white disabled:opacity-50">
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {itemCount > 0 && !open && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white border-t shadow px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{itemCount} item(s)</p>
            <p className="text-lg font-bold text-green-700">{money(subtotal)}</p>
          </div>
          <button onClick={() => setOpen(true)} className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold">
            View Cart
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center">
          <form onSubmit={placeOrder} className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-700">Your cart</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-xl w-10 h-10">✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <ul className="divide-y text-sm">
                {cart.map((i) => (
                  <li key={i.productId} className="py-2 flex items-center justify-between gap-2">
                    <span className="wrap-break-words min-w-0 flex-1">{i.name}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQty(i, i.qty - 1)} className="w-8 h-8 border rounded">−</button>
                      <span className="w-6 text-center">{i.qty}</span>
                      <button type="button" onClick={() => setQty(i, i.qty + 1)} disabled={i.qty >= i.stock} className="w-8 h-8 border rounded disabled:opacity-40">+</button>
                    </div>
                    <span className="w-20 text-right font-medium">{money(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t pt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Items</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{delivery === 0 ? "Free" : money(delivery)}</span>
              </div>
              {shop.freeDeliveryAbove > 0 && delivery > 0 && (
                <p className="text-xs text-green-700">Add {money(shop.freeDeliveryAbove - subtotal)} more for free delivery</p>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-green-700">{money(total)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Pay cash on delivery. The shopkeeper delivers to you.</p>

            {belowMin && (
              <p className="bg-orange-50 text-orange-800 text-sm p-2 rounded">
                Minimum order is {money(shop.minOrder)}. Add {money(shop.minOrder - subtotal)} more.
              </p>
            )}
            {served === false && (
              <p role="alert" className="bg-red-50 text-red-700 text-sm p-2 rounded">
                This shop does not deliver to {form.pincode}.
              </p>
            )}
            {error && <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>}

            {!user && (
              <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                Have an account?{" "}
                <Link to="/login" state={{ from: location.pathname }} className="text-green-700 font-semibold underline">Log in</Link>{" "}
                to use saved addresses and see your order history.
              </p>
            )}

            {isCustomer && addresses.length > 0 && (
              <select defaultValue="" onChange={(e) => pickAddress(e.target.value)} className={input}>
                <option value="">Choose a saved address</option>
                {addresses.map((a) => (
                  <option key={a._id} value={a._id}>{a.label}: {a.line.slice(0, 40)} ({a.pincode})</option>
                ))}
              </select>
            )}

            <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="Your name" autoComplete="name" className={input} />
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Mobile number" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" className={input} />
            <textarea name="address" value={form.address} onChange={handleChange} required rows={3} placeholder="Full delivery address (house no, street, landmark)" autoComplete="street-address" className={input} />
            <input
              name="pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              required
              placeholder="Pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              className={input}
            />
            <input name="note" value={form.note} onChange={handleChange} placeholder="Note for the shop (optional)" maxLength={200} className={input} />

            {isCustomer && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-green-700" />
                Save this address for next time
              </label>
            )}

            <button
              disabled={placing || cart.length === 0 || belowMin || served === false || !shop.acceptingOrders}
              className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {placing ? "Placing order..." : `Place Order · ${money(total)}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShopStore;