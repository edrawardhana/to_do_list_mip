import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// Import komponen sesuai struktur folder kamu
import Approval from "./admin/Approval";
import DailyActivation from "./admin/DailyActivaation";
import ManageAdmin from "./admin/ManageAdmin";
import Tasks from "./Tasks";

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isIntern = user?.role === "user";

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
          <h1 className="text-2xl md:text-3xl font-black text-[#1b254b] tracking-tight uppercase mt-1">
            MCC INTERNSHIP ADMINISTRATION
          </h1>
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
            <Approval />
            <div className="mt-10">
              <DailyActivation />
            </div>
          </div>
        )}

        {isIntern && (
          <div className="space-y-8">
            {/* INTEGRASI DESAIN PROFIL & PROGRES INTERN */}
            <div className="grid grid-cols-12 gap-6">
              {/* Kolom Kiri: Nama & Progress */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm flex justify-between items-start border border-white">
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">
                        Intern Name
                      </p>
                      <h2 className="text-2xl font-black text-[#1b254b] leading-tight">
                        {user?.full_name || "Nabil P"}
                      </h2>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">
                        Division
                      </p>
                      <h3 className="text-lg font-bold text-[#1b254b]">
                        IT Support
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">
                      Shift
                    </p>
                    <span className="bg-indigo-50 text-indigo-600 px-5 py-1.5 rounded-xl font-black text-xs uppercase italic">
                      Morning
                    </span>
                  </div>
                </div>

                <div className="bg-[#0b1437] p-8 rounded-[2rem] text-white flex justify-between items-center relative overflow-hidden shadow-xl shadow-indigo-100">
                  <div className="z-10">
                    <p className="text-indigo-200 text-[10px] font-bold uppercase mb-1">
                      Overall Progress
                    </p>
                    <h4 className="text-4xl font-black italic tracking-tighter">
                      50%{" "}
                      <span className="text-lg not-italic font-bold ml-1">
                        Completed
                      </span>
                    </h4>
                  </div>
                  <div className="z-10 opacity-50">
                    <i className="fa-solid fa-chart-line text-4xl"></i>
                  </div>
                </div>
              </div>

              {/* Kolom Tengah: Jadwal & Stats */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm text-center border border-white h-full flex flex-col justify-between">
                  <p className="text-slate-300 font-black text-[10px] uppercase italic mb-4">
                    Jadwal Anda
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-1 flex flex-col items-center justify-center">
                    <p className="text-[#1b254b] font-black text-[10px] mb-2 uppercase tracking-tighter">
                      Maret 2026
                    </p>
                    <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-slate-400">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <div key={d} className="w-4">
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: 21 }, (_, i) => (
                        <div
                          key={i}
                          className={`p-1 ${i + 1 === 9 ? "bg-sky-400 text-white rounded-full" : ""}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <div className="flex-1 bg-white p-2 rounded-2xl border-b-4 border-emerald-400 shadow-sm">
                      <p className="text-[7px] font-black text-slate-300 uppercase">
                        Selesai
                      </p>
                      <p className="text-xl font-black text-emerald-400">01</p>
                    </div>
                    <div className="flex-1 bg-white p-2 rounded-2xl border-b-4 border-orange-400 shadow-sm">
                      <p className="text-[7px] font-black text-slate-300 uppercase">
                        On Progress
                      </p>
                      <p className="text-xl font-black text-orange-400">01</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Whitebook */}
              <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col border border-white">
                <h3 className="text-slate-300 font-black text-[10px] mb-6 uppercase text-center italic">
                  Whitebook
                </h3>
                <div className="flex-1 bg-indigo-50/30 rounded-3xl p-6 border border-indigo-50 relative">
                  <p className="text-[#1b254b] font-black text-[11px] mb-4 text-center uppercase tracking-tight">
                    Cara Menghidupkan CPG
                  </p>
                  <ul className="text-[9px] text-slate-500 space-y-2 list-decimal pl-4 font-bold italic leading-relaxed">
                    <li>Buka panel utama di belakang mesin</li>
                    <li>Tekan tombol power hijau</li>
                    <li>Tunggu indikator menyala</li>
                  </ul>
                  <button className="absolute bottom-4 right-6 text-[8px] font-black text-slate-400 hover:text-indigo-600 underline decoration-slate-200">
                    Lihat Lebih Lengkap
                  </button>
                </div>
              </div>
            </div>

            {/* DAFTAR TUGAS */}
            <div className="pt-4">
              <h2 className="text-3xl font-black text-slate-400/30 mb-8 uppercase italic tracking-tighter">
                Tugas harian Saya
              </h2>
              <Tasks />
            </div>
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
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white text-center">
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
