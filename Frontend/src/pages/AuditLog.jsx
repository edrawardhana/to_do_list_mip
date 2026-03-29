// src/pages/AuditLog.jsx
import React, { useEffect, useState } from "react";
import { getAuditLogs } from "../supabaseClient";
import { toast } from "react-hot-toast";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // 1. Fetch data dari Supabase saat komponen dimuat
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const result = await getAuditLogs();
    if (result.success) {
      setLogs(result.data);
    } else {
      toast.error("Gagal mengambil data log: " + result.error);
    }
    setLoading(false);
  };

  // 2. Logika Filtering
  const filteredLogs = logs.filter((log) => {
    // Karena kita pakai JOIN, nama user ada di log.actor.full_name
    const actorName = log.actor?.full_name || "System";
    const targetName = log.target?.full_name || "N/A";
    const actionText = log.action || "";

    const matchesText =
      filter === "" ||
      actorName.toLowerCase().includes(filter.toLowerCase()) ||
      actionText.toLowerCase().includes(filter.toLowerCase()) ||
      targetName.toLowerCase().includes(filter.toLowerCase());

    const matchesDate =
      dateFilter === "" || log.created_at.startsWith(dateFilter);

    return matchesText && matchesDate;
  });

  // 3. Helper untuk styling badge aksi
  const getBadgeStyle = (action) => {
    const act = action.toLowerCase();
    if (act.includes("login")) return "bg-emerald-100 text-emerald-600";
    if (act.includes("logout")) return "bg-slate-100 text-slate-600";
    if (act.includes("lock")) return "bg-purple-100 text-purple-600";
    if (act.includes("unlock")) return "bg-teal-100 text-teal-600";
    if (act.includes("hapus") || act.includes("delete"))
      return "bg-rose-100 text-rose-600";
    if (act.includes("update") || act.includes("edit"))
      return "bg-amber-100 text-amber-600";
    return "bg-indigo-100 text-indigo-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1b254b] uppercase tracking-tight">
            System Audit Log
          </h1>
          <p className="text-sm text-slate-400">
            Melacak seluruh aktivitas perubahan sistem.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
          >
            <i
              className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`}
            ></i>{" "}
            Refresh
          </button>
          <button className="px-4 py-2 bg-[#1b254b] text-white rounded-xl text-sm font-bold hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-indigo-100">
            <i className="fa-solid fa-download"></i> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-50 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 ml-1">
            Cari Aktivitas
          </label>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input
              type="text"
              placeholder="Cari admin, aksi, atau target user..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
            />
          </div>
        </div>
        <div className="md:w-56">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 ml-1">
            Filter Tanggal
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
          />
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Admin (Actor)
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Aksi
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Target
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Waktu
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Data Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[#1b254b]">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-slate-400 font-medium"
                  >
                    Memuat data log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-slate-400 font-medium"
                  >
                    Tidak ada aktivitas yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                          {log.actor?.full_name?.substring(0, 2) || "SY"}
                        </div>
                        <div>
                          <p className="text-sm font-black">
                            {log.actor?.full_name || "System"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.actor_role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${getBadgeStyle(log.action)}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                      {log.target?.full_name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold">
                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="max-w-[150px] truncate text-[10px] bg-slate-50 p-2 rounded-lg font-mono text-slate-400 hover:max-w-none transition-all cursor-help"
                        title={JSON.stringify(log.new_values)}
                      >
                        {JSON.stringify(log.new_values)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
