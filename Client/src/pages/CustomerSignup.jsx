import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import AuthShell from "../components/AuthShell";
import { Field, PasswordField, ErrorBox } from "../components/AuthUI";

const CustomerSignup = () => {
  useDocumentTitle("Create your account");
  const { registerCustomer } = useAuth();
  const location = useLocation();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setError("Enter a valid 10-digit mobile number");
    if (f.password.length < 6) return setError("Password must be at least 6 characters");
    if (f.password !== f.confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = f;
      await registerCustomer(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <AuthShell art="🧺" points={[["🛒", "Order from Local Shops"], ["📍", "Save your addresses"], ["📋", "Track all your orders"]]}>
      <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
      <p className="text-gray-500 mt-1 mb-5">Register karke aas-paas ki dukanon se shopping ka experience lein.</p>
      <form onSubmit={submit} className="space-y-3">
        <ErrorBox message={error} />
        <Field icon="👤" name="name" placeholder="Enter your full name" autoComplete="name" value={f.name} onChange={change} required />
        <Field icon="✉️" type="email" name="email" placeholder="Enter your email" autoComplete="email" value={f.email} onChange={change} required />
        <Field icon="📞" type="tel" name="phone" placeholder="Enter your mobile number" inputMode="numeric" maxLength={10} value={f.phone} onChange={change} required />
        <PasswordField name="password" placeholder="Create a password" autoComplete="new-password" value={f.password} onChange={change} required minLength={6} />
        <PasswordField name="confirmPassword" placeholder="Confirm your password" autoComplete="new-password" value={f.confirmPassword} onChange={change} required />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required className="w-4 h-4 mt-0.5 accent-green-700" />
          I agree to the Terms &amp; Conditions
        </label>
        <button disabled={loading || !agree} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-60">
          {loading ? "Please wait..." : "Create Account →"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" state={location.state} className="text-green-700 font-semibold">Login</Link>
      </p>
    </AuthShell>
  );
};

export default CustomerSignup;