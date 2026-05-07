import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Halaman yang SELALU boleh diakses intern, apapun status shift-nya.
 */
const ALWAYS_ALLOWED = [
  "/dashboard",
  "/my-schedule",
  "/leave-request",
  "/settings",
  "/forbidden",
];

const SelectiveLockGuard = () => {
  const { user, loading, shiftLoading, todayShift, isIntern, isLocked, isRestrictedAccess } = useAuth();
  const location = useLocation();

  // Tunggu data user selesai dimuat
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f4f7fe]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Memuat...
        </p>
      </div>
    );
  }

  // Non-intern: bebas akses semua halaman
  if (!isIntern) return <Outlet />;

  // Intern: tunggu fetch jadwal selesai (todayShift null = masih loading)
  // Tapi jangan blokir terlalu lama — jika shiftLoading sudah false tapi todayShift masih null
  // berarti fetch error, izinkan akses penuh
  if (shiftLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f4f7fe]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Memuat jadwal...
        </p>
      </div>
    );
  }

  const currentPath = location.pathname;

  // ── KASUS 1: Hard Lock (is_locked = true dari cron/admin) ────────────────
  if (isLocked) {
    if (currentPath !== "/leave-request") {
      return (
        <Navigate
          to="/leave-request"
          replace
          state={{ alert: "Akun kamu sedang dikunci. Hubungi admin jika ini kesalahan." }}
        />
      );
    }
    return <Outlet />;
  }

  // ── KASUS 2: Restricted Access (OFF atau Cuti hari ini) ──────────────────
  // todayShift === null → fetch error, jangan blokir
  // todayShift === false → tidak ada jadwal (OFF)
  // todayShift.shift_type === 'full' → cuti
  if (isRestrictedAccess) {
    const isAllowed = ALWAYS_ALLOWED.some(p => currentPath.startsWith(p));
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace state={{ shiftAlert: true }} />;
    }
  }

  return <Outlet />;
};

export default SelectiveLockGuard;
