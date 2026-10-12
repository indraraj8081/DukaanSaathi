import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  AuthLayout, Field, PasswordField, ErrorBox, SubmitButton,
} from "../components/AuthUI";

const CustomerSignup = () => {
  useDocumentTitle("Create customer account");
  const { registerCustomer } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError("Enter a valid 10-digit mobile number");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await registerCustomer(payload);
      // PublicRoute sends the customer onward after the account is created
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Order from your local shops"
      intro="Create an account to save addresses and track all your orders in one place."
    >
      <h2 className="text-2xl font-bold text-gray-900">Create Customer Account</h2>
      <p className="text-gray-500 mt-1 mb-6">Takes less than a minute.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />
        <Field icon="👤" name="name" placeholder="Full Name" autoComplete="name"
          value={form.name} onChange={handleChange} required />
        <Field icon="✉️" type="email" name="email" placeholder="Email address"
          autoComplete="email" value={form.email} onChange={handleChange} required />
        <Field icon="📞" type="tel" name="phone" placeholder="Mobile Number" autoComplete="tel"
          inputMode="numeric" maxLength={10} value={form.phone} onChange={handleChange} required />
        <PasswordField name="password" placeholder="Password" autoComplete="new-password"
          value={form.password} onChange={handleChange} required minLength={6} />
        <PasswordField name="confirmPassword" placeholder="Confirm Password"
          autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} required />
        <SubmitButton loading={loading}>Create Account →</SubmitButton>
      </form>

      <p className="text-center text-gray-600 mt-6">
        Already have an account?{" "}
        <Link to="/login" state={location.state} className="text-green-700 font-semibold">Login</Link>
      </p>
      <p className="text-center text-gray-500 text-sm mt-2">
        Just want to order once? <Link to="/shops" className="text-green-700 underline">Order without an account</Link>
      </p>
    </AuthLayout>
  );
};

export default CustomerSignup;