import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { AuthLayout, Field, ErrorBox, SubmitButton } from "../components/AuthUI";

const LOGIN_FOR = { customer: "/login", shopkeeper: "/shop-login", admin: "/admin-login" };

const ForgotPassword = () => {
  useDocumentTitle("Forgot password");
  const [params] = useSearchParams();
  const loginPath = LOGIN_FOR[params.get("portal")] || "/login";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/api/auth/forgot-password", { email });
      setSent(data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Password bhool gaye?"
      intro="Koi baat nahi. Apna email daalein, hum aapko naya password banane ka link bhejenge."
    >
      <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
      <p className="text-gray-500 mt-1 mb-6">Registered email daalein.</p>

      {sent ? (
        <div className="space-y-4">
          <p role="status" className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm">
            {sent}
          </p>
          <p className="text-sm text-gray-600">Inbox ke saath Spam folder bhi dekh lein.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} />
          <Field icon="✉️" type="email" name="email" placeholder="Email address" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <SubmitButton loading={loading}>Send reset link →</SubmitButton>
        </form>
      )}

      <p className="text-center text-gray-600 mt-6 text-sm">
        <Link to={loginPath} className="text-green-700 font-semibold">← Back to login</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;