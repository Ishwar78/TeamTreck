import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { token, loading } = useAuth();

  if (loading) return null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
