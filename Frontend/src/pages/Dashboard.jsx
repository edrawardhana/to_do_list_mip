import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Approval from "./admin/Approval";
import DailyActivation from "./admin/DailyActivaation";
import Tasks from "./Tasks";

const Dashboard = () => {
  const { user, loading, isIntern, isAdmin, isSuperAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black text-[#1b254b] animate-pulse uppercase tracking-widest">
            Memasuki Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION - Universal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#1b254b] tracking-tight uppercase mt-1">
            MCC INTERNSHIP{" "}
            <span className="text-indigo-600">ADMINISTRATION</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
            {currentTime.toLocaleTimeString()} —{" "}
            {currentTime.toLocaleDateString("id-ID", { dateStyle: "long" })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/50 p-2 pr-4 rounded-full border border-white shadow-sm backdrop-blur-md">
          <div className="text-right border-r border-slate-200 pr-4">
            <p className="text-sm font-black text-[#1b254b] leading-none uppercase">
              {user?.full_name?.split(" ")[0] || "User"}
            </p>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter mt-1">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-sm flex items-center justify-center text-white font-black italic">
            {user?.full_name?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <main className="animate-in slide-in-from-bottom-4 duration-700">
        {/* Hanya tampilkan view yang relevan dengan dashboard */}
        {isSuperAdmin && (
          <SuperAdminView stats={{ total: 12, swaps: 2, onDuty: 8, off: 4 }} />
        )}

        {isAdmin && (
          <div className="space-y-8">
            <Approval />
            <div className="mt-10">
              <DailyActivation />
            </div>
          </div>
        )}

        {isIntern && <InternView user={user} />}

        {/* Fallback Role Error */}
        {!isSuperAdmin && !isAdmin && !isIntern && (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase italic tracking-widest text-sm">
            Akses Terbatas: Role Tidak Dikenali
          </div>
        )}
      </main>
    </div>
  );
};

/* VIEW KHUSUS INTERN */
const InternView = ({ user }) => (
  <div className="space-y-8 animate-in fade-in duration-1000">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm flex justify-between items-start border border-white">
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Intern Name
              </p>
              <h2 className="text-2xl font-black text-[#1b254b]">
                {user?.full_name}
              </h2>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Division
              </p>
              <h3 className="text-lg font-bold text-[#1b254b]">IT Support</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-indigo-50 text-indigo-600 px-5 py-1.5 rounded-xl font-black text-xs uppercase italic tracking-tighter">
              Morning Shift
            </span>
          </div>
        </div>

        <div className="bg-[#0b1437] p-8 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-indigo-200/50">
          <div>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
              Overall Progress
            </p>
            <h4 className="text-4xl font-black italic tracking-tighter">50%</h4>
          </div>
          <i className="fa-solid fa-chart-line text-4xl opacity-30 text-indigo-400"></i>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-[2rem] shadow-sm border border-white relative overflow-hidden">
        <p className="text-slate-300 font-black text-[10px] uppercase italic mb-4">
          Informasi Tambahan
        </p>
        <div className="h-32 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic text-sm">
          Konten Whitebook/Jadwal Aktif
        </div>
      </div>
    </div>

    <div className="pt-4">
      <h2 className="text-3xl font-black text-[#1b254b]/10 mb-8 uppercase italic tracking-tighter select-none">
        Tugas harian Saya
      </h2>
      <Tasks />
    </div>
  </div>
);

/* VIEW KHUSUS SUPER ADMIN */
const SuperAdminView = ({ stats }) => (
  <div className="space-y-8 animate-in fade-in duration-1000">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Total Intern", value: stats.total, color: "text-[#1b254b]" },
        { label: "Swap Request", value: stats.swaps, color: "text-sky-500" },
        { label: "On Duty", value: stats.onDuty, color: "text-emerald-500" },
        { label: "Off", value: stats.off, color: "text-orange-500" },
      ].map((item, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-[2rem] shadow-sm border border-white flex flex-col items-center justify-center hover:scale-105 transition-all"
        >
          <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">
            {item.label}
          </p>
          <h4 className={`text-4xl font-black ${item.color}`}>{item.value}</h4>
        </div>
      ))}
    </div>
    {/* ... konten super admin lainnya ... */}
  </div>
);

export default Dashboard;
