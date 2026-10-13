import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import AuthShell from "../components/AuthShell";
import { Field, PasswordField, ErrorBox } from "../components/AuthUI";
import { TYPES } from "../utils/shopTypes";

const Register = () => {
  useDocumentTitle("Register your shop");
  const { register } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    shopName: "", name: "", phone: "", email: "", address: "",
    businessType: "", password: "", confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setError("Enter a valid 10-digit mobile number");
    if (f.address.trim().length < 10) return setError("Please enter your full shop address");
    if (f.password.length < 6) return setError("Password must be at least 6 characters");
    if (f.password !== f.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = f;
      await register(payload);
      toast.success("Shop registered. It will be visible to customers after admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <AuthShell art="👨‍🍳" points={[["🌐", "Get Online Presence"], ["👥", "More Customers"], ["📋", "Manage Orders Easily"], ["📈", "Grow Your Business"]]}>
      <h1 className="text-2xl font-bold text-gray-900">Register Your Shop</h1>
      <p className="text-gray-500 mt-1 mb-5">Apni shop ki details bharein aur approval ke baad apni digital dukan shuru karein.</p>

      <form onSubmit={submit} className="space-y-3">
        <ErrorBox message={error} />
        <Field icon="🏪" name="shopName" placeholder="Shop name" value={f.shopName} onChange={change} required />
        <Field icon="👤" name="name" placeholder="Owner name" autoComplete="name" value={f.name} onChange={change} required />
        <Field icon="📞" type="tel" name="phone" placeholder="Mobile number" inputMode="numeric" maxLength={10} value={f.phone} onChange={change} required />
        <Field icon="✉️" type="email" name="email" placeholder="Email address" autoComplete="email" value={f.email} onChange={change} required />
        <textarea name="address" value={f.address} onChange={change} required rows={3}
          placeholder="Shop address (complete)" className="w-full border border-gray-300 rounded-lg p-3" />
        <select name="businessType" value={f.businessType} onChange={change} required
          className="w-full border border-gray-300 rounded-lg p-3 bg-white">
          <option value="">Shop category</option>
          {TYPES.map(([name]) => <option key={name} value={name}>{name}</option>)}
        </select>
        <PasswordField name="password" placeholder="Create password" autoComplete="new-password" value={f.password} onChange={change} required minLength={6} />
        <PasswordField name="confirmPassword" placeholder="Confirm password" autoComplete="new-password" value={f.confirmPassword} onChange={change} required />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required className="w-4 h-4 mt-0.5 accent-orange-500" />
          I agree to the Terms &amp; Conditions
        </label>
        <button disabled={loading || !agree} className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60">
          {loading ? "Please wait..." : "Submit Shop Registration →"}
        </button>
        <p className="text-xs text-gray-500 text-center">After submission, your shop will be reviewed and approved by admin.</p>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already registered? <Link to="/shop-login" className="text-green-700 font-semibold">Shop owner login</Link>
      </p>
    </AuthShell>
  );
};

export default Register;