import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// Import komponen sesuai struktur folder kamu
import Approval from "./admin/Approval";
import DailyActivation from "./admin/DailyActivaation"; // Perhatikan typo di nama file kamu
import ManageAdmin from "./admin/ManageAdmin";
import Tasks from "./Tasks"; // Digunakan untuk tampilan Intern

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sinkronisasi Role Database
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isIntern = user?.role === "user";

  // Format Waktu sesuai Desain Figma
  const formattedDate = currentTime
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#1b254b] tracking-tight uppercase">
            MCC INTERNSHIP ADMINISTRATION
          </h1>
          <p className="text-sm font-bold text-slate-400 tracking-widest flex items-center gap-2">
            {formattedDate} , {formattedTime}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/50 p-2 pr-4 rounded-full border border-white shadow-sm">
          <div className="text-right border-r border-slate-200 pr-4">
            <p className="text-sm font-black text-[#1b254b] leading-none uppercase">
              {user?.full_name?.split(" ")[0] || "User"}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#e0e5f2] border-2 border-white shadow-sm flex items-center justify-center text-[#1b254b] font-bold">
            {user?.full_name?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* KONTEN DINAMIS BERDASARKAN ROLE */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        {isSuperAdmin && (
          <SuperAdminView stats={{ total: 10, swaps: 3, onDuty: 7, off: 3 }} />
        )}

        {isAdmin && (
          <div className="space-y-8">
            {/* Menggabungkan komponen Approval dan DailyActivation untuk Admin */}
            <Approval />
            <div className="mt-10">
              <DailyActivation />
            </div>
          </div>
        )}

        {isIntern && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-[#1b254b] font-black uppercase mb-6">
              My Daily Tasks
            </h3>
            <Tasks /> {/* Menggunakan file Tasks.jsx untuk Intern */}
          </div>
        )}
      </div>
    </div>
  );
};

/* VIEW KHUSUS SUPER ADMIN */
const SuperAdminView = ({ stats }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Total Intern", value: stats.total, color: "text-[#1b254b]" },
        {
          label: "Swap Request",
          value: `0${stats.swaps}`,
          color: "text-sky-500",
        },
        {
          label: "On Duty",
          value: `0${stats.onDuty}`,
          color: "text-emerald-500",
        },
        { label: "Off", value: `0${stats.off}`, color: "text-orange-500" },
      ].map((item, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-[2rem] shadow-sm border border-white flex flex-col items-center justify-center transition-all hover:shadow-md"
        >
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
            {item.label}
          </p>
          <h4 className={`text-4xl font-black ${item.color}`}>{item.value}</h4>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white">
        <h3 className="text-sm font-black text-[#1b254b] mb-6 uppercase tracking-tighter italic text-slate-400">
          Jadwal Intern
        </h3>
        <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 italic text-xs">
          [ Kalender Aktif ]
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white lg:col-span-2">
        <h3 className="text-sm font-black text-[#1b254b] mb-6 uppercase tracking-tighter italic text-slate-400">
          Manage System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-left hover:bg-indigo-100 transition-colors">
            <p className="text-indigo-600 font-black text-xs uppercase mb-1">
              Quick Action
            </p>
            <p className="text-[#1b254b] font-bold text-sm">Manage Admins</p>
          </button>
          <button className="p-6 bg-sky-50 rounded-3xl border border-sky-100 text-left hover:bg-sky-100 transition-colors">
            <p className="text-sky-600 font-black text-xs uppercase mb-1">
              Quick Action
            </p>
            <p className="text-[#1b254b] font-bold text-sm">Send Broadcast</p>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
