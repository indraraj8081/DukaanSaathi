import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money } from "../utils/format";

// [name, icon]
const TYPES = [
  ["Kirana / Grocery", "🛒"],
  ["Medical / Pharmacy", "💊"],
  ["Stationery", "✏️"],
  ["Bakery", "🥐"],
  ["Dairy", "🥛"],
  ["Vegetables & Fruits", "🥬"],
  ["General Store", "🏪"],
  ["Electronics", "🖥️"],
  ["Clothing", "👕"],
  ["Other", "🛍️"],
];

const ICON = Object.fromEntries(TYPES);

// Full class names are written out so Tailwind can find them
const TILE = {
  "Kirana / Grocery": "from-orange-100 to-amber-200",
  "Medical / Pharmacy": "from-red-100 to-rose-200",
  Stationery: "from-blue-100 to-sky-200",
  Bakery: "from-yellow-100 to-amber-200",
  Dairy: "from-sky-100 to-cyan-200",
  "Vegetables & Fruits": "from-green-100 to-lime-200",
  "General Store": "from-emerald-100 to-green-200",
  Electronics: "from-indigo-100 to-blue-200",
  Clothing: "from-purple-100 to-fuchsia-200",
  Other: "from-gray-100 to-slate-200",
};

const HeroArt = () => (
  <svg viewBox="0 0 320 190" className="h-44 w-auto" aria-hidden="true">
    {/* trees */}
    <circle cx="40" cy="120" r="26" fill="#86efac" />
    <rect x="37" y="140" width="6" height="30" fill="#92400e" />
    <circle cx="285" cy="115" r="30" fill="#4ade80" />
    <rect x="282" y="138" width="6" height="32" fill="#92400e" />
    {/* shop body */}
    <rect x="70" y="88" width="180" height="82" rx="4" fill="#fef3c7" stroke="#d97706" strokeOpacity="0.4" />
    {/* striped awning */}
    <rect x="58" y="62" width="204" height="30" rx="4" fill="#15803d" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={58 + i * 25.5} y="62" width="12.75" height="30" fill="#fff" opacity="0.9" />
    ))}
    {/* sign */}
    <rect x="105" y="26" width="110" height="28" rx="6" fill="#166534" />
    <text x="160" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">Dukan Saathi</text>
    {/* windows and door */}
    <rect x="84" y="104" width="52" height="40" fill="#bfdbfe" />
    <rect x="184" y="104" width="52" height="40" fill="#bfdbfe" />
    <rect x="144" y="108" width="32" height="62" fill="#166534" />
    {/* crates */}
    <rect x="70" y="150" width="44" height="20" fill="#f59e0b" />
    <rect x="206" y="150" width="44" height="20" fill="#f97316" />
    {/* location pin */}
    <path d="M296 40c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#15803d" />
    <circle cx="296" cy="56" r="6" fill="#fff" />
  </svg>
);

const deliveryText = (s) => {
  const parts = [];
  parts.push(s.deliveryCharge > 0 ? `Delivery ${money(s.deliveryCharge)}` : "Free delivery");
  if (s.deliveryCharge > 0 && s.freeDeliveryAbove > 0) parts.push(`free above ${money(s.freeDeliveryAbove)}`);
  if (s.minOrder > 0) parts.push(`Min order ${money(s.minOrder)}`);
  return parts.join(" · ");
};

