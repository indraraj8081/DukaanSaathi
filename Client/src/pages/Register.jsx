import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AuthLayout, Field, PasswordField, ErrorBox, SubmitButton, SocialButtons,
} from "../components/AuthUI";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", shopName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      return setError("Enter a valid 10-digit mobile number");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form; // server does not need this
      await register(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Shuru Kare Apni Digital Dukaan"
      intro="Dukan Saathi ke saath apni dukan ko aur smarter banaye."
    >
      <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
      <p className="text-gray-500 mt-1 mb-6">
        Kuch hi steps me apni dukan ko digital banaye.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <Field icon="👤" name="name" placeholder="Full Name" autoComplete="name"
          value={form.name} onChange={handleChange} required />
        <Field icon="🏪" name="shopName" placeholder="Shop Name (Dukan ka naam)"
          autoComplete="organization" value={form.shopName} onChange={handleChange} required />
        <Field icon="✉️" type="email" name="email" placeholder="Email address"
          autoComplete="email" value={form.email} onChange={handleChange} required />
        <Field icon="📞" type="tel" name="phone" placeholder="Mobile Number"
          autoComplete="tel" inputMode="numeric" maxLength={10}
          value={form.phone} onChange={handleChange} required />
        <PasswordField name="password" placeholder="Password" autoComplete="new-password"
          value={form.password} onChange={handleChange} required minLength={6} />
        <PasswordField name="confirmPassword" placeholder="Confirm Password"
          autoComplete="new-password" value={form.confirmPassword}
          onChange={handleChange} required />

        <SubmitButton loading={loading}>Create Account →</SubmitButton>
      </form>

      <SocialButtons />

      <p className="text-center text-gray-600 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-green-700 font-semibold">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;