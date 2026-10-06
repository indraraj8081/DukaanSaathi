import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import API from "../api/axios";
import { money, shortDate } from "../utils/format";

// Date -> "YYYY-MM-DD" in local time
const toInput = (d) => d.toLocaleDateString("en-CA");

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const Reports = () => {
  const [from, setFrom] = useState(toInput(daysAgo(29)));
  const [to, setTo] = useState(toInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!from || !to) return;
    if (from > to) {
      setError("'From' date cannot be after 'To' date");
      return;
    }
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/api/reports", { params: { from, to } });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load the report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [from, to]);

  const setRange = (days) => {
    setFrom(toInput(daysAgo(days - 1)));
    setTo(toInput(new Date()));
  };

  const dateInput = "border rounded p-2 bg-white";
  const quick = "px-3 py-2 border rounded bg-white hover:bg-green-50 text-sm";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Reports</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">From</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">To</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={dateInput} />
        </div>
        <button onClick={() => setRange(7)} className={quick}>Last 7 days</button>
        <button onClick={() => setRange(30)} className={quick}>Last 30 days</button>
        <button onClick={() => setRange(90)} className={quick}>Last 90 days</button>
      </div>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-green-700">{money(data.summary.sales)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Profit</p>
              <p className="text-2xl font-bold">{money(data.summary.profit)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Bills</p>
              <p className="text-2xl font-bold">{data.summary.bills}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Avg. per Bill</p>
              <p className="text-2xl font-bold">
                {money(data.summary.bills ? data.summary.sales / data.summary.bills : 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Daily Sales</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} />
                  <YAxis width={60} />
                  <Tooltip formatter={(v) => [money(v), "Sales"]} labelFormatter={shortDate} />
                  <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} dot={data.daily.length <= 31} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Top Products</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales in this range.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-1">Product</th>
                      <th className="py-1 text-right">Units</th>
                      <th className="py-1 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.productId} className="border-t">
                        <td className="py-1">{p.name}</td>
                        <td className="py-1 text-right">{p.qty}</td>
                        <td className="py-1 text-right">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Payment Modes</h2>
              {data.payments.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales in this range.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-1">Mode</th>
                      <th className="py-1 text-right">Bills</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.mode} className="border-t">
                        <td className="py-1 capitalize">{p.mode}</td>
                        <td className="py-1 text-right">{p.bills}</td>
                        <td className="py-1 text-right">{money(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;