import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/roleHome";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user)} replace /> : children;
};

export default PublicRoute;