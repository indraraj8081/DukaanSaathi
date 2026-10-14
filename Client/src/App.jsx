import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { homeFor } from "./utils/roleHome";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerSignup from "./pages/CustomerSignup";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Bills from "./pages/Bills";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Shops from "./pages/Shops";
import ShopStore from "./pages/ShopStore";
import TrackOrder from "./pages/TrackOrder";
import MyOrders from "./pages/MyOrders";
import Account from "./pages/Account";
import AdminDashboard from "./pages/AdminDashboard";
import AdminShops from "./pages/AdminShops";
import AdminCustomers from "./pages/AdminCustomers";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import PublicLayout from "./components/PublicLayout";
import SiteLayout from "./components/SiteLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Logged-in users skip the marketing site and go straight to their own home
const Landing = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user)} replace /> : children;
};


function App() {
  return (
    <Routes>
      {/* Marketing site */}
      <Route element={<Landing><SiteLayout /></Landing>}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Login and sign up */}
      <Route path="/login" element={<PublicRoute><Login portal="customer" /></PublicRoute>} />
      <Route path="/shop-login" element={<PublicRoute><Login portal="shopkeeper" /></PublicRoute>} />
      <Route path="/admin-login" element={<PublicRoute><Login portal="admin" /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><CustomerSignup /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Customer side */}
      <Route element={<PublicLayout />}>
        <Route path="/shops" element={<Shops />} />
        <Route path="/shop/:shopId" element={<ShopStore />} />
        <Route path="/track/:code" element={<TrackOrder />} />
        <Route path="/my-orders" element={<ProtectedRoute roles={["customer"]}><MyOrders /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute roles={["customer"]}><Account /></ProtectedRoute>} />
      </Route>

      {/* Admin side */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
      </Route>

      {/* Shop owner side */}
      <Route element={<ProtectedRoute roles={["shopkeeper"]}><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;