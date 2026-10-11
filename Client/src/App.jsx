import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { homeFor } from "./utils/roleHome";

// Shop owners go to their dashboard, customers see the list of shops
const Home = () => {
  const { user } = useAuth();
  return <Navigate to={homeFor(user)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Customer side (no login needed) */}
      <Route element={<PublicLayout />}>
        <Route path="/shops" element={<Shops />} />
        <Route path="/shop/:shopId" element={<ShopStore />} />
        <Route path="/track/:code" element={<TrackOrder />} />
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