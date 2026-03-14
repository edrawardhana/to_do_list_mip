import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";

// Terima props onToggleSidebar dari MainLayout
const TopNav = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  // Update jam setiap detik
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Mapping path → judul
  const titles = {
    "/": `Selamat ${getGreeting()}, ${user?.full_name?.split(" ")[0] || ""}! 👋`,
    "/tasks": "Daftar Tugas Saya",
    "/attendance": "Presensi & Perizinan",
    "/whiteboard": "Materi Belajar",
    "/dashboard": "Dashboard Admin",
    "/broadcasts": "Broadcast",
    "/divisions": "Manajemen Divisi",
    "/audit-log": "Audit Log",
  };

  const title = titles[location.pathname] || "MCC Internship";
  const shiftLabel = user?.shift_type === "Morning" ? "Pagi" : "Sore";
  const statusColor =
    user?.status === "Active" ? "text-emerald-400" : "text-slate-400";

  return (
    <header className="h-[68px] flex items-center justify-between px-5 bg-[#070e1d] flex-shrink-0 border-b border-white/[0.05]">
      {/* KIRI: Tombol Hamburger (Hanya Mobile) & Title */}
      <div className="flex items-center gap-4 flex-1">
        {/* Tombol Hamburger - Muncul di bawah ukuran LG */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>

        <div className="flex-1 lg:flex-none">
          <h2 className="text-base font-bold text-white leading-tight">
            {title}
          </h2>
          <p className="text-[10px] text-white/30 font-medium">{today}</p>
        </div>
      </div>

      {/* KANAN: Jam, Status, & Profile */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Jam real-time */}
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-white tabular-nums">{timeStr}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-widest">
            WIB
          </p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-7 bg-white/[0.08]" />

        {/* Status kerja */}
        <div className="hidden md:block text-right">
          <p className="text-[9px] font-black text-white/25 uppercase tracking-widest leading-none">
            Status Kerja
          </p>
          <p className={`text-[11px] font-bold ${statusColor}`}>
            {user?.status === "Active" ? "Aktif" : "Tidak Aktif"} · Shift{" "}
            {shiftLabel}
          </p>
        </div>

        {/* Avatar chip */}
        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] cursor-pointer hover:bg-white/[0.07] transition-all">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black">
            {user?.full_name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .substring(0, 2)
              .toUpperCase() || "?"}
          </div>
          <span className="hidden sm:block text-[11px] font-bold text-white/70">
            {user?.full_name?.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
};

// Helper: sapaan berdasarkan jam
function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Pagi";
  if (h < 15) return "Siang";
  if (h < 18) return "Sore";
  return "Malam";
}

export default TopNav;
