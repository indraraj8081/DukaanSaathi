import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

const Account = () => {
  useDocumentTitle("My Account");
  const { user } = useAuth();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ label: "Home", line: "", pincode: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/api/account/addresses")
      .then((r) => setAddresses(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Could not load addresses"));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    if (form.line.trim().length < 10) return setError("Please enter the full address");
    if (!/^\d{6}$/.test(form.pincode)) return setError("Pincode must be 6 digits");

    setSaving(true);
    try {
      const { data } = await API.post("/api/account/addresses", form);
      setAddresses(data);
      setForm({ label: "Home", line: "", pincode: "" });
      toast.success("Address saved");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save the address");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const { data } = await API.delete(`/api/account/addresses/${id}`);
      setAddresses(data);
      toast.success("Address deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not delete the address");
    }
  };

  const input = "w-full border rounded p-2 bg-white";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">My Account</h1>

      <section className="bg-white rounded-xl shadow p-4">
        <p className="font-semibold text-gray-800 break-words">{user.name}</p>
        <p className="text-sm text-gray-600 break-all">{user.email}</p>
        <p className="text-sm text-gray-600">{user.phone}</p>
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-800 mb-2">Saved addresses ({addresses.length}/5)</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No saved addresses yet.</p>
        ) : (
          <ul className="divide-y">
            {addresses.map((a) => (
              <li key={a._id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{a.label}</p>
                  <p className="text-sm text-gray-600 break-words">{a.line} - {a.pincode}</p>
                </div>
                <button onClick={() => remove(a._id)} className="text-red-600 text-sm whitespace-nowrap">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addresses.length < 5 && (
        <form onSubmit={add} className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Add an address</h2>
          {error && <p role="alert" className="bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>}
          <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={input}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
          <textarea rows={3} value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })}
            placeholder="Full address (house no, street, landmark)" className={input} />
          <input value={form.pincode} inputMode="numeric" placeholder="Pincode"
            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            className={input} />
          <button disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save address"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Account;