import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = () => {
  const { user, loading, isLocked } = useAuth();
  const location = useLocation();

  // 1. Tampilkan loading spinner jika data user sedang diambil
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1a3d] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Jika user belum login, lempar ke halaman login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. SELECTION GUARD: Jika akun terkunci (isLocked === true)
  // Kecualikan halaman "/locked" agar tidak terjadi infinite redirect loop
  if (isLocked && location.pathname !== "/locked") {
    return <Navigate to="/locked" replace />;
  }

  // 4. Jika akun TIDAK terkunci tapi user iseng mencoba buka manual halaman /locked
  if (!isLocked && location.pathname === "/locked") {
    return <Navigate to="/" replace />;
  }

  // Jika semua aman, tampilkan halaman yang diminta (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
