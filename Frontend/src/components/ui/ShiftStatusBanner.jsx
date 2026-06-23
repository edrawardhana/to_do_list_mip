import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Banner yang muncul di atas halaman ketika intern:
 * - Tidak ada jadwal hari ini (OFF)
 * - Sedang cuti (shift_type = 'full')
 * - Akun dikunci hard (is_locked)
 */
export default function ShiftStatusBanner() {
  const { isIntern, isLocked, isOffToday, isOnLeave, shiftLoading, todayShift } = useAuth();
  const location = useLocation();

  // Hanya tampil untuk intern
  if (!isIntern || shiftLoading) return null;

  // Hard lock
  if (isLocked) {
    return (
      <div className="mx-4 mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-lock text-rose-500"></i>
        </div>
        <div className="flex-1">
          <p className="font-bold text-rose-700 text-sm">Akun Dikunci</p>
          <p className="text-rose-500 text-xs mt-0.5">
            Akun kamu sedang dikunci oleh sistem. Hubungi admin divisi jika ini kesalahan.
          </p>
        </div>
        <Link
          to="/leave-request"
          className="shrink-0 px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors"
        >
          Ajukan Izin
        </Link>
      </div>
    );
  }

  // Cuti (shift_type = 'full')
  if (isOnLeave) {
    return (
      <div className="mx-4 mt-4 rounded-2xl bg-purple-50 border border-purple-200 px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <span className="text-xl">🏖️</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-purple-700 text-sm">Hari Cuti</p>
          <p className="text-purple-500 text-xs mt-0.5">
            Kamu sedang cuti hari ini. Fitur tugas tidak tersedia. Nikmati istirahatmu!
          </p>
        </div>
        <Link
          to="/my-schedule"
          className="shrink-0 px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 transition-colors"
        >
          Lihat Jadwal
        </Link>
      </div>
    );
  }

  if (isOffToday) {
    if (location.pathname === "/leave-request") return null;

    return (
      <div className="mx-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
  
        <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-xl border border-slate-200 shadow-inner">
            😴
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-slate-800 font-black leading-tight text-sm sm:text-base">
              Tidak Ada Jadwal Hari Ini
            </h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Kamu tidak memiliki shift hari ini. Fitur tugas tidak tersedia. Jika ini kesalahan, hubungi admin divisi.
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
          <Link 
            to="/my-schedule"
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center border border-slate-200"
          >
            Lihat Jadwal
          </Link>
          <Link 
            to="/leave-request"
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors text-center shadow-md shadow-slate-800/20"
          >
            Ajukan Izin
          </Link>
        </div>

      </div>
    );
  }

  return null;
}
