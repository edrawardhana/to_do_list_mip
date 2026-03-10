import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import HardLockScreen from "./HardLockScreen";
import { useAuth } from "../../contexts/AuthContext";
import { useMemo } from "react";

const MainLayout = () => {
  const { user } = useAuth();

  // 1. Ambil data attendance dari localStorage dengan proteksi jika data null/corrupt
  const localAttendance = useMemo(() => {
    try {
      const data = localStorage.getItem("user_attendance");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Gagal membaca localAttendance:", error);
      return null;
    }
  }, []);

  /**
   * 2. LOGIKA PENENTUAN LOCK (isActuallyLocked)
   * Kita pisahkan logika ini agar lebih bersih.
   * Akun terkunci jika:
   * - user.is_locked bernilai true (dari database Laravel)
   * - localAttendance memiliki flag isLocked (input dari form presensi)
   */
  const isActuallyLocked = useMemo(() => {
    // Cek dari Database (Laravel)
    const lockedByAdmin = user?.is_locked === true || user?.is_locked === 1;

    // Cek status khusus yang memicu lock otomatis (jika di Laravel statusnya sudah berubah)
    const statusTerlarang = ["Libur", "Sakit", "Izin"].includes(user?.status);

    // Cek dari LocalStorage (Session saat ini)
    const lockedBySession = localAttendance?.isLocked === true;

    return lockedByAdmin || statusTerlarang || lockedBySession;
  }, [user, localAttendance]);

  // 3. Render HardLockScreen secara Full Screen jika terkunci
  if (isActuallyLocked) {
    return (
      <HardLockScreen
        reason={localAttendance?.subStatus || user?.status || "Akses Dibatasi"}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* SIDEBAR tetap ada di sini. 
          Jika tidak muncul, pastikan komponen Sidebar.jsx tidak memiliki 
          pengecekan role yang membatasi Intern. 
      */}
      <Sidebar />

      {/* Area Utama Dashboard */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white lg:rounded-l-[2rem] lg:my-2 lg:mr-2 shadow-2xl shadow-slate-200 transition-all duration-300">
        {/* TopNav berisi informasi user dan jam */}
        <TopNav />

        {/* Area Konten (Outlet)
            overflow-y-auto memastikan hanya bagian ini yang bisa di-scroll,
            sehingga Sidebar dan TopNav tetap diam (menghilangkan efek blink total).
        */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 bg-white">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
