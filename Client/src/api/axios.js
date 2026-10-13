import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const endSession = () => {
  let role = "customer";
  try { role = JSON.parse(localStorage.getItem("user"))?.role || role; } catch { /* ignore */ }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.assign(
    role === "admin" ? "/admin-login" : role === "shopkeeper" ? "/shop-login" : "/login"
  );
};

API.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error.response;
    const isLogin = error.config?.url?.includes("/api/auth/login");

    if (!res) {
      error.message = "Cannot reach the server. Check your internet connection and try again.";
    } else if (!isLogin && localStorage.getItem("token")) {
      // Token expired, or the admin blocked this account
      if (res.status === 401 || res.data?.code === "ACCOUNT_BLOCKED") endSession();
    }
    return Promise.reject(error);
  }
);

export default API;