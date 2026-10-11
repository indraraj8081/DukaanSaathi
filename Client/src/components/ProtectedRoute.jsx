import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/roleHome";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
};

export default ProtectedRoute;