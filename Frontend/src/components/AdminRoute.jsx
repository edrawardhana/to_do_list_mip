import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || (user.role !== "Admin" && user.role !== "SuperAdmin")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default AdminRoute;
