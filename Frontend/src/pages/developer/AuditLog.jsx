import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 15;

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  // -----------------------------------------------
  // Fetch data dari Laravel API
  // -----------------------------------------------
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get("/audit-logs", { params });
      const body = res.data;

      setLogs(body.data || []);
      setTotal(body.total || 0);
      setTotalPages(body.last_page || 1);
      setCurrentPage(body.current_page || 1);
    } catch (err) {
      toast.error("Gagal mengambil audit log");
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateFilter("");
  };

  // -----------------------------------------------
  // Badge styling per action
  // -----------------------------------------------
  const getActionBadge = (action = "") => {
    const act = action.toLowerCase();
    if (act.includes("login")) return { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "fa-right-to-bracket" };
    if (act.includes("logout")) return { cls: "bg-zinc-600/30 text-zinc-400 border-zinc-600/40", icon: "fa-right-from-bracket" };
    if (act.includes("hapus") || act.includes("delete")) return { cls: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: "fa-trash-can" };
    if (act.includes("lock") || act.includes("kunci")) return { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "fa-lock" };
    if (act.includes("unlock") || act.includes("buka")) return { cls: "bg-sky-500/15 text-sky-400 border-sky-500/30", icon: "fa-unlock" };
    if (act.includes("update") || act.includes("edit") || act.includes("ubah") || act.includes("profil")) return { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: "fa-pen-to-square" };
    if (act.includes("role") || act.includes("promote") || act.includes("kasta")) return { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "fa-crown" };
    if (act.includes("tambah") || act.includes("create") || act.includes("register")) return { cls: "bg-teal-500/15 text-teal-400 border-teal-500/30", icon: "fa-plus-circle" };
    return { cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", icon: "fa-bolt" };
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

  // -----------------------------------------------
  // Pagination helpers
  // -----------------------------------------------
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO HEADER (Aesthetics by Developer Dashboard)                     */}
      {/* ================================================================= */}
      <div className="bg-[#09090b] rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col text-white">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Content Top */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-zinc-800">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner shrink-0">
                <i className="fa-solid fa-shield-halved text-xl" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                System Security Monitor
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              Audit Log.
            </h1>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Seluruh aktivitas sistem tercatat di sini secara real-time. Lacak perubahan, login, dan aksi user.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <i className="fa-solid fa-server text-[10px]" />
                <span className="text-[10px] font-black uppercase tracking-wider">Database Synced</span>
              </div>
            </div>
          </div>

          {/* Widget Kanan */}
          <div className="w-full lg:w-80 shrink-0 bg-zinc-900/50 border border-zinc-800/60 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 border-[3px] border-zinc-800 border-t-zinc-400 rounded-full animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-1.5 border-[3px] border-zinc-800 border-b-indigo-500 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
              <i className="fa-solid fa-shield-halved text-zinc-200 text-xl animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-center gap-2.5 bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Logger Active</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800">
                <i className="fa-solid fa-list-check text-[10px] text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  {total.toLocaleString()} Record{total !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-6 sm:p-8 relative z-10 bg-zinc-900/30">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end w-full">
            {/* Search */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
                Cari Aktivitas
              </label>
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors text-sm" />
                <input
                  type="text"
                  placeholder="Cari admin, aksi, atau target user..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-52 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
                Filter Tanggal
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 outline-none transition-all [color-scheme:dark]"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.08)] active:scale-95"
              >
                <i className="fa-solid fa-search" /> <span className="hidden sm:inline">Cari</span>
              </button>
              {(search || dateFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm font-bold transition-all border border-zinc-700 flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchData(currentPage)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm font-bold transition-all border border-zinc-700 flex items-center justify-center gap-2"
                title="Refresh"
              >
                <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TABEL LOG                                                           */}
      {/* ================================================================= */}
      <div className="rounded-[2rem] bg-[#0f0f11] border border-zinc-800 shadow-2xl overflow-hidden">

        {/* Table Header Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <i className="fa-solid fa-table-list text-xs text-zinc-400" />
            </div>
            <h3 className="font-black text-zinc-200 text-sm">Event Timeline</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            {loading ? "Memuat..." : `${total} total log`}
          </span>
        </div>

        {/* Pembungkus agar scrollable di HP */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-[#18181b]">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
                <th className="px-6 py-4 whitespace-nowrap">Target</th>
                <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-zinc-800 rounded" />
                          <div className="h-2 w-16 bg-zinc-900 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-32 bg-zinc-800 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-3 w-24 bg-zinc-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="space-y-1"><div className="h-3 w-20 bg-zinc-800 rounded" /><div className="h-2 w-14 bg-zinc-900 rounded" /></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-7 w-7 bg-zinc-800 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <i className="fa-solid fa-inbox text-2xl text-zinc-700" />
                      </div>
                      <div>
                        <p className="font-black text-zinc-400">Tidak ada log ditemukan.</p>
                        <p className="text-xs text-zinc-600 font-medium mt-1">Coba ubah filter pencarian.</p>
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
                      <tr className="hover:bg-zinc-800/30 transition-colors group">
                        {/* Actor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${badge.cls}`}>
                              {actorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-zinc-200 whitespace-nowrap truncate">{actorName}</p>
                              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{actorRole}</p>
                            </div>
                          </div>
                        </td>

                        {/* Aksi Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${badge.cls}`}>
                            <i className={`fa-solid ${badge.icon}`} />
                            {(log.action || "System").replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-zinc-400 whitespace-nowrap truncate block max-w-[150px]">{targetName}</span>
                        </td>

                        {/* Waktu */}
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-black text-zinc-300 whitespace-nowrap">{formatDate(log.created_at)}</p>
                          <p className="text-[10px] font-bold text-zinc-600 whitespace-nowrap">{formatTime(log.created_at)}</p>
                        </td>

                        {/* Toggle Detail */}
                        <td className="px-6 py-4 text-center">
                          {(log.new_values || log.old_values) && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all text-xs ${isExpanded
                                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                                  : "bg-zinc-800/50 border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:border-zinc-500"
                                }`}
                              title="Lihat detail perubahan"
                            >
                              <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`} />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-[#09090b]">
                          <td colSpan="5" className="px-4 sm:px-6 py-4 border-t border-zinc-800/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.old_values && Object.keys(log.old_values).length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-minus" /> Sebelum
                                  </p>
                                  <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-[10px] font-mono text-zinc-400 overflow-x-auto leading-relaxed">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && Object.keys(log.new_values).length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-plus" /> Sesudah
                                  </p>
                                  <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-[10px] font-mono text-zinc-400 overflow-x-auto leading-relaxed">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
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

        {/* ================================================================= */}
        {/* PAGINATION                                                          */}
        {/* ================================================================= */}
        {!loading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-zinc-800 bg-[#18181b] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info */}
            <p className="text-[11px] font-bold text-zinc-600 text-center sm:text-left">
              Halaman <span className="text-zinc-400">{currentPage}</span> dari{" "}
              <span className="text-zinc-400">{totalPages}</span>
            </p>

            {/* Page Controls */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Prev */}
              <button
                onClick={() => fetchData(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              {/* First page if needed */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => fetchData(1)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-all text-xs font-bold"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="text-zinc-700 text-xs font-bold px-1">···</span>
                  )}
                </>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => fetchData(p)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border text-xs font-black transition-all ${p === currentPage
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                >
                  {p}
                </button>
              ))}

              {/* Last page if needed */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="text-zinc-700 text-xs font-bold px-1">···</span>
                  )}
                  <button
                    onClick={() => fetchData(totalPages)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-all text-xs font-bold"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next */}
              <button
                onClick={() => fetchData(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
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