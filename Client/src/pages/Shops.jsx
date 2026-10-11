import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

const Shops = () => {
  useDocumentTitle("Order from local shops");
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    API.get("/api/public/shops", { params: { search: debounced } })
      .then((r) => !cancelled && setShops(r.data))
      .catch((err) => !cancelled && setError(err.response?.data?.message || err.message || "Could not load shops"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Order from local shops</h1>
        <p className="text-gray-600">Choose a shop, add items and get them delivered by the shopkeeper.</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search by shop, city or pincode"
        className="w-full border rounded-lg p-3 bg-white"
      />

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading shops...</p>
      ) : shops.length === 0 ? (
        <EmptyState icon="🏪" title="No shops found" message="Try a different city or pincode." />
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
              {s.minOrder > 0 && <p className="text-xs text-gray-500 mt-1">Minimum order {money(s.minOrder)}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;