import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );

  /**
   * NORMALISASI ROLE
   * Mengonversi role dari Laravel (Contoh: "SUPER_ADMIN") ke format standar.
   */
  const normalizedRole = user?.role?.toLowerCase().trim();

  // Izinkan jika role adalah admin, superadmin, atau super_admin
  const hasAdminAccess =
    normalizedRole === "admin" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "super_admin";

  if (!user || !hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
