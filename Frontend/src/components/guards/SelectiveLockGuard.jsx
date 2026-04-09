import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const SelectiveLockGuard = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  // 1. NORMALISASI ROLE
  const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
  const isIntern = rawRole === "intern";

  // 2. LOGIC BYPASS (Admin/Dev Bebas)
  if (!isIntern) {
    return <Outlet />;
  }

  // 3. LOGIC GEMBOK (KHUSUS INTERN)
  // PERBAIKAN: Ganti destination-nya ke /leave-request
  if (isIntern && user?.is_locked) {
    // Lu harus arahin ke path yang BARU lu bikin di App.jsx
    return <Navigate to="/leave-request" replace state={{ alert: "Kamu tidak ada jadwal hari ini. Silakan ajukan izin jika ini kesalahan." }} />;
  }

  // 4. AMAN, SILAKAN MASUK
  return <Outlet />;
};

export default SelectiveLockGuard;