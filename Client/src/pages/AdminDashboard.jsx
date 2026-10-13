import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { money, orderLabel, shortDate } from "../utils/format";

const GROUPS = [
  { label: "Pending", keys: ["placed"], color: "#facc15" },
  { label: "Confirmed", keys: ["accepted", "preparing"], color: "#3b82f6" },
  { label: "Out for Delivery", keys: ["out_for_delivery"], color: "#8b5cf6" },
  { label: "Delivered", keys: ["delivered"], color: "#22c55e" },
  { label: "Cancelled", keys: ["cancelled", "rejected"], color: "#ef4444" },
];

const ShopArt = () => (
  <svg viewBox="0 0 200 140" className="h-32 w-auto" aria-hidden="true">
    <rect x="30" y="62" width="140" height="68" rx="4" fill="#fff7ed" stroke="#fdba74" />
    <rect x="22" y="40" width="156" height="28" rx="4" fill="#ef4444" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect key={i} x={22 + i * 22.3} y="40" width="11.1" height="28" fill="#fff" opacity="0.85" />
    ))}
    <rect x="70" y="14" width="60" height="22" rx="4" fill="#f97316" />
    <text x="100" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">SHOP</text>
    <rect x="45" y="80" width="40" height="30" fill="#60a5fa" />
    <rect x="115" y="80" width="40" height="30" fill="#60a5fa" />
    <rect x="92" y="85" width="22" height="45" fill="#2563eb" />
  </svg>
);

// "+20%", "+3 new", "0%" or "-10%" compared with the 7 days before
const Trend = ({ g }) => {
  if (!g) return null;
  const { current, previous } = g;
  let text;
  let up = true;
  if (previous === 0) {
    text = current > 0 ? `+${current} new` : "0%";
  } else {
    const pct = Math.round(((current - previous) / previous) * 100);
    up = pct >= 0;
    text = `${pct > 0 ? "+" : ""}${pct}%`;
  }
  return (
    <span
      title="Last 7 days compared with the 7 days before"
      className={`text-sm font-semibold whitespace-nowrap ${up ? "text-green-600" : "text-red-600"}`}
    >
      {up ? "↑" : "↓"} {text}
    </span>
  );
};

const StatCard = ({ title, value, sub, icon, box, iconBox, g }) => (
  <div className={`rounded-xl border p-4 ${box}`}>
    <div className="flex items-center gap-4">
      <span className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${iconBox}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-gray-600">{title}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <Trend g={g} />
        </div>
      </div>
    </div>
    <p className="text-sm text-gray-500 mt-3">{sub}</p>
  </div>
);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const AdminDashboard = () => {
  useDocumentTitle("Admin Dashboard");
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let off = false;
    API.get("/api/admin/overview", { params: { days } })
      .then((r) => !off && setD(r.data))
      .catch((err) => !off && setError(err.response?.data?.message || err.message || "Could not load the dashboard"));
    return () => { off = true; };
  }, [days]);

  if (error) return <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>;
  if (!d) return <p className="text-gray-500">Loading...</p>;

  const t = d.totals;
  const groups = GROUPS.map((g) => ({
    ...g,
    value: g.keys.reduce((s, k) => s + (d.statusCounts[k] || 0), 0),
  }));
  const donutData = t.totalOrders > 0 ? groups.filter((g) => g.value > 0) : [{ label: "None", value: 1, color: "#e5e7eb" }];

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      <section className="rounded-2xl bg-gradient-to-r from-green-100 to-green-50 p-5 sm:p-8 flex items-center justify-between gap-4 overflow-hidden">
        <div className="min-w-0">
          <p className="text-sm tracking-wide text-gray-600">WELCOME BACK</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Dukan Saathi Admin</h1>
          <p className="text-gray-600 mt-2">Manage your shops, customers and orders from here.</p>
          <p className="text-xs text-gray-500 mt-1">Signed in as {user.name}</p>
        </div>
        <div className="hidden sm:block shrink-0"><ShopArt /></div>
      </section>

      {t.pendingShops > 0 && (
        <Link to="/admin/shops?status=pending" className="block bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl font-medium">
          ⏳ {t.pendingShops} shop(s) waiting for your approval. Review now →
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Customers" value={t.totalCustomers} sub="Total registered customers"
          icon="👥" box="bg-blue-50 border-blue-100" iconBox="bg-blue-100" g={d.growth.customers} />
        <StatCard title="Shops" value={t.totalShops} sub={`${t.activeShops} active shops`}
          icon="🏪" box="bg-orange-50 border-orange-100" iconBox="bg-orange-100" g={d.growth.shops} />
        <StatCard title="Products" value={t.totalProducts} sub="Total products in all shops"
          icon="📦" box="bg-violet-50 border-violet-100" iconBox="bg-violet-100" g={d.growth.products} />
        <StatCard title="Orders" value={t.totalOrders} sub={`${t.pendingOrders} waiting for shop`}
          icon="🛒" box="bg-green-50 border-green-100" iconBox="bg-green-100" g={d.growth.orders} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Order overview */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-gray-900">Order Overview</h2>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 bg-white text-sm">
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.daily}>
                <defs>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} />
                <YAxis allowDecimals={false} width={30} />
                <Tooltip labelFormatter={shortDate} formatter={(v) => [v, "Orders"]} />
                <Area type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} fill="url(#ordersFill)" dot={days === 7} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Order status */}
        <section className="bg-white rounded-xl shadow p-4 sm:p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Order Status</h2>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4">
            <div className="relative w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="100%" stroke="none">
                    {donutData.map((g) => <Cell key={g.label} fill={g.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{t.totalOrders}</span>
                <span className="text-xs text-gray-500">Total Orders</span>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {groups.map((g) => (
                <li key={g.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: g.color }} />
                    <span className="truncate">{g.label}</span>
                  </span>
                  <b>{g.value}</b>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        {/* Recent orders */}
        <section className="bg-white rounded-xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 font-medium">View All</Link>
          </div>
          {d.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-gray-600">
                  <tr>
                    <th className="p-2">#</th><th className="p-2">Customer</th><th className="p-2">Shop</th>
                    <th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentOrders.map((o) => (
                    <tr key={o._id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{orderLabel(o)}</td>
                      <td className="p-2">{o.customerName}</td>
                      <td className="p-2">{o.shopName || "-"}</td>
                      <td className="p-2 whitespace-nowrap">{money(o.total)}</td>
                      <td className="p-2"><StatusBadge status={o.status} /></td>
                      <td className="p-2 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent shops */}
        <section className="bg-white rounded-xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Recent Shops</h2>
            <Link to="/admin/shops?status=all" className="text-sm text-blue-600 font-medium">View All</Link>
          </div>
          {d.recentShops.length === 0 ? (
            <p className="text-gray-500 text-sm">No shops yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-gray-600">
                  <tr>
                    <th className="p-2">#</th><th className="p-2">Shop Name</th><th className="p-2">Owner</th>
                    <th className="p-2">Products</th><th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentShops.map((s) => (
                    <tr key={s._id} className="border-t">
                      <td className="p-2 whitespace-nowrap">#S{String(s.no).padStart(3, "0")}</td>
                      <td className="p-2">{s.shopName}</td>
                      <td className="p-2">{s.owner}</td>
                      <td className="p-2">{s.productCount}</td>
                      <td className="p-2">
                        <StatusBadge status={s.status} label={s.status === "approved" ? "Active" : undefined} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;