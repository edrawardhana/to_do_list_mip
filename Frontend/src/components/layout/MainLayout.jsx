import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import HardLockScreen from "./HardLockScreen";
import { useAuth } from "../../contexts/AuthContext";
import { useMemo, useState } from "react";

const MainLayout = () => {
  const { user } = useAuth();

  // 1. State untuk Mobile Menu
  const [mobileOpen, setMobileOpen] = useState(false);

  // 2. Logika Attendance
  const localAttendance = useMemo(() => {
    try {
      const data = localStorage.getItem("user_attendance");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Gagal membaca localAttendance:", error);
      return null;
    }
  }, []);

  // 3. Logika Penentuan Lock
  const isActuallyLocked = useMemo(() => {
    const lockedByAdmin = user?.is_locked === true || user?.is_locked === 1;
    const statusTerlarang = ["Libur", "Sakit", "Izin"].includes(user?.status);
    const lockedBySession = localAttendance?.isLocked === true;

    return lockedByAdmin || statusTerlarang || lockedBySession;
  }, [user, localAttendance]);

  // 4. Render Lock Screen jika terkunci
  if (isActuallyLocked) {
    return (
      <HardLockScreen
        reason={localAttendance?.subStatus || user?.status || "Akses Dibatasi"}
      />
    );
  }

  // 5. Render Layout Utama jika tidak terkunci
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 font-sans relative">
      {/* SIDEBAR - Kirim props mobileOpen & setMobileOpen */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white lg:rounded-l-[2rem] lg:my-2 lg:mr-2 shadow-2xl transition-all duration-300 relative">
        {/* TOPNAV - Kirim fungsi toggle untuk hamburger */}
        <TopNav onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

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
