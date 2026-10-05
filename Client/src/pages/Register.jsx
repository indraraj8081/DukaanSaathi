import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    shopName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Kuch galat hua");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-green-700 text-center">
          DukaanSaathi 🛒
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Naya account banao
        </p>

        {error && (
          <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {error}
          </p>
        )}

        <input
          name="name"
          placeholder="Aapka naam"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded p-2 mb-3"
        />
        <input
          name="shopName"
          placeholder="Dukaan ka naam"
          value={form.shopName}
          onChange={handleChange}
          required
          className="w-full border rounded p-2 mb-3"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border rounded p-2 mb-3"
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full border rounded p-2 mb-4"
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Ruko..." : "Register"}
        </button>

        <p className="text-sm text-center mt-4">
          Pehle se account hai?{" "}
          <Link to="/login" className="text-orange-600 font-medium">
            Login karo
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;