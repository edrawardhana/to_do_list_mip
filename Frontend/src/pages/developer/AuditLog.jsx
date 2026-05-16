import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 15;

const AuditLog = () => {
  const { isDeveloper, isSuperAdmin, isAdmin } = useAuth();

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO & TABEL)
  // ==========================================
  const isDeveloperTheme = isDeveloper; 
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; 
  const isBlueTheme = isAdmin && !isSuperAdmin && !isDeveloperTheme; 

  const theme = {
    // --- HERO THEME ---
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#242b4d] border-[#303861] shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/20",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-blue-500/20 border-blue-400/30 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" 
      : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" 
      : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: isDeveloperTheme ? "text-white" 
      : isPurpleTheme ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200" 
      : "text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    widgetRing1: isDeveloperTheme ? "border-zinc-800 border-t-zinc-400" : isPurpleTheme ? "border-purple-800 border-t-purple-400" : "border-blue-800 border-t-blue-400",
    widgetRing2: isDeveloperTheme ? "border-zinc-800 border-b-indigo-500" : isPurpleTheme ? "border-purple-800 border-b-fuchsia-500" : "border-blue-800 border-b-sky-500",
    widgetIcon: isDeveloperTheme ? "text-zinc-200" : isPurpleTheme ? "text-purple-200" : "text-blue-200",
    statBox: isDeveloperTheme ? "bg-zinc-900/80 border-zinc-800" : isPurpleTheme ? "bg-purple-950/80 border-purple-800" : "bg-blue-950/80 border-blue-800",
    statIcon: isDeveloperTheme ? "text-indigo-400" : isPurpleTheme ? "text-fuchsia-400" : "text-sky-400",
    statText: isDeveloperTheme ? "text-zinc-300" : isPurpleTheme ? "text-purple-200" : "text-blue-200",
    filterWrap: isDeveloperTheme ? "bg-zinc-900/30 border-t border-zinc-800" : isPurpleTheme ? "bg-purple-950/40 border-t border-purple-800/50" : "bg-blue-950/40 border-t border-blue-800/50",
    inputBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 placeholder:text-zinc-600 text-zinc-200" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] hover:border-purple-500 focus:border-purple-400 placeholder:text-purple-400/50 text-white" 
      : "bg-[#242b4d] border-[#303861] hover:border-blue-500 focus:border-blue-400 placeholder:text-blue-400/50 text-white",
    
    // --- TABLE THEME ---
    tableWrap: isDeveloperTheme ? "bg-[#0f0f11] border-zinc-800" : "bg-white border-slate-200",
    tableHeadBar: isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-slate-50/50 border-slate-100",
    tableIconBox: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400" : isPurpleTheme ? "bg-purple-600 text-white border-purple-600" : "bg-blue-600 text-white border-blue-600",
    tableTitle: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    tableBadge: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-600" : "bg-white border-slate-200 text-slate-500",
    thBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-600" : "bg-white border-slate-100 text-slate-400",
    trHover: isDeveloperTheme ? "hover:bg-zinc-800/30" : "hover:bg-slate-50/80",
    trBorder: isDeveloperTheme ? "divide-zinc-800/60" : "divide-slate-100",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-400" : "text-slate-500",
    textMuted: isDeveloperTheme ? "text-zinc-600" : "text-slate-400",
    expandedBg: isDeveloperTheme ? "bg-[#09090b]" : "bg-slate-50/50",
    codeBg: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-slate-200 text-slate-600",
    chevronBtn: isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:border-zinc-500" 
                                 : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300",
    chevronActive: isDeveloperTheme ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                                    : isPurpleTheme ? "bg-purple-100 border-purple-200 text-purple-600" : "bg-blue-100 border-blue-200 text-blue-600",
    
    // --- PAGINATION & SKELETON ---
    pageWrap: isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-slate-50/50 border-slate-200",
    pageBtn: isDeveloperTheme ? "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200" 
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
    pageBtnActive: isDeveloperTheme ? "bg-zinc-100 text-zinc-900 border-zinc-100" 
                                    : isPurpleTheme ? "bg-purple-600 text-white border-purple-600" : "bg-blue-600 text-white border-blue-600",
    pageDots: isDeveloperTheme ? "text-zinc-700" : "text-slate-300",
    skeleton1: isDeveloperTheme ? "bg-zinc-800" : "bg-slate-200",
    skeleton2: isDeveloperTheme ? "bg-zinc-900" : "bg-slate-100",
    emptyBox: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-700" : "bg-slate-50 border-slate-200 text-slate-300"
  };

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
  // Badge styling per action (Support Light/Dark)
  // -----------------------------------------------
  const getActionBadge = (action = "") => {
    const act = action.toLowerCase();
    
    // Palet warna yang support Light Mode / Dark Mode
    const palette = {
      emerald: isDeveloperTheme ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-600 border-emerald-200",
      zinc: isDeveloperTheme ? "bg-zinc-600/30 text-zinc-400 border-zinc-600/40" : "bg-slate-100 text-slate-600 border-slate-200",
      rose: isDeveloperTheme ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-rose-50 text-rose-600 border-rose-200",
      orange: isDeveloperTheme ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-orange-50 text-orange-600 border-orange-200",
      sky: isDeveloperTheme ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-sky-50 text-sky-600 border-sky-200",
      amber: isDeveloperTheme ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-600 border-amber-200",
      purple: isDeveloperTheme ? "bg-purple-500/15 text-purple-400 border-purple-500/30" : "bg-purple-50 text-purple-600 border-purple-200",
      teal: isDeveloperTheme ? "bg-teal-500/15 text-teal-400 border-teal-500/30" : "bg-teal-50 text-teal-600 border-teal-200",
      indigo: isDeveloperTheme ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" : "bg-indigo-50 text-indigo-600 border-indigo-200",
    };

    if (act.includes("login")) return { cls: palette.emerald, icon: "fa-right-to-bracket" };
    if (act.includes("logout")) return { cls: palette.zinc, icon: "fa-right-from-bracket" };
    if (act.includes("hapus") || act.includes("delete")) return { cls: palette.rose, icon: "fa-trash-can" };
    if (act.includes("lock") || act.includes("kunci")) return { cls: palette.orange, icon: "fa-lock" };
    if (act.includes("unlock") || act.includes("buka")) return { cls: palette.sky, icon: "fa-unlock" };
    if (act.includes("update") || act.includes("edit") || act.includes("ubah") || act.includes("profil")) return { cls: palette.amber, icon: "fa-pen-to-square" };
    if (act.includes("role") || act.includes("promote") || act.includes("kasta")) return { cls: palette.purple, icon: "fa-crown" };
    if (act.includes("tambah") || act.includes("create") || act.includes("register")) return { cls: palette.teal, icon: "fa-plus-circle" };
    return { cls: palette.indigo, icon: "fa-bolt" };
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
      {/* HERO HEADER (DYNAMIC THEME)                                         */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        {/* Content Top */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-shield-halved text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                System Security Monitor
              </span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight transition-colors duration-500 ${theme.title}`}>
              Audit Log.
            </h1>
            <p className={`text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Seluruh aktivitas sistem tercatat di sini secara real-time. Lacak perubahan, login, dan aksi user.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors duration-500 ${theme.statBox}`}>
                <i className={`fa-solid fa-server text-[10px] ${theme.statIcon}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${theme.statText}`}>Database Synced</span>
              </div>
            </div>
          </div>

          {/* Widget Kanan */}
          <div className={`w-full lg:w-80 shrink-0 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5 transition-colors duration-500 border ${theme.widgetBg}`}>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 border-[3px] rounded-full animate-[spin_2s_linear_infinite] transition-colors duration-500 ${theme.widgetRing1}`} />
              <div className={`absolute inset-1.5 border-[3px] rounded-full animate-[spin_3s_linear_infinite_reverse] transition-colors duration-500 ${theme.widgetRing2}`} />
              <i className={`fa-solid fa-shield-halved text-xl animate-pulse transition-colors duration-500 ${theme.widgetIcon}`} />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className={`flex items-center justify-center gap-2.5 px-3 py-2 rounded-lg border transition-colors duration-500 ${theme.statBox}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.statText}`}>Logger Active</span>
              </div>
              <div className={`flex items-center justify-center gap-2.5 px-3 py-2 rounded-lg border transition-colors duration-500 ${theme.statBox}`}>
                <i className={`fa-solid fa-list-check text-[10px] ${theme.statIcon}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.statText}`}>
                  {total.toLocaleString()} Record{total !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`p-6 sm:p-8 relative z-10 transition-colors duration-500 ${theme.filterWrap}`}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end w-full">
            {/* Search */}
            <div className="flex-1 w-full">
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 transition-colors duration-500 ${theme.subtitle}`}>
                Cari Aktivitas
              </label>
              <div className="relative group">
                <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-500 text-sm ${theme.subtitle}`} />
                <input
                  type="text"
                  placeholder="Cari admin, aksi, atau target user..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none transition-colors duration-500 ${theme.inputBg}`}
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-52 shrink-0">
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 transition-colors duration-500 ${theme.subtitle}`}>
                Filter Tanggal
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors duration-500 [color-scheme:dark] ${theme.inputBg}`}
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
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${theme.statBox} hover:brightness-125`}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchData(currentPage)}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${theme.statBox} hover:brightness-125`}
                title="Refresh"
              >
                <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TABEL LOG (DYNAMIC LIGHT / DARK THEME)                              */}
      {/* ================================================================= */}
      <div className={`rounded-[2rem] border shadow-2xl overflow-hidden transition-colors duration-700 ${theme.tableWrap}`}>

        {/* Table Header Bar */}
        <div className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-4 transition-colors duration-500 ${theme.tableHeadBar}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-500 ${theme.tableIconBox}`}>
              <i className="fa-solid fa-table-list text-xs" />
            </div>
            <h3 className={`font-black text-sm transition-colors duration-500 ${theme.tableTitle}`}>Event Timeline</h3>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors duration-500 ${theme.tableBadge}`}>
            {loading ? "Memuat..." : `${total} total log`}
          </span>
        </div>

        {/* Pembungkus agar scrollable di HP */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className={`border-b text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${theme.thBg}`}>
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
                <th className="px-6 py-4 whitespace-nowrap">Target</th>
                <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Detail</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-500 ${theme.trBorder}`}>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${theme.skeleton1}`} />
                        <div className="space-y-1.5">
                          <div className={`h-3 w-28 rounded ${theme.skeleton1}`} />
                          <div className={`h-2 w-16 rounded ${theme.skeleton2}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className={`h-6 w-32 rounded-full ${theme.skeleton1}`} /></td>
                    <td className="px-6 py-4"><div className={`h-3 w-24 rounded ${theme.skeleton1}`} /></td>
                    <td className="px-6 py-4"><div className="space-y-1"><div className={`h-3 w-20 rounded ${theme.skeleton1}`} /><div className={`h-2 w-14 rounded ${theme.skeleton2}`} /></div></td>
                    <td className="px-6 py-4 text-center"><div className={`h-7 w-7 rounded-lg mx-auto ${theme.skeleton1}`} /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${theme.emptyBox}`}>
                        <i className="fa-solid fa-inbox text-2xl" />
                      </div>
                      <div>
                        <p className={`font-black ${theme.textSecondary}`}>Tidak ada log ditemukan.</p>
                        <p className={`text-xs font-medium mt-1 ${theme.textMuted}`}>Coba ubah filter pencarian.</p>
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
                      <tr className={`transition-colors group ${theme.trHover}`}>
                        {/* Actor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${theme.actorInitials}`}>
                              {actorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-black whitespace-nowrap truncate ${theme.textPrimary}`}>{actorName}</p>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>{actorRole}</p>
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
                          <span className={`text-sm font-bold whitespace-nowrap truncate block max-w-[150px] ${theme.textSecondary}`}>{targetName}</span>
                        </td>

                        {/* Waktu */}
                        <td className="px-6 py-4">
                          <p className={`text-[11px] font-black whitespace-nowrap ${theme.textPrimary}`}>{formatDate(log.created_at)}</p>
                          <p className={`text-[10px] font-bold whitespace-nowrap ${theme.textMuted}`}>{formatTime(log.created_at)}</p>
                        </td>

                        {/* Toggle Detail */}
                        <td className="px-6 py-4 text-center">
                          {(log.new_values || log.old_values) && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all text-xs ${isExpanded ? theme.chevronActive : theme.chevronBtn}`}
                              title="Lihat detail perubahan"
                            >
                              <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`} />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className={theme.expandedBg}>
                          <td colSpan="5" className={`px-4 sm:px-6 py-4 border-t ${theme.trBorder}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.old_values && Object.keys(log.old_values).length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-minus" /> Sebelum
                                  </p>
                                  <pre className={`rounded-xl p-4 text-[10px] font-mono overflow-x-auto leading-relaxed border ${theme.codeBg}`}>
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && Object.keys(log.new_values).length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-plus" /> Sesudah
                                  </p>
                                  <pre className={`rounded-xl p-4 text-[10px] font-mono overflow-x-auto leading-relaxed border ${theme.codeBg}`}>
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
          <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${theme.pageWrap}`}>
            {/* Info */}
            <p className={`text-[11px] font-bold text-center sm:text-left ${theme.textMuted}`}>
              Halaman <span className={theme.textSecondary}>{currentPage}</span> dari{" "}
              <span className={theme.textSecondary}>{totalPages}</span>
            </p>

            {/* Page Controls */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Prev */}
              <button
                onClick={() => fetchData(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs ${theme.pageBtn}`}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              {/* First page if needed */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => fetchData(1)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all text-xs font-bold ${theme.pageBtn}`}
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className={`text-xs font-bold px-1 ${theme.pageDots}`}>···</span>
                  )}
                </>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => fetchData(p)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border text-xs font-black transition-all ${p === currentPage ? theme.pageBtnActive : theme.pageBtn}`}
                >
                  {p}
                </button>
              ))}

              {/* Last page if needed */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className={`text-xs font-bold px-1 ${theme.pageDots}`}>···</span>
                  )}
                  <button
                    onClick={() => fetchData(totalPages)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all text-xs font-bold ${theme.pageBtn}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next */}
              <button
                onClick={() => fetchData(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs ${theme.pageBtn}`}
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