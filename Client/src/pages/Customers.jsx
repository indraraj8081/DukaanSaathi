import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { money } from "../utils/format";

const Customers = () => {
  const [data, setData] = useState({ customers: [], page: 1, pages: 1, total: 0, totalDue: 0 });
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(null);       // { _id?, name, phone }
  const [payFor, setPayFor] = useState(null);   // customer
  const [ledgerFor, setLedgerFor] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/api/customers", {
        params: { search: debounced, due: dueOnly, page, limit: 10 },
      });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [debounced, dueOnly, page]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try {
      await API.delete(`/api/customers/${c._id}`);
      flash("Customer deleted");
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not delete");
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Customers ({data.total})</h1>
        <button
          onClick={() => setForm({ name: "", phone: "" })}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + New Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-sm text-gray-500">Total credit due from customers</p>
        <p className="text-2xl font-bold text-red-600">{money(data.totalDue)}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name or phone"
          className="border rounded p-2 flex-1 min-w-200px bg-white"
        />
        <label className="flex items-center gap-2 bg-white border rounded px-3">
          <input
            type="checkbox"
            checked={dueOnly}
            onChange={(e) => { setDueOnly(e.target.checked); setPage(1); }}
          />
          Only with balance due
        </label>
      </div>

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading customers...</p>
      ) : data.customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-5xl">👥</p>
          <h2 className="text-lg font-semibold mt-3">No customers found</h2>
          <p className="text-gray-500 mt-1">Add customers to track their credit (udhaar).</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.customers.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 wrap-break-words">{c.name}</p>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="text-sm text-green-700 underline">
                      {c.phone}
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Balance due</p>
                  <p className={`font-bold ${c.balance > 0 ? "text-red-600" : "text-green-700"}`}>
                    {money(c.balance)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setPayFor(c)}
                  disabled={c.balance <= 0}
                  className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-40"
                >
                  Receive Payment
                </button>
                <button onClick={() => setLedgerFor(c)} className="px-3 py-1 border rounded hover:bg-green-50">
                  Ledger
                </button>
                <button
                  onClick={() => setForm({ _id: c._id, name: c.name, phone: c.phone || "" })}
                  className="px-3 py-1 border rounded hover:bg-green-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">
            Next →
          </button>
        </div>
      )}

      {form && (
        <CustomerForm
          initial={form}
          onClose={() => setForm(null)}
          onSaved={(msg) => { setForm(null); flash(msg); load(); }}
        />
      )}
      {payFor && (
        <PaymentForm
          customer={payFor}
          onClose={() => setPayFor(null)}
          onSaved={() => { setPayFor(null); flash("Payment received"); load(); }}
        />
      )}
      {ledgerFor && <Ledger customer={ledgerFor} onClose={() => setLedgerFor(null)} />}
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-green-700">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="text-xl">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const CustomerForm = ({ initial, onClose, onSaved }) => {
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (f._id) await API.put(`/api/customers/${f._id}`, { name: f.name, phone: f.phone });
      else await API.post("/api/customers", { name: f.name, phone: f.phone });
      onSaved(f._id ? "Customer updated" : "Customer added");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <Modal title={f._id ? "Edit Customer" : "New Customer"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>}
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
          placeholder="Name"
          className="w-full border rounded p-2"
        />
        <input
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
          placeholder="Phone (optional)"
          inputMode="tel"
          className="w-full border rounded p-2"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const PaymentForm = ({ customer, onClose, onSaved }) => {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await API.post(`/api/customers/${customer._id}/payments`, { amount: Number(amount), mode });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <Modal title="Receive Payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-gray-600">
          {customer.name} owes <b>{money(customer.balance)}</b>
        </p>
        {error && <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>}
        <input
          type="number"
          min="0.01"
          step="0.01"
          max={customer.balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="Amount (₹)"
          className="w-full border rounded p-2"
        />
        <button type="button" onClick={() => setAmount(String(customer.balance))} className="text-sm text-green-700 underline">
          Pay full balance
        </button>
        <div className="flex gap-2">
          {["cash", "upi", "card"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded border capitalize ${mode === m ? "bg-green-600 text-white border-green-600" : "bg-white"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
            {saving ? "Saving..." : "Receive"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Ledger = ({ customer, onClose }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get(`/api/customers/${customer._id}/ledger`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Could not load ledger"));
  }, [customer._id]);

  return (
    <Modal title={`${customer.name}: Ledger`} onClose={onClose}>
      {error && <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>}
      {!data && !error && <p className="text-gray-500">Loading...</p>}
      {data && (
        <>
          <p className="mb-3">
            Balance due: <b className="text-red-600">{money(data.customer.balance)}</b>
          </p>
          {data.entries.length === 0 ? (
            <p className="text-gray-500 text-sm">No credit bills or payments yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.entries.map((e, i) => (
                <li key={i} className="py-2 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="wrap-break-words">{e.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`font-semibold whitespace-nowrap ${e.type === "credit" ? "text-red-600" : "text-green-700"}`}>
                    {e.type === "credit" ? "+" : "−"}{money(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
};

export default Customers;