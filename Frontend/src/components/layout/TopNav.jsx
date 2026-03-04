// components/layout/TopNav.jsx
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const TopNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Mapping path ke judul
  const titles = {
    "/": `Selamat Pagi, ${user?.full_name || ""}! 👋`,
    "/tasks": "Daftar Tugas Saya",
    "/attendance": "Presensi & Perizinan",
    "/whiteboard": "Knowledge Base Intern",
    "/dashboard": "Dashboard Admin",
    "/broadcasts": "Broadcast",
    "/divisions": "Manajemen Divisi",
    "/users": "Manajemen User",
  };

  const title = titles[location.pathname] || "Dashboard";

  return (
    <header className="h-20 glass sticky top-0 flex items-center justify-between px-10 border-b border-slate-200/50 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right mr-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
            Status Kerja
          </p>
          <p className="text-xs font-bold text-emerald-600">
            {user?.status === "Active" ? "Aktif" : "Tidak Aktif"} - Shift{" "}
            {user?.shift_type === "Morning" ? "Pagi" : "Sore"}
          </p>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white transition-all">
          <i className="fa-regular fa-bell"></i>
        </button>
      </div>
    </header>
  );
};

export default TopNav;