const ShopCard = ({ s }) => {
  const type = s.businessType;
  const open = s.acceptingOrders;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4">
      {/* Picture tile (shop photos can replace this later) */}
      <div
        className={`w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center text-5xl sm:text-6xl ${
          TILE[type] || TILE.Other
        }`}
        aria-hidden="true"
      >
        {ICON[type] || "🏪"}
      </div>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900 break-words min-w-0">{s.shopName}</h2>
          <span
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-lg whitespace-nowrap ${
              open ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${open ? "bg-green-600" : "bg-gray-400"}`} />
            {open ? "Open" : "Closed"}
          </span>
        </div>

        {type && (
          <span className="mt-1 self-start text-sm bg-green-50 text-green-700 px-3 py-0.5 rounded-full">{type}</span>
        )}

        {(s.address || s.city) && (
          <p className="text-sm text-gray-700 mt-2 break-words">
            <span className="text-red-500">📍</span> {[s.address, s.city].filter(Boolean).join(", ")}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-1 break-words">{deliveryText(s)}</p>

        <Link
          to={`/shop/${s._id}`}
          className="mt-auto pt-3 self-end"
        >
          <span className="inline-block bg-green-800 text-white font-semibold px-8 py-2 rounded-lg hover:bg-green-900">
            {open ? "Open" : "View"}
          </span>
        </Link>
      </div>
    </div>
  );
};

const Shops = () => {
  useDocumentTitle("Order from local shops");

  const chipsRef = useRef(null);
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pincode, setPincode] = useState(() => localStorage.getItem("pincode") || "");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const validPin = /^\d{6}$/.test(pincode);

  // Search while typing (after a short pause)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
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

  // The Search button applies the text straight away
  const submit = (e) => {
    e.preventDefault();
    setDebounced(search.trim());
  };

  const scrollChips = (dir) =>
    chipsRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  const chip = (active) =>
    `flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 ${
      active ? "bg-green-800 text-white border-green-800" : "bg-white text-gray-700 hover:bg-green-50"
    }`;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-green-100 via-green-50 to-white px-6 sm:px-10 py-8 flex items-center justify-between gap-4 overflow-hidden">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Order from <span className="text-green-700">local shops</span>
          </h1>
          <p className="text-gray-700 mt-3 text-base sm:text-lg">
            The shopkeeper delivers to your door. Pay cash on delivery.
          </p>
        </div>
        <div className="hidden md:block shrink-0"><HeroArt /></div>
      </section>

      {/* Search */}
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,4fr)_auto]">
        <label className="flex items-center gap-3 bg-white border rounded-xl px-4 shadow-sm">
          <span className="text-red-500" aria-hidden="true">📍</span>
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Your pincode"
            inputMode="numeric"
            aria-label="Your pincode"
            className="w-full py-3.5 bg-transparent outline-none"
          />
        </label>
        <label className="flex items-center gap-3 bg-white border rounded-xl px-4 shadow-sm">
          <span aria-hidden="true">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shop or city"
            aria-label="Search shop or city"
            className="w-full py-3.5 bg-transparent outline-none"
          />
        </label>
        <button className="bg-green-800 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-green-900">
          🔍 Search
        </button>
      </form>

      {/* Category chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => scrollChips(-1)}
          aria-label="Scroll categories left"
          className="hidden sm:flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-white border hover:bg-green-50"
        >
          ‹
        </button>
        <div ref={chipsRef} className="no-scrollbar flex gap-3 overflow-x-auto py-1 flex-1 min-w-0">
          <button onClick={() => setType("")} className={chip(type === "")}>All</button>
          {TYPES.map(([name, icon]) => (
            <button key={name} onClick={() => setType(name)} className={chip(type === name)}>
              <span aria-hidden="true">{icon}</span>
              {name}
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollChips(1)}
          aria-label="Scroll categories right"
          className="hidden sm:flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-white border hover:bg-green-50"
        >
          ›
        </button>
      </div>

      {!validPin && (
        <p className="flex items-center gap-3 bg-orange-50 text-orange-700 p-4 rounded-xl">
          <span aria-hidden="true">ℹ️</span>
          Enter your 6-digit pincode to see only the shops that deliver to you.
        </p>
      )}

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded-xl">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-10 text-center">Loading shops...</p>
      ) : shops.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No shops deliver here yet"
          message={validPin ? "Try a different pincode or category." : "Try a different search."}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {shops.map((s) => <ShopCard key={s._id} s={s} />)}
        </div>
      )}
    </div>
  );
};

export default Shops;