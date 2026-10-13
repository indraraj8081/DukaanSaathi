import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import AuthShell from "../components/AuthShell";
import { Field, PasswordField, ErrorBox } from "../components/AuthUI";

const PORTALS = {
  customer: {
    role: "customer", title: "Welcome Back!", tone: "green", art: "🛍️",
    intro: "Login karke shopping shuru karein aur apni pasand ki dukanon se order karein.",
    button: "Login as Customer", btn: "bg-green-700 hover:bg-green-800", emailPh: "Enter your email",
    points: [["🛒", "Order from Local Shops"], ["🏷️", "Best Offers"], ["💳", "Cash on Delivery"]],
  },
  shopkeeper: {
    role: "shopkeeper", title: "Shop Owner Login", tone: "green", art: "🏪",
    intro: "Apni dukan ka stock, billing aur orders manage karein.",
    button: "Login to My Shop", btn: "bg-orange-500 hover:bg-orange-600", emailPh: "Enter your email",
    points: [["📦", "Stock & Billing"], ["🔔", "New Order Alerts"], ["📊", "Sales Reports"]],
  },
  admin: {
    role: "admin", title: "Admin Login", tone: "blue", art: "🛡️",
    intro: "Manage shops, orders, customers and platform securely.",
    button: "Login as Admin", btn: "bg-blue-900 hover:bg-blue-950", emailPh: "Enter your admin email",
    points: [],
  },
};

const Login = ({ portal = "customer" }) => {
  const p = PORTALS[portal];
  useDocumentTitle(p.title);
  const { login } = useAuth();
  const location = useLocation();

  const saved = localStorage.getItem(`remember_${portal}`) || "";
  const [form, setForm] = useState({ email: saved, password: "" });
  const [remember, setRemember] = useState(Boolean(saved));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password, p.role);
      if (remember) localStorage.setItem(`remember_${portal}`, form.email);
      else localStorage.removeItem(`remember_${portal}`);
      // PublicRoute sends the user to the right home page
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <AuthShell tone={p.tone} art={p.art} points={p.points}>
      <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
      <p className="text-gray-500 mt-1 mb-5">{p.intro}</p>

      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field icon="✉️" type="email" name="email" placeholder={p.emailPh} autoComplete="email"
          value={form.email} onChange={change} required />
        <PasswordField name="password" placeholder="Password" autoComplete="current-password"
          value={form.password} onChange={change} required />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-green-700" />
          Remember me
        </label>
        <button disabled={loading} className={`w-full text-white py-3 rounded-lg font-semibold disabled:opacity-60 ${p.btn}`}>
          {loading ? "Please wait..." : `${p.button} →`}
        </button>
      </form>

      {portal === "customer" && (
        <div className="mt-5 text-center text-sm text-gray-600 space-y-3">
          <p>New customer?</p>
          <Link to="/signup" state={location.state}
            className="block border-2 border-green-700 text-green-700 font-semibold py-3 rounded-lg hover:bg-green-50">
            Create an Account
          </Link>
          <p>Own a shop? <Link to="/shop-login" className="text-green-700 font-semibold">Shop owner login</Link></p>
        </div>
      )}
      {portal === "shopkeeper" && (
        <p className="mt-5 text-center text-sm text-gray-600">
          New shop? <Link to="/register" className="text-orange-600 font-semibold">Register Your Shop</Link>
          {" · "}<Link to="/login" className="text-green-700 font-semibold">Customer login</Link>
        </p>
      )}
      {portal === "admin" && (
        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
          <p className="font-semibold text-gray-900">🛡️ Authorized Access Only</p>
          <p className="text-gray-600">This area is restricted to authorized personnel. Please login with your admin credentials.</p>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;