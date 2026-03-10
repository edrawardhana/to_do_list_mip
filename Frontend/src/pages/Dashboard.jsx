import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInterns: 10, // Disesuaikan dengan desain
    activeTasks: 45,
    pendingSwaps: 3,
    onDuty: 7, // Menambahkan key baru sesuai desain
    off: 3, // Menambahkan key baru sesuai desain
  });

  // Mempertahankan isi data recentActivities Anda untuk tabel Daily Task
  const [recentActivities] = useState([
    {
      id: 1,
      user: "Nabil P",
      division: "IT Support",
      shift: "Morning",
      action: "Menyalakan CPG",
      progress: "100%",
    },
    {
      id: 2,
      user: "Bagas",
      division: "IT Support",
      shift: "Afternoon",
      action: "Mematikan CPG",
      progress: "60%",
    },
    {
      id: 3,
      user: "Edra",
      division: "IT Support",
      shift: "Morning",
      action: "Menyalakan TV",
      progress: "40%",
    },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            MCC INTERNSHIP ADMINISTRATION
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            {new Date().toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}{" "}
            , 12:12:12 PM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-slate-800 leading-none">
              Admin
            </p>
            <p className="text-[10px] text-slate-400 font-bold">IT Support</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
        </div>
      </div>

      {/* 2. Top Row: Jadwal, Whitebook, & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jadwal Anda */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-400 mb-4 self-start px-2">
            Jadwal Anda
          </h3>
          <div className="w-full aspect-square max-h-48 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 italic text-xs">
            [ Kalender Maret 2026 ]
          </div>
        </div>

        {/* Whitebook Section */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 mb-4 px-2">
            Whitebook
          </h3>
          <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50">
            <p className="text-xs font-black text-indigo-600 mb-2">
              Cara Menghidupkan CPG
            </p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-decimal pl-4 font-medium">
              <li>Hubungkan kabel power ke sumber listrik</li>
              <li>Tekan tombol utama pada panel belakang</li>
              <li>Pastikan indikator hijau menyala stabil</li>
              <li>Lakukan kalibrasi awal via console</li>
            </ul>
            <button className="text-[10px] text-sky-500 font-bold mt-4 hover:underline">
              Lihat Lebih Lengkap
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">
              Total Intern
            </p>
            <h4 className="text-4xl font-black text-indigo-900">
              {stats.totalInterns}
            </h4>
          </div>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">
              Swap Request
            </p>
            <h4 className="text-4xl font-black text-sky-500">
              {stats.pendingSwaps < 10
                ? `0${stats.pendingSwaps}`
                : stats.pendingSwaps}
            </h4>
          </div>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">
              On Duty
            </p>
            <h4 className="text-4xl font-black text-emerald-500">
              {stats.onDuty < 10 ? `0${stats.onDuty}` : stats.onDuty}
            </h4>
          </div>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">
              Off
            </p>
            <h4 className="text-4xl font-black text-orange-500">
              {stats.off < 10 ? `0${stats.off}` : stats.off}
            </h4>
          </div>
        </div>
      </div>

      {/* 3. Daily Task Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Daily Task
          </h2>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-bold focus:ring-2 focus:ring-sky-500 w-64 transition-all"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-2.5 text-slate-300 text-xs group-focus-within:text-sky-500"></i>
          </div>
        </div>

        <div className="overflow-x-auto px-4 pb-8">
          <table className="w-full text-left">
            <thead className="text-slate-300 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Intern Details</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentActivities.map((item, index) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50/50 transition-all"
                >
                  <td className="px-6 py-6 text-xs font-black text-slate-400">
                    {index + 1}.
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:scale-110 transition-transform"></div>
                      <div>
                        <p className="text-sm font-black text-slate-700">
                          {item.user}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {item.division || "IT Support"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.shift === "Morning" ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      {item.shift || "Morning"}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-600 bg-slate-50/30 rounded-2xl">
                    {item.action}
                  </td>
                  <td className="px-6 py-6 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: item.progress }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase">
                        {item.progress}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                      <i className="fa-solid fa-check text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
