// components/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import HardLockScreen from "./HardLockScreen";
import { useAuth } from "../../contexts/AuthContext";

const MainLayout = () => {
  const { user } = useAuth();

  /**
   * LOGIKA AUTO-LOCK:
   * Akun akan terkunci jika:
   * 1. Properti is_locked bernilai true (dikunci manual oleh Admin)
   * 2. Status user adalah "Libur", "Sakit", atau "Izin"
   * 3. Ada data di LocalStorage yang menandakan user baru saja input izin (isLocked: true)
   */
  const localAttendance = JSON.parse(localStorage.getItem("user_attendance"));

  const isActuallyLocked =
    user?.is_locked ||
    ["Libur", "Sakit", "Izin"].includes(user?.status) ||
    localAttendance?.isLocked === true;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* HardLockScreen hanya muncul jika kriteria penguncian terpenuhi. 
        Kita kirim props 'reason' agar Lock Screen bisa menampilkan alasan yang dinamis.
      */}
      {isActuallyLocked ? (
        <HardLockScreen reason={user?.status || localAttendance?.subStatus} />
      ) : (
        <>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-white lg:rounded-l-[2rem] lg:my-2 lg:mr-2 shadow-2xl shadow-slate-200">
            <TopNav />
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-6xl mx-auto w-full">
                <Outlet /> {/* Area Konten Halaman */}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default MainLayout;
