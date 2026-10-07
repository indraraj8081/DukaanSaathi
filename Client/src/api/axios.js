import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      // Server is down or there is no internet
      error.message = "Cannot reach the server. Check your internet connection and try again.";
    } else if (
      error.response.status === 401 &&
      localStorage.getItem("token") &&
      !error.config.url.includes("/api/auth/login")
    ) {
      // Token expired: clear the session and go to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default API;