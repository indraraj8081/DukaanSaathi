import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/roleHome";

// Where each role should log in when a protected page needs it
const loginFor = (roles) => {
  if (roles?.includes("admin")) return "/admin-login";
  if (roles?.includes("shopkeeper")) return "/shop-login";
  return "/login";
};

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in: customers go to their login (and come back after),
  // shop and admin pages simply send the visitor to the home page
  if (!user) {
    if (roles?.includes("customer")) {
      return <Navigate to={loginFor(roles)} state={{ from: location.pathname }} replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
};

export default ProtectedRoute;