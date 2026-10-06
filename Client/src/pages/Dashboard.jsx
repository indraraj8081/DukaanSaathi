import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer,
} from "recharts";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { money, shortDate } from "../utils/format";

const StatCard = ({ title, value, sub, color = "text-gray-800" }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-sm text-gray-500">{title}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const daysLeft = (date) =>
  Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/api/dashboard");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load the dashboard");
      }
    };
    load();
  }, []);

  if (error) return <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Hello, {user.name}! 👋</h1>
        <Link
          to="/billing"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + New Bill
        </Link>
      </div>

      {data.totalProducts === 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl">
          No products yet.{" "}
          <Link to="/products" className="font-semibold underline">
            Add your first product
          </Link>{" "}
          to start billing.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Today's Sales"
          value={money(data.today.sales)}
          sub={`${data.today.bills} bills · Profit ${money(data.today.profit)}`}
          color="text-green-700"
        />
        <StatCard
          title="This Month"
          value={money(data.month.sales)}
          sub={`${data.month.bills} bills · Profit ${money(data.month.profit)}`}
        />
        <StatCard title="Total Products" value={data.totalProducts} />
        <StatCard
          title="⚠️ Low Stock"
          value={data.lowStockCount}
          sub={`${data.expiringCount} expiring or expired`}
          color={data.lowStockCount > 0 ? "text-red-600" : "text-gray-800"}
        />
      </div>

      {/* Sales chart */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Last 7 Days Sales</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={shortDate} />
              <YAxis width={60} />
              <Tooltip
                formatter={(v) => [money(v), "Sales"]}
                labelFormatter={shortDate}
              />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">🔥 Top 5 Products (this month)</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">No sales yet this month.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} />
                  <Tooltip formatter={(v) => [v, "Units sold"]} />
                  <Bar dataKey="qty" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">⚠️ Low Stock</h2>
            {data.lowStock.length === 0 ? (
              <p className="text-gray-500 text-sm">All products are well stocked.</p>
            ) : (
              <ul className="text-sm divide-y">
                {data.lowStock.map((p) => (
                  <li key={p._id} className="py-1 flex justify-between">
                    <span>{p.name}</span>
                    <span className={p.stock === 0 ? "text-red-600 font-medium" : "text-orange-600 font-medium"}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-800 mb-2">⏳ Expiry Alerts</h2>
            {data.expiring.length === 0 ? (
              <p className="text-gray-500 text-sm">Nothing expiring in the next 30 days.</p>
            ) : (
              <ul className="text-sm divide-y">
                {data.expiring.map((p) => {
                  const d = daysLeft(p.expiryDate);
                  return (
                    <li key={p._id} className="py-1 flex justify-between">
                      <span>{p.name}</span>
                      <span className={d < 0 ? "text-red-600 font-medium" : "text-orange-600 font-medium"}>
                        {d < 0 ? "Expired" : `${d} days`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link to="/products" className="text-green-700 text-sm font-medium underline">
            Manage products →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;