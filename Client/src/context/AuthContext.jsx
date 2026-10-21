import { createContext, useCallback, useContext, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const saveUser = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

    const login = async (email, password, expectedRole) => {
    const { data } = await API.post("/api/auth/login", { email, password, expectedRole });
    saveUser(data);
  };

  // Shopkeeper sign up
  const register = async (formData) => {
    const { data } = await API.post("/api/auth/register", formData);
    saveUser(data);
  };

  // Customer sign up
  const registerCustomer = async (formData) => {
    const { data } = await API.post("/api/auth/register-customer", formData);
    saveUser(data);
  };

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

   const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Full reload to "/" so every page starts fresh and no old data stays
    window.location.assign("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, registerCustomer, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);