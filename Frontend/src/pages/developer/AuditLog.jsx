import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const translateKey = (key) => {
  const dictionary = {
    title: "Judul",
    description: "Deskripsi / Catatan",
    status: "Status",
    evidence_url: "Link Bukti Foto",
    task_date: "Tanggal Tugas",
    due_date: "Tenggat Waktu",
    reject_reason: "Catatan Revisi/Tolak",
    start_time: "Jam Mulai",
    end_time: "Jam Selesai",
    reminder_time: "Waktu Pengingat",
    file_url: "URL Lampiran",
    type: "Tipe Data",
    division_id: "ID Divisi",
    assign_note: "Instruksi Tugas",
    is_active: "Status Aktif",
    confirmed_participants: "Rekan yang Di-tag",
    parent_task_id: "ID Tugas Utama",
  };
  return dictionary[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const renderDataChanges = (oldData, newData) => {
  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]));
  
  const ignoredKeys = ['id', 'created_at', 'updated_at', 'deleted_at', 'uploader_id', 'assigned_by', 'evaluated_by'];

  const changes = allKeys.filter(k => !ignoredKeys.includes(k)).filter(key => {
     return JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]);
  });

  if (changes.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-400 font-bold italic">Tidak ada perubahan data yang spesifik pada log ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full max-w-4xl mx-auto">
      {changes.map(key => {
        let oldVal = oldData?.[key];
        let newVal = newData?.[key];

        // Format kalau datanya bentuk Array (kayak tagging rekan)
        if (Array.isArray(oldVal)) oldVal = oldVal.length > 0 ? oldVal.join(', ') : "Kosong";
        if (Array.isArray(newVal)) newVal = newVal.length > 0 ? newVal.join(', ') : "Kosong";

        return (
          <div key={key} className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* Label Kolom */}
            <div className="md:w-1/4 flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 shrink-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {translateKey(key)}
              </span>
            </div>

            {/* Value Before - After */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden">
              
              {/* Box Data Lama (Jika Update/Hapus) */}
              {oldData && (
                <div className="flex-1 bg-rose-50/50 border border-rose-100 px-3 py-2 rounded-lg flex flex-col justify-center min-w-0">
                  <span className="text-[9px] uppercase font-bold text-rose-400 block mb-0.5">Data Sebelumnya:</span>
                  <span className="text-xs text-rose-600 line-through break-all font-medium truncate">
                    {String(oldVal ?? "Kosong / Null")}
                  </span>
                </div>
              )}

              {/* Panah (Muncul kalau Update) */}
              {oldData && newData && (
                <i className="fa-solid fa-arrow-right text-slate-300 text-[10px] shrink-0 self-center hidden sm:block"></i>
              )}

              {/* Box Data Baru (Jika Update/Create) */}
              {newData && (
                <div className="flex-1 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-lg flex flex-col justify-center min-w-0">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5">Data Sesudahnya:</span>
                  <span className="text-xs text-emerald-700 font-bold break-all truncate">
                    {String(newVal ?? "Kosong / Null")}
                  </span>
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
};

const AuditLog = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const isPinkTheme = isSuperAdmin;
  const isDarkBlueTheme = isAdmin && !isSuperAdmin;

  // ── STATE FILTER & PAGINATION CRUCIAL ──
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // ── TANSTACK QUERY: Otomatis Fetch Tiap Parameter Berubah ──
  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ["auditLogs", page, search, dateFilter],
    queryFn: async () => {
      const params = { page };
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get("/audit-logs", { params });
      return res.data || {};
    },
    staleTime: 15 * 1000, // Cache aman selama 15 detik untuk data log real-time
    placeholderData: (previousData) => previousData, // Jalur cepat: Anti-blink pas ganti halaman
  });

  // ── DERIVED STATE DARI SERVER PAYLOAD ──
  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.last_page || 1;
  const currentPage = data?.current_page || 1;

  // Reset ke halaman 1 kalau filter pencarian atau tanggal berubah
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateFilter("");
    setPage(1);
  };

  // ── BADGE STYLING HELPER ──
  const getActionBadge = (action = "") => {
    const act = action.toLowerCase();
    if (act.includes("login")) return { cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "fa-right-to-bracket" };
    if (act.includes("logout")) return { cls: "bg-slate-100 text-slate-600 border-slate-200", icon: "fa-right-from-bracket" };
    if (act.includes("hapus") || act.includes("delete")) return { cls: "bg-rose-50 text-rose-600 border-rose-200", icon: "fa-trash-can" };
    if (act.includes("lock") || act.includes("kunci")) return { cls: "bg-orange-50 text-orange-600 border-orange-200", icon: "fa-lock" };
    if (act.includes("unlock") || act.includes("buka")) return { cls: "bg-sky-50 text-sky-600 border-sky-200", icon: "fa-unlock" };
    if (act.includes("update") || act.includes("edit") || act.includes("ubah") || act.includes("profil")) return { cls: "bg-amber-50 text-amber-600 border-amber-200", icon: "fa-pen-to-square" };
    if (act.includes("role") || act.includes("promote") || act.includes("kasta")) return { cls: "bg-purple-50 text-purple-600 border-purple-200", icon: "fa-crown" };
    if (act.includes("tambah") || act.includes("create") || act.includes("register")) return { cls: "bg-teal-50 text-teal-600 border-teal-200", icon: "fa-plus-circle" };
    return { cls: "bg-blue-50 text-blue-600 border-blue-200", icon: "fa-bolt" };
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* HERO SECTION & FILTER */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 ${
        isPinkTheme 
          ? "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-300 shadow-pink-200/50" 
          : "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20 shadow-2xl"
      }`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-white/40" : "bg-blue-500/20"}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-rose-100/30" : "bg-sky-500/10"}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-white/10">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm ${
                isPinkTheme ? "bg-white/20 border-white/40 text-white" : "bg-white/10 border-white/20 text-white"
              }`}>
                <i className="fa-solid fa-shield-halved text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border ${
                isPinkTheme ? "text-pink-50 bg-white/20 border-pink-200" : "text-blue-200 bg-white/10 border-white/10"
              }`}>
                System Security Monitor
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">Audit Log.</h1>
            <p className={`text-sm font-medium leading-relaxed ${isPinkTheme ? "text-pink-50" : "text-blue-100/70"}`}>
              Seluruh aktivitas sistem tercatat di sini secara real-time. Lacak perubahan, login, dan aksi user.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white shadow-sm backdrop-blur-sm">
                <i className="fa-solid fa-server text-[10px]" />
                <span className="text-[10px] font-black uppercase tracking-wider">Database Synced</span>
              </div>
            </div>
          </div>

          {/* Widget Status */}
          <div className="w-full lg:w-80 shrink-0 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5 shadow-lg">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 border-[3px] border-white/10 rounded-full animate-[spin_2s_linear_infinite] ${isPinkTheme ? "border-t-pink-200" : "border-t-blue-300"}`} />
              <div className={`absolute inset-1.5 border-[3px] border-white/10 rounded-full animate-[spin_3s_linear_infinite_reverse] ${isPinkTheme ? "border-b-white" : "border-b-sky-400"}`} />
              <i className="fa-solid fa-shield-halved text-white text-xl animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-center gap-2.5 bg-black/20 px-3 py-2 rounded-lg border border-white/10">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Logger Active</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 bg-black/20 px-3 py-2 rounded-lg border border-white/10">
                <i className={`fa-solid fa-list-check text-[10px] ${isPinkTheme ? "text-pink-300" : "text-blue-300"}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                  {total.toLocaleString()} Record{total !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Form Section */}
        <div className="p-6 sm:p-8 relative z-10 bg-black/10">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end w-full">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-2">Cari Aktivitas</label>
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors text-sm" />
                <input
                  type="text"
                  placeholder="Cari admin, aksi, atau target user..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 focus:ring-2 ${isPinkTheme ? "focus:ring-pink-400/50" : "focus:ring-blue-400/50"}`}
                />
              </div>
            </div>

            <div className="w-full md:w-52 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-2">Filter Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all [color-scheme:dark] focus:ring-2 ${isPinkTheme ? "focus:ring-pink-400/50" : "focus:ring-blue-400/50"}`}
              />
            </div>

            <div className="flex gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
              <button type="submit" className="flex-1 md:flex-none px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 hover:bg-slate-100">
                <i className="fa-solid fa-search" /> <span className="hidden sm:inline">Cari</span>
              </button>
              {(search || dateFilter) && (
                <button type="button" onClick={handleClearFilters} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/20 flex items-center justify-center gap-2">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
              <button
                type="button"
                onClick={() => queryClient.invalidateQueries(["auditLogs"])}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/20 flex items-center justify-center gap-2"
                title="Refresh"
              >
                <i className={`fa-solid fa-rotate ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TIMELINE TABLE */}
      <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isPinkTheme ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-slate-100 text-[#162447] border-slate-200"
            }`}>
              <i className="fa-solid fa-table-list text-sm" />
            </div>
            <h3 className="font-black text-slate-800 text-sm md:text-base">Event Timeline</h3>
          </div>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {loading ? "Memuat..." : `${total} total log`}
          </span>
        </div>

        <div className="overflow-x-auto w-full flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
                <th className="px-6 py-4 whitespace-nowrap">Target</th>
                <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-3 w-28 bg-slate-200 rounded" />
                          <div className="h-2 w-16 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-7 w-32 bg-slate-200 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="space-y-1.5"><div className="h-3 w-20 bg-slate-200 rounded" /><div className="h-2 w-14 bg-slate-100 rounded" /></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-slate-200 rounded-xl mx-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <i className="fa-solid fa-inbox text-3xl text-slate-300" />
                      </div>
                      <div>
                        <p className="font-black text-slate-500">Tidak ada log ditemukan.</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Coba ubah filter pencarian.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  const actorName = log.actor?.full_name || log.actor_name || "System";
                  const actorRole = log.actor?.role || log.actor_role || "system";
                  const targetName = log.target?.full_name || log.target_name || "—";
                  const isExpanded = expandedRow === idx;

                  return (
                    <React.Fragment key={log.id || idx}>
                      <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
                              {actorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 whitespace-nowrap truncate">{actorName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{actorRole}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border whitespace-nowrap shadow-sm ${badge.cls}`}>
                            <i className={`fa-solid ${badge.icon}`} />
                            {(log.action || "System").replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-600 whitespace-nowrap truncate block max-w-[180px]">{targetName}</span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-[11px] font-black text-slate-700 whitespace-nowrap">{formatDate(log.created_at)}</p>
                          <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5">{formatTime(log.created_at)}</p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {(log.new_values || log.old_values) && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center mx-auto transition-all text-xs shadow-sm ${isExpanded
                                  ? isPinkTheme ? "bg-pink-100 border-pink-200 text-pink-600" : "bg-blue-100 border-blue-200 text-blue-600"
                                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              title="Lihat detail perubahan"
                            >
                              <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`} />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Detail JSON Perubahan Data */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-y border-slate-200 shadow-inner">
                          <td colSpan="5" className="px-4 sm:px-6 py-6">
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2 max-w-4xl mx-auto">
                                <i className="fa-solid fa-file-invoice"></i> Rincian Perubahan Log
                              </h4>
                              {renderDataChanges(log.old_values, log.new_values)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {!loading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-slate-500 text-center sm:text-left">
              Halaman <span className="text-slate-800 font-black">{currentPage}</span> dari{" "}
              <span className="text-slate-800 font-black">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-sm"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all text-xs font-black shadow-sm"
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="text-slate-400 text-xs font-bold px-1">···</span>}
                </>
              )}

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border text-xs font-black transition-all shadow-sm ${
                    p === currentPage
                      ? isPinkTheme 
                          ? "bg-pink-600 text-white border-pink-600 shadow-pink-500/30" 
                          : "bg-[#162447] text-white border-[#162447] shadow-[#162447]/30"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="text-slate-400 text-xs font-bold px-1">···</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all text-xs font-black shadow-sm"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-sm"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;