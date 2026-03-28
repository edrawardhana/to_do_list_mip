import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Tampilan Loading saat mengecek status auth
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b1437]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 2. Jika tidak ada user sama sekali (belum login), lempar ke Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * NORMALISASI ROLE
   * Mengonversi role dari backend ke format standar untuk pengecekan.
   */
  const normalizedRole = user?.role?.toLowerCase().trim();

  // Izinkan jika role adalah admin, superadmin, atau super_admin
  const hasAdminAccess =
    normalizedRole === "admin" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "super_admin";

  // 3. Jika user login tapi BUKAN admin, arahkan ke LockedPage
  if (!hasAdminAccess) {
    return <Navigate to="/locked" replace />;
  }

  // 4. Jika lolos semua pengecekan, tampilkan konten
  return children;
};

export default AdminRoute;
