// src/pages/AuditLog.jsx
import { useState } from "react";

const AuditLog = () => {
  const [logs, setLogs] = useState([
    {
      id: 1,
      user: "Ahmad Subardjo",
      action: "Login",
      target: "N/A",
      timestamp: "2024-03-04 08:01:23",
      ip: "192.168.1.10",
    },
    {
      id: 2,
      user: "Siti Aminah",
      action: "Tambah Broadcast",
      target: "Evaluasi Bulanan",
      timestamp: "2024-03-04 09:15:47",
      ip: "192.168.1.12",
    },
    {
      id: 3,
      user: "Budi Santoso",
      action: "Update Tugas",
      target: "Re-design Landing Page",
      timestamp: "2024-03-04 10:02:11",
      ip: "192.168.1.15",
    },
    {
      id: 4,
      user: "Admin",
      action: "Lock User",
      target: "Dewi Sartika",
      timestamp: "2024-03-04 11:30:00",
      ip: "192.168.1.5",
    },
    {
      id: 5,
      user: "SuperAdmin",
      action: "Tambah Divisi",
      target: "UI/UX",
      timestamp: "2024-03-04 12:45:22",
      ip: "192.168.1.1",
    },
    {
      id: 6,
      user: "Rina Melati",
      action: "Logout",
      target: "N/A",
      timestamp: "2024-03-04 13:20:05",
      ip: "192.168.1.20",
    },
    {
      id: 7,
      user: "Joko Widodo",
      action: "Ajukan Izin",
      target: "Sakit",
      timestamp: "2024-03-04 14:10:33",
      ip: "192.168.1.18",
    },
    {
      id: 8,
      user: "Admin",
      action: "Setujui Izin",
      target: "Joko Widodo",
      timestamp: "2024-03-04 14:15:12",
      ip: "192.168.1.5",
    },
  ]);

  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesText =
      filter === "" ||
      log.user.toLowerCase().includes(filter.toLowerCase()) ||
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.target.toLowerCase().includes(filter.toLowerCase());

    const matchesDate =
      dateFilter === "" || log.timestamp.startsWith(dateFilter);
    return matchesText && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2">
            <i className="fa-solid fa-download"></i> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
            Cari
          </label>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Cari user, aksi, atau target..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <div className="md:w-48">
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
            Filter Tanggal
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Aksi
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        log.action.includes("Login")
                          ? "bg-emerald-100 text-emerald-600"
                          : log.action.includes("Logout")
                            ? "bg-slate-100 text-slate-600"
                            : log.action.includes("Tambah") ||
                                log.action.includes("Buat")
                              ? "bg-indigo-100 text-indigo-600"
                              : log.action.includes("Update") ||
                                  log.action.includes("Edit")
                                ? "bg-amber-100 text-amber-600"
                                : log.action.includes("Hapus")
                                  ? "bg-rose-100 text-rose-600"
                                  : log.action.includes("Setujui")
                                    ? "bg-teal-100 text-teal-600"
                                    : log.action.includes("Lock") ||
                                        log.action.includes("Unlock")
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{log.ip}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Tidak ada data yang cocok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination dummy */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white">
            1
          </button>
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition">
            2
          </button>
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition">
            3
          </button>
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
