import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AuthLayout, Field, PasswordField, ErrorBox, SubmitButton, SocialButtons,
} from "../components/AuthUI";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const savedEmail = localStorage.getItem("rememberedEmail") || "";
  const [form, setForm] = useState({ email: savedEmail, password: "" });
  const [remember, setRemember] = useState(Boolean(savedEmail));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      if (remember) localStorage.setItem("rememberedEmail", form.email);
      else localStorage.removeItem("rememberedEmail");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Apni Dukan Ko Banaye Digital"
      intro="Stock, Sales, Customers aur Profit - Sab kuch ek hi jagah, Dukan Saathi ke saath."
    >
      <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
      <p className="text-gray-500 mt-1 mb-6">
        Apne account me login kare aur apni dukan ka pura hisab manage kare.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <Field
          icon="✉️"
          type="email"
          name="email"
          placeholder="Email address"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <PasswordField
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-green-700"
          />
          Remember me
        </label>

        <SubmitButton loading={loading}>Login →</SubmitButton>
      </form>

      <SocialButtons />

      <p className="text-center text-gray-600 mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-green-700 font-semibold">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;