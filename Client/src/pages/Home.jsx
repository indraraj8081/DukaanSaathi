import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { ICON } from "../utils/shopTypes";

const CATEGORIES = [
  ["Kirana / Grocery", "Grocery"],
  ["Medical / Pharmacy", "Medical"],
  ["Stationery", "Stationery"],
  ["Bakery", "Bakery"],
  ["Dairy", "Dairy"],
  ["Vegetables & Fruits", "Fruits & Veg"],
  ["General Store", "General"],
  ["Electronics", "Electronics"],
  ["Clothing", "Clothing"],
];

const HomePage = () => {
  useDocumentTitle("");
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pincode, setPincode] = useState(() => localStorage.getItem("pincode") || "");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const validPin = /^\d{6}$/.test(pincode);

  useEffect(() => {
    let off = false;
    setLoading(true);
    API.get("/api/public/shops", { params: { pincode: validPin ? pincode : "" } })
      .then((r) => !off && setShops(r.data.slice(0, 4)))
      .catch(() => !off && setShops([]))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [pincode, validPin]);

  const go = (e) => {
    e.preventDefault();
    if (validPin) localStorage.setItem("pincode", pincode);
    navigate(q.trim() ? `/shops?q=${encodeURIComponent(q.trim())}` : "/shops");
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-green-100 via-green-50 to-white px-6 sm:px-10 py-10 lg:py-14 grid lg:grid-cols-2 gap-8 items-center overflow-hidden">
        <div className="min-w-0">
          <span className="inline-block text-sm font-semibold bg-green-200 text-green-900 px-4 py-1.5 rounded-full">
            Support Local · Shop Local · Grow Together
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Apni Local Market,
            <br />
            <span className="text-green-700">Ab Aapke Mobile Par!</span>
          </h1>
          <p className="mt-4 text-gray-700 max-w-lg">
            Apne aas-paas ki dukaano se products order karein aur apne local shopkeepers ko support karein.
          </p>

          <form onSubmit={go} className="mt-6 bg-white rounded-2xl shadow-sm p-2 flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, shops or categories..."
              aria-label="Search shops"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl outline-none"
            />
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="📍 Pincode"
              inputMode="numeric"
              aria-label="Your pincode"
              className="sm:w-32 px-4 py-3 rounded-xl outline-none border sm:border-0 sm:border-l"
            />
            <button className="bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-800">
              Search →
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/shops" className="bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-800">
              🛒 Explore Shops
            </Link>
            <Link to="/register" className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2.5 rounded-lg hover:bg-green-50">
              🏪 Register Your Shop
            </Link>
          </div>

          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-700">
            <span>✓ Trusted Local Shops</span>
            <span>✓ Easy Ordering</span>
            <span>✓ Local Delivery</span>
          </p>
        </div>

        {/* Picture card (put your own photo here later, see note below the code) */}
        <div className="hidden lg:block relative" aria-hidden="true">
          <div className="rounded-3xl bg-gradient-to-br from-green-200 via-lime-100 to-green-300 h-80 flex items-center justify-center text-8xl shadow-lg">
            🥬🍅🥕
          </div>
          <div className="absolute left-6 bottom-6 bg-white rounded-xl shadow-lg px-5 py-3">
            <p className="font-bold text-gray-900">🌿 Apni Dukan, Hamara Saath</p>
            <p className="text-sm text-gray-600">Shop local. Grow together.</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900">Shop by Categories</h2>
        <p className="text-gray-600 text-sm">Explore a wide range of products from your nearby local shops</p>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map(([type, label]) => (
            <Link
              key={type}
              to={`/shops?type=${encodeURIComponent(type)}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-3 flex flex-col items-center gap-1 text-center"
            >
              <span className="text-3xl" aria-hidden="true">{ICON[type]}</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearby shops */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nearby Shops</h2>
            <p className="text-gray-600 text-sm">
              {validPin ? `Shops that deliver to ${pincode}` : "Enter your pincode to see shops that deliver to you"}
            </p>
          </div>
          <Link to="/shops" className="text-green-700 font-medium whitespace-nowrap">View All Shops →</Link>
        </div>

        {loading ? (
          <p className="text-gray-500 py-8 text-center">Loading shops...</p>
        ) : shops.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No shops found for this area yet.</p>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shops.map((s) => (
              <div key={s._id} className="bg-white rounded-xl shadow-sm hover:shadow-md p-3 flex flex-col">
                <div
                  className="h-28 rounded-lg bg-gradient-to-br from-green-100 to-lime-200 flex items-center justify-center text-5xl"
                  aria-hidden="true"
                >
                  {ICON[s.businessType] || "🏪"}
                </div>
                <h3 className="font-semibold text-gray-900 mt-3 break-words">{s.shopName}</h3>
                {(s.address || s.city) && (
                  <p className="text-xs text-gray-500 break-words">
                    📍 {[s.address, s.city].filter(Boolean).join(", ")}
                  </p>
                )}
                <Link
                  to={`/shop/${s._id}`}
                  className="mt-3 text-center bg-green-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-800"
                >
                  View Shop
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;