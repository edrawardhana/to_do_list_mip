// components/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import HardLockScreen from "./HardLockScreen";
import { useAuth } from "../../contexts/AuthContext";

const MainLayout = () => {
  const { user } = useAuth();

  // Tentukan judul berdasarkan path (bisa pakai hook useLocation)
  // Atau kita serahkan ke TopNav dengan props dinamis nanti
  // Untuk sementara, judul bisa dikelola di dalam TopNav atau menggunakan state

  return (
    <div className="flex h-screen overflow-hidden">
      <HardLockScreen />
      {!user?.is_locked && (
        <>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-y-auto">
            <TopNav />
            <div className="p-10 max-w-6xl mx-auto w-full">
              <Outlet /> {/* Di sinilah konten halaman akan dirender */}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default MainLayout;
