import React, { useState, useMemo } from "react";

const MOCK_REPORTS = [
  {
    id: 1,
    name: "Nabil P",
    division: "IT Support",
    completed: 15,
    pending: 2,
    score: 92,
  },
  {
    id: 2,
    name: "Intern Testing",
    division: "Marketing",
    completed: 10,
    pending: 5,
    score: 78,
  },
  {
    id: 3,
    name: "Anno",
    division: "Design",
    completed: 12,
    pending: 0,
    score: 88,
  },
];

const Reports = () => {
  const [reports] = useState(MOCK_REPORTS);

  // Perhitungan statistik otomatis agar tidak statis
  const stats = useMemo(() => {
    const totalCompleted = reports.reduce(
      (acc, curr) => acc + curr.completed,
      0,
    );
    const avgScore = (
      reports.reduce((acc, curr) => acc + curr.score, 0) / reports.length
    ).toFixed(1);
    return { totalCompleted, avgScore };
  }, [reports]);

  return (
    <div className="p-4 lg:p-8 bg-[#f8faff] min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase">
            Performance Reports
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Analytics / Monitoring Intern
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95">
          <i className="fa-solid fa-download"></i>
          Export PDF
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Total Tugas Selesai
          </p>
          <p className="text-3xl font-black text-indigo-950">
            {stats.totalCompleted}
          </p>
        </div>
        <div className="bg-indigo-950 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-900/20 text-white">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
            Rata-rata Skor
          </p>
          <p className="text-3xl font-black">{stats.avgScore}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Intern Aktif
          </p>
          <p className="text-3xl font-black text-emerald-500">
            {reports.length.toString().padStart(2, "0")}
          </p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Bulan Laporan
          </p>
          <p className="text-xl font-black text-slate-700 uppercase">
            Maret 2026
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Performa Individu
          </h2>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Real-time Data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto p-4 md:p-8">
          <table className="w-full">
            <thead>
              <tr className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] text-left">
                <th className="pb-6 px-4">Nama Intern</th>
                <th className="pb-6 px-4">Divisi</th>
                <th className="pb-6 px-4 text-center">Selesai</th>
                <th className="pb-6 px-4 text-center">Pending</th>
                <th className="pb-6 px-4 text-center">Skor Akhir</th>
                <th className="pb-6 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-sm font-black text-slate-800">
                        {item.name}
                      </p>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-lg">
                      {item.division}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center text-sm font-black text-slate-700">
                    {item.completed}
                  </td>
                  <td className="py-6 px-4 text-center text-sm font-black text-orange-400">
                    {item.pending}
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-black ${item.score >= 85 ? "text-emerald-500" : "text-indigo-600"}`}
                      >
                        {item.score}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${item.score >= 85 ? "bg-emerald-500" : "bg-indigo-600"}`}
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90">
                      Detail
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

export default Reports;
