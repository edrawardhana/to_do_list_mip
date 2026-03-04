import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInterns: 24,
    activeTasks: 45,
    pendingSwaps: 3,
    attendanceRate: 92,
  });
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      user: "Budi Santoso",
      action: "Mengajukan izin sakit",
      time: "10 menit lalu",
      type: "swap",
    },
    {
      id: 2,
      user: "Siti Aminah",
      action: "Menyelesaikan tugas Re-design",
      time: "25 menit lalu",
      type: "task",
    },
    {
      id: 3,
      user: "Joko Widodo",
      action: "Clock in",
      time: "1 jam lalu",
      type: "attendance",
    },
    {
      id: 4,
      user: "Dewi Sartika",
      action: "Mengajukan shift swap",
      time: "2 jam lalu",
      type: "swap",
    },
  ]);
  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, name: "Ahmad Fauzi", type: "Izin Sakit", date: "2024-03-04" },
    { id: 2, name: "Rina Melati", type: "Shift Swap", date: "2024-03-04" },
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard {user?.role === "SuperAdmin" ? "Super Admin" : "Admin"}
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
            <i className="fa-solid fa-plus mr-2"></i>Buat Broadcast
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
            <i className="fa-solid fa-download mr-2"></i>Ekspor Laporan
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Intern
              </p>
              <h4 className="text-2xl font-bold text-slate-800">
                {stats.totalInterns}
              </h4>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 mt-2 flex items-center">
            <i className="fa-solid fa-arrow-up mr-1"></i>+3 dari minggu lalu
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-tasks"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tugas Aktif
              </p>
              <h4 className="text-2xl font-bold text-slate-800">
                {stats.activeTasks}
              </h4>
            </div>
          </div>
          <p className="text-[10px] text-amber-600 mt-2 flex items-center">
            <i className="fa-solid fa-clock mr-1"></i>15 mendekati deadline
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-rotate"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pending Swap
              </p>
              <h4 className="text-2xl font-bold text-slate-800">
                {stats.pendingSwaps}
              </h4>
            </div>
          </div>
          <p className="text-[10px] text-rose-600 mt-2 flex items-center">
            <i className="fa-solid fa-circle-exclamation mr-1"></i>Perlu
            persetujuan
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Kehadiran
              </p>
              <h4 className="text-2xl font-bold text-slate-800">
                {stats.attendanceRate}%
              </h4>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 mt-2 flex items-center">
            <i className="fa-solid fa-check mr-1"></i>Hari ini 18 hadir
          </p>
        </div>
      </div>

      {/* Dua Kolom: Aktivitas Terkini dan Permintaan Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Aktivitas Terkini */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-regular fa-clock mr-2 text-indigo-500"></i>
            Aktivitas Terkini
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === "swap"
                      ? "bg-amber-100 text-amber-600"
                      : activity.type === "task"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      activity.type === "swap"
                        ? "fa-rotate"
                        : activity.type === "task"
                          ? "fa-list-check"
                          : "fa-clock"
                    }`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.user}
                  </p>
                  <p className="text-xs text-slate-500">{activity.action}</p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
            Lihat Semua Aktivitas{" "}
            <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>

        {/* Permintaan Persetujuan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-regular fa-bell mr-2 text-amber-500"></i>
            Perlu Persetujuan
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-amber-50 rounded-xl border border-amber-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-800">{req.name}</p>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    {req.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Tanggal: {req.date}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                    Setujui
                  </button>
                  <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pendingRequests.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              Tidak ada permintaan pending
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
