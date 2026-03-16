import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Report = () => {
  const { user } = useAuth();

  // Data Dummy untuk Rekap Tugas
  const taskRecap = [
    {
      id: "01.",
      date: "01 Maret 2026",
      name: "Menyalakan CPG",
      status: "APPROVED",
      statusColor: "bg-green-100 text-green-600",
    },
    {
      id: "02.",
      date: "01 Maret 2026",
      name: "Menyalakan TV",
      status: "PENDING",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      id: "03.",
      date: "01 Maret 2026",
      name: "Menyalakan Didesign",
      status: "REJECTED",
      statusColor: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 space-y-10 animate-in fade-in duration-500">
      {/* JUDUL HALAMAN */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#5e6681] uppercase tracking-tight">
          Laporan Bulanan
        </h1>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        {/* SECTION 1: FORM LAPORAN BULANAN */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-[#1b254b] uppercase mb-8 tracking-tight">
            Form Laporan Bulanan
          </h2>

          <div className="space-y-6">
            {/* Pilih Bulan */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#1b254b]">
                Bulan Laporan
              </label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                <option>Silahkan Pilih Bulan</option>
              </select>
            </div>

            {/* Input Areas */}
            {[
              {
                label: "Ringkasan Pekerjaan Bulan Ini",
                placeholder: "Tuliskan ringkasan bulan ini...",
              },
              {
                label: "Pencapaian/Highlights",
                placeholder: "Tuliskan highlights bulan ini...",
              },
              {
                label: "Kendala",
                placeholder: "Tuliskan kendala bulan ini...",
              },
            ].map((field, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-sm font-black text-[#1b254b]">
                  {field.label}
                </label>
                <textarea
                  placeholder={field.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            ))}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-200 transition-all">
                Kirim Laporan
              </button>
              <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-black py-3 rounded-xl hover:bg-blue-50 transition-all">
                Simpan Draft
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: REKAP TUGAS HARIAN */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-[#1b254b] uppercase mb-6 tracking-tight">
            Rekap Tugas Harian
          </h2>

          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-black text-[#1b254b]">
                Bulan Rekap
              </label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 font-bold">
                <option>Silahkan Pilih Bulan</option>
              </select>
            </div>

            {/* Stats Badge */}
            <div className="flex gap-6 px-4">
              {[
                { label: "Total Tugas", val: "20", color: "text-slate-600" },
                { label: "Approved", val: "18", color: "text-green-500" },
                { label: "Pending", val: "1", color: "text-orange-500" },
                { label: "Rejected", val: "1", color: "text-red-500" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {stat.label}
                  </p>
                  <p className={`text-xl font-black ${stat.color}`}>
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 px-2">No</th>
                  <th className="pb-4 px-2">Tanggal</th>
                  <th className="pb-4 px-2">Task Name</th>
                  <th className="pb-4 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-[#1b254b]">
                {taskRecap.map((row, i) => (
                  <tr
                    key={i}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-2">{row.id}</td>
                    <td className="py-4 px-2">{row.date}</td>
                    <td className="py-4 px-2">{row.name}</td>
                    <td className="py-4 px-2 text-center">
                      <span
                        className={`px-4 py-1 rounded-full text-[10px] font-black tracking-tight ${row.statusColor}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
