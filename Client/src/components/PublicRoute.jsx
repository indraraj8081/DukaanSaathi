import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/roleHome";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from; // set when a page sent the customer to login

  if (!user) return children;
  return <Navigate to={user.role === "customer" && from ? from : homeFor(user)} replace />;
};

export default PublicRoute;