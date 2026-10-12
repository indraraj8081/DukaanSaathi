import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const TYPES = [
  "Kirana / Grocery", "Medical / Pharmacy", "Stationery", "Bakery", "Dairy",
  "Vegetables & Fruits", "General Store", "Electronics", "Clothing", "Other",
];

const Shops = () => {
  useDocumentTitle("Order from local shops");

  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pincode, setPincode] = useState(() => localStorage.getItem("pincode") || "");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const validPin = /^\d{6}$/.test(pincode);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Remember the pincode so the customer does not type it again
  useEffect(() => {
    if (validPin) localStorage.setItem("pincode", pincode);
  }, [pincode, validPin]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    API.get("/api/public/shops", {
      params: { search: debounced, businessType: type, pincode: validPin ? pincode : "" },
    })
      .then((r) => !cancelled && setShops(r.data))
      .catch((err) => !cancelled && setError(err.response?.data?.message || err.message || "Could not load shops"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced, type, pincode, validPin]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Order from local shops</h1>
        <p className="text-gray-600">The shopkeeper delivers to your door. Pay cash on delivery.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <input
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="📍 Your pincode"
          inputMode="numeric"
          className="border rounded-lg p-3 bg-white"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search shop or city"
          className="border rounded-lg p-3 bg-white sm:col-span-2"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", ...TYPES].map((t) => (
          <button
            key={t || "all"}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
              type === t ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700"
            }`}
          >
            {t || "All"}
          </button>
        ))}
      </div>

      {!validPin && (
        <p className="bg-orange-50 text-orange-800 text-sm p-3 rounded-lg">
          Enter your 6-digit pincode to see only the shops that deliver to you.
        </p>
      )}

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading shops...</p>
      ) : shops.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No shops deliver here yet"
          message={validPin ? "Try a different pincode or category." : "Try a different search."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {shops.map((s) => (
            <Link key={s._id} to={`/shop/${s._id}`} className="bg-white rounded-xl shadow p-4 hover:ring-2 hover:ring-green-500 block">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-800 break-words min-w-0">{s.shopName}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${s.acceptingOrders ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                  {s.acceptingOrders ? "Open" : "Closed"}
                </span>
              </div>
              {s.businessType && <p className="text-sm text-gray-500">{s.businessType}</p>}
              {(s.address || s.city) && (
                <p className="text-sm text-gray-600 mt-1 break-words">📍 {[s.address, s.city].filter(Boolean).join(", ")}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {s.deliveryCharge > 0 ? `Delivery ${money(s.deliveryCharge)}` : "Free delivery"}
                {s.deliveryCharge > 0 && s.freeDeliveryAbove > 0 ? ` · free above ${money(s.freeDeliveryAbove)}` : ""}
                {s.minOrder > 0 ? ` · Min order ${money(s.minOrder)}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;