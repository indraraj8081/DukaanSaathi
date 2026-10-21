import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { AuthLayout, PasswordField, ErrorBox, SubmitButton } from "../components/AuthUI";

const ResetPassword = () => {
  useDocumentTitle("Reset password");
  const { token } = useParams();

  const [f, setF] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const change = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.password.length < 6) return setError("Password must be at least 6 characters");
    if (f.password !== f.confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      const { data } = await API.post(`/api/auth/reset-password/${token}`, { password: f.password });
      setDone(data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Naya password banayein"
      intro="Ek mazboot password chunein jo aap yaad rakh sakein."
    >
      <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
      <p className="text-gray-500 mt-1 mb-6">Apna naya password daalein.</p>

      {done ? (
        <div className="space-y-4">
          <p role="status" className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm">{done}</p>
          <div className="grid gap-2 text-sm">
            <Link to="/login" className="text-center bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800">Customer login</Link>
            <Link to="/shop-login" className="text-center bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600">Shop owner login</Link>
            <Link to="/admin-login" className="text-center bg-blue-900 text-white font-semibold py-3 rounded-lg hover:bg-blue-950">Admin login</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} />
          <PasswordField name="password" placeholder="New password" autoComplete="new-password"
            value={f.password} onChange={change} required minLength={6} />
          <PasswordField name="confirm" placeholder="Confirm new password" autoComplete="new-password"
            value={f.confirm} onChange={change} required />
          <SubmitButton loading={loading}>Change password →</SubmitButton>
          <p className="text-center text-sm text-gray-600">
            Link expire ho gaya? <Link to="/forgot-password" className="text-green-700 font-semibold">Naya link mangayein</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;