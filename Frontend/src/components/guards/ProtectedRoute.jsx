import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isLocked } = useAuth();
  const location = useLocation();

  // 1. TUNGGU DATA READY
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f4f7fe]">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Memuat Sistem...
        </p>
      </div>
    );
  }

  // 2. KALO BELUM LOGIN
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. NORMALISASI ROLE
  const currentRole = user?.role?.toLowerCase().replace("_", "").trim();

  // 4. INTERN BELUM VERIFIKASI
  if (currentRole === "intern" && !user?.is_verified && location.pathname !== "/dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  // =========================================================
  // 5. PERBAIKAN DI SINI: SINKRONISASI PATH LOCK
  // =========================================================
  if (isLocked) {
    // Tambahin '/leave-request' ke daftar yang boleh dibuka pas akun kena gembok
    const allowedLockedPaths = ["/leave-request", "/forbidden"]; 
    
    // Cek path tanpa slash di awal atau pake full path biar akurat
    if (!allowedLockedPaths.includes(location.pathname)) {
      return <Navigate to="/leave-request" replace />;
    }
  }

  // 6. CEK KASTA (ROLE AUTHORIZATION)
  if (roles && !roles.includes(currentRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  // 7. LOLOS SEMUA
  return children;
};

export default ProtectedRoute;