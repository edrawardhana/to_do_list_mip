import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

const Pagination = ({ page, totalPages, onChange, isDark }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
        const isEdge = p === 1 || p === totalPages;
        const isNear = Math.abs(p - page) <= 1;
        if (!isEdge && !isNear) {
          if (p === 2 || p === totalPages - 1) return <span key={p} className={`text-xs sm:text-sm px-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>…</span>;
          return null;
        }
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold border transition-all shadow-sm ${
              p === page
                ? (isDark ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20 scale-105" : "bg-blue-600 text-white border-blue-600 shadow-blue-500/20 scale-105")
                : (isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            }`}
          >{p}</button>
        );
      })}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

const Approval = () => {
  const { user, isDeveloper, isSuperAdmin } = useAuth();
  const myDivisionName = user?.division?.name || user?.division_name || "Admin Divisi";
  
  // ==========================================
  // LOGIC WARNA TEMA DINAMIS
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  
  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/20",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" : "bg-white/10 border-white/10 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: isDeveloperTheme ? "text-white" : isPurpleTheme ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200" : "text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" : "bg-blue-900/30 border-blue-700/50",
    
    // Main Tabs (Pengisi Whitespace)
    mainTabActive: "bg-white text-slate-900 shadow-md",
    mainTabInactive: "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white",
    
    // Toolbar Lantai Hero
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",

    // Card & Content
    cardBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 hover:border-zinc-600" : "bg-white border-slate-200 hover:border-blue-200",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    btnAcc: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 text-white" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white",
    btnReject: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-rose-500 hover:bg-rose-500/10" : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50",
  };

  const [activeTab, setActiveTab] = useState("tasks");
  const [loading, setLoading]     = useState(true);
  const [pendingTasks, setPendingTasks]   = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  
  const [rejectState, setRejectState]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [taskPage, setTaskPage]   = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [search, setSearch]       = useState("");

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.all([
        api.get('/daily-tasks'),
        api.get('/exceptions'),
      ]);
      const tData = tRes.data?.data || tRes.data || [];
      const lData = lRes.data?.data || lRes.data || [];

      setPendingTasks(
        tData.filter(t => t.status === 'pending').map(t => ({
          ...t,
          internName:          t.uploader?.full_name || "Intern",
          division:            t.uploader?.division?.name || t.division?.name || "—",
          taskTitle:           t.taskTemplate?.title || t.template?.title || t.custom_title || "Tugas Harian",
          notes:               t.description,
          photo:               t.evidence_url,
          submittedAt:         t.created_at,
          participants_detail: t.participants_detail || [],
        }))
      );
      setPendingLeaves(
        lData.filter(l => l.status === 'pending').map(l => ({
          ...l,
          internName: l.user?.full_name || "Intern",
          division:   l.user?.division?.name || "—",
          reason:     l.description,
          dateReq:    l.permission_date,
          proof:      l.evidence_url,
          type:       l.type
        }))
      );
    } catch {
      toast.error("Gagal memuat data approval");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  // Reset page on tab or search change
  useEffect(() => { 
    setTaskPage(1); 
    setLeavePage(1); 
  }, [activeTab, search]);

  // Filter Data
  const searchQ = search.toLowerCase();
  const filteredTasks = pendingTasks.filter(t =>
    !search || t.internName.toLowerCase().includes(searchQ) || t.taskTitle.toLowerCase().includes(searchQ)
  );
  const filteredLeaves = pendingLeaves.filter(l =>
    !search || l.internName.toLowerCase().includes(searchQ) || l.type?.toLowerCase().includes(searchQ)
  );
  
  const taskTotalPages  = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const leaveTotalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const pagedTasks  = filteredTasks.slice((taskPage - 1) * PAGE_SIZE, taskPage * PAGE_SIZE);
  const pagedLeaves = filteredLeaves.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE);

  // Handlers
  const handleActionTask = async (id, action) => {
    if (action === 'reject') { setRejectState({ id, type: 'task' }); setRejectReason(""); return; }
    try {
      await api.put(`/daily-tasks/${id}`, { status: 'approved' });
      toast.success("✅ Tugas berhasil di-ACC");
      fetchApprovals();
    } catch { toast.error("Gagal memproses tugas"); }
  };

  const handleActionLeave = async (id, action) => {
    if (action === 'reject') { setRejectState({ id, type: 'leave' }); setRejectReason(""); return; }
    try {
      await api.put(`/exceptions/${id}`, { status: 'approved' });
      toast.success("✅ Izin berhasil di-ACC");
      fetchApprovals();
    } catch { toast.error("Gagal memproses izin"); }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) { toast.error("Masukkan alasan penolakan"); return; }
    try {
      if (rejectState.type === 'task')
        await api.put(`/daily-tasks/${rejectState.id}`, { status: 'rejected', reject_reason: rejectReason });
      else
        await api.put(`/exceptions/${rejectState.id}`, { status: 'rejected', description: rejectReason });
      
      toast.success("Berhasil diproses");
      setRejectState(null);
      fetchApprovals();
    } catch { toast.error("Gagal memproses penolakan"); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";

  const exStyle = (type) => ({
    swap_shift:  { icon: "fa-code-compare",      color: isDeveloperTheme ? "text-blue-400" : "text-blue-600",    bg: isDeveloperTheme ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100",    label: "Swap Shift" },
    sakit:       { icon: "fa-house-medical",      color: isDeveloperTheme ? "text-rose-400" : "text-rose-600",    bg: isDeveloperTheme ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100",    label: "Sakit" },
    izin:        { icon: "fa-envelope-open-text", color: isDeveloperTheme ? "text-amber-400" : "text-amber-600",   bg: isDeveloperTheme ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100",   label: "Izin" },
    tugas_luar:  { icon: "fa-briefcase",          color: isDeveloperTheme ? "text-emerald-400" : "text-emerald-600", bg: isDeveloperTheme ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100", label: "Tugas Luar" },
  }[type] || { icon: "fa-envelope", color: isDeveloperTheme ? "text-zinc-400" : "text-slate-500", bg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100", label: "Pengajuan" });

  const isImg = (url) => typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (RESPONSIVE NO WHITESPACE)                             */}
      {/* ================================================================= */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8">
          
          {/* KOLOM KIRI */}
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-check-to-slot text-sm sm:text-lg md:text-xl" />
              </div>
              <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Approval Center
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-2 sm:mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Validasi & ACC.
            </h1>
            <p className={`text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Kelola antrean tugas harian dan pengajuan izin dari anak magang divisi Anda.
            </p>

            {/* 🔥 MAIN TABS (Mobile Scrollable) - Mengisi Whitespace */}
            <div className="mt-5 sm:mt-6 md:mt-8 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-nowrap w-full max-w-full pb-1 sm:pb-0">
              {[
                { id: "tasks",  label: "Laporan Tugas",  icon: "fa-list-check", count: pendingTasks.length },
                { id: "leaves", label: "Pengajuan Izin", icon: "fa-envelope-open-text", count: pendingLeaves.length },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl text-[10px] sm:text-[11px] md:text-[13px] font-bold transition-all border whitespace-nowrap shrink-0 ${
                    activeTab === tab.id ? theme.mainTabActive : theme.mainTabInactive
                  }`}>
                  <i className={`fa-solid ${tab.icon}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full ml-1 ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-black/30 text-white'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* KOLOM KANAN (Stats Widget) - FIX: h-fit lg:self-center */}
          <div className={`w-full lg:w-80 shrink-0 h-fit lg:self-center rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md flex flex-col gap-3 sm:gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 sm:pb-3">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Antrean Pending</span>
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 sm:py-1 rounded-md">{isSuperAdmin || isDeveloper ? "Global" : myDivisionName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-amber-400 mb-0.5 sm:mb-1">Laporan Tugas</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{pendingTasks.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-rose-400 mb-0.5 sm:mb-1">Pengajuan Izin</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{pendingLeaves.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 TOOLBAR LANTAI HERO: SEARCH & REFRESH (RESPONSIVE) */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          <div className="relative w-full sm:max-w-xs md:max-w-sm lg:w-80 shrink-0 group">
            <i className={`fa-solid fa-magnifying-glass absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder={`Cari di ${activeTab === 'tasks' ? 'laporan' : 'izin'}...`} value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium outline-none border transition-colors shadow-sm ${theme.inputBg}`} />
          </div>

          <button onClick={fetchApprovals} 
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-black transition-all active:scale-95 shadow-sm border shrink-0 ${
              isDeveloperTheme ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : isPurpleTheme ? 'bg-purple-800 border-purple-600 text-purple-100 hover:bg-purple-700' : 'bg-blue-800 border-blue-600 text-blue-100 hover:bg-blue-700'
            }`}>
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CONTENT LIST (RESPONSIVE GRID)                                      */}
      {/* ================================================================= */}
      <div className="pt-2 sm:pt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[0,1,2,3,4,5].map(i => <div key={i} className={`h-48 sm:h-56 rounded-2xl sm:rounded-[2rem] border animate-pulse ${theme.cardBg}`} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* ── TAB TUGAS ── */}
            {activeTab === "tasks" && (
              filteredTasks.length === 0 ? (
                <div className="col-span-full py-16 sm:py-20 text-center opacity-40">
                  <i className={`fa-solid fa-mug-hot text-4xl sm:text-5xl mb-3 sm:mb-4 ${theme.textSecondary}`} />
                  <h3 className={`font-black text-base sm:text-lg ${theme.textPrimary}`}>Antrean Bersih</h3>
                  <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textSecondary}`}>Semua tugas sudah diperiksa.</p>
                </div>
              ) : (
                pagedTasks.map(task => (
                  <div key={task.id} className={`rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 ${theme.cardBg}`}>
                    {/* Header Card */}
                    <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${isDeveloperTheme ? 'border-zinc-800 bg-[#141417]/50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                          {task.internName.charAt(0)}
                        </div>
                        <div>
                          <h4 className={`font-bold text-xs sm:text-sm leading-tight truncate max-w-[120px] sm:max-w-[150px] ${theme.textPrimary}`}>{task.internName}</h4>
                          <p className={`text-[9px] sm:text-[10px] font-medium ${theme.textSecondary}`}>{task.division}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-lg border shadow-sm shrink-0 ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-white border-slate-200 text-slate-400'}`}>{fmt(task.submittedAt)}</span>
                    </div>

                    {/* Body Card */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <h5 className={`font-black mb-3 text-xs sm:text-sm line-clamp-2 ${theme.textPrimary}`}>{task.taskTitle}</h5>
                      
                      <div className={`w-full h-32 sm:h-40 rounded-xl mb-4 overflow-hidden border flex items-center justify-center relative shadow-inner shrink-0 ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                        {task.photo ? (
                          isImg(task.photo) 
                            ? <img src={task.photo} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <a href={task.photo} target="_blank" rel="noreferrer" className={`flex flex-col items-center gap-2 ${isDeveloperTheme ? 'text-emerald-500 hover:text-emerald-400' : 'text-blue-500 hover:text-blue-600'}`}>
                                <i className="fa-solid fa-file text-2xl sm:text-3xl" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase">Lihat File</span>
                              </a>
                        ) : (
                          <div className={`text-center ${theme.textSecondary}`}>
                            <i className="fa-solid fa-image-slash text-2xl sm:text-3xl mb-1 block opacity-50" />
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50">Tanpa Bukti</p>
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-[10px] sm:text-[11px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl border font-medium italic leading-relaxed line-clamp-3 mt-auto ${isDeveloperTheme ? 'bg-[#141417] border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        "{task.notes || 'Tidak ada catatan laporan.'}"
                      </p>
                    </div>

                    {/* Footer / Actions */}
                    <div className={`p-4 grid grid-cols-2 gap-2 sm:gap-3 border-t ${isDeveloperTheme ? 'border-zinc-800 bg-[#141417]/50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <button onClick={() => handleActionTask(task.id, 'reject')} className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold shadow-sm transition-all ${theme.btnReject}`}>
                        <i className="fa-solid fa-xmark mr-1" /> Revisi
                      </button>
                      <button onClick={() => handleActionTask(task.id, 'acc')} className={`py-2 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition-all active:scale-95 ${theme.btnAcc}`}>
                        <i className="fa-solid fa-check mr-1" /> ACC
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── TAB IZIN ── */}
            {activeTab === "leaves" && (
              filteredLeaves.length === 0 ? (
                <div className="col-span-full py-16 sm:py-20 text-center opacity-40">
                  <i className={`fa-solid fa-envelope-circle-check text-4xl sm:text-5xl mb-3 sm:mb-4 ${theme.textSecondary}`} />
                  <h3 className={`font-black text-base sm:text-lg ${theme.textPrimary}`}>Tidak Ada Pengajuan</h3>
                  <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textSecondary}`}>Semua perizinan sudah diproses.</p>
                </div>
              ) : (
                pagedLeaves.map(leave => {
                  const st = exStyle(leave.type);
                  return (
                    <div key={leave.id} className={`rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden flex flex-col group transition-all duration-300 relative ${theme.cardBg}`}>
                      {/* Baris Warna Samping */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-[2rem] ${st.bg.split(' ')[0]}`} />
                      
                      <div className={`p-5 sm:p-6 pl-6 sm:pl-8 flex-1 flex flex-col justify-between border-b ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 border ${st.bg} ${st.color}`}>
                              <i className={`fa-solid ${st.icon}`} />
                            </div>
                            <div>
                              <h4 className={`font-black text-xs sm:text-sm leading-none mb-1 ${theme.textPrimary}`}>{leave.internName}</h4>
                              <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>{leave.division}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                             <span className={`px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${st.bg} ${st.color}`}>{st.label}</span>
                             <span className={`text-[9px] sm:text-[10px] font-bold ${theme.textSecondary}`}><i className="fa-regular fa-calendar" /> {fmt(leave.dateReq)}</span>
                          </div>
                          
                          <p className={`text-[10px] sm:text-[11px] font-medium leading-relaxed p-2.5 sm:p-3 rounded-lg sm:rounded-xl border italic line-clamp-3 ${isDeveloperTheme ? 'bg-[#141417] border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            "{leave.reason || 'Tidak ada keterangan.'}"
                          </p>
                        </div>
                      </div>

                      {/* Footer Bukti & Action */}
                      <div className={`p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 ${isDeveloperTheme ? 'bg-[#141417]/50' : 'bg-slate-50/50'}`}>
                        <div className="w-full sm:w-20 shrink-0">
                          {leave.proof ? (
                            <a href={leave.proof} target="_blank" rel="noreferrer" className={`w-full sm:w-20 h-20 rounded-xl border overflow-hidden block relative group/img shadow-sm ${isDeveloperTheme ? 'border-zinc-700' : 'border-slate-200'}`}>
                              {isImg(leave.proof) 
                                ? <img src={leave.proof} alt="Bukti" className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                                : <div className={`w-full h-full flex flex-col items-center justify-center ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-400'}`}><i className="fa-solid fa-file text-xl mb-1"/><span className="text-[8px] font-bold">Dokumen</span></div>
                              }
                            </a>
                          ) : (
                            <div className={`w-full sm:w-20 h-20 rounded-xl border flex flex-col items-center justify-center opacity-50 ${isDeveloperTheme ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-400'}`}>
                              <i className="fa-solid fa-file-circle-xmark text-xl mb-1" />
                              <span className="text-[8px] font-bold uppercase">No File</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-row sm:flex-col gap-2 w-full">
                          <button onClick={() => handleActionLeave(leave.id, 'acc')} className={`flex-1 sm:w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition-all active:scale-95 ${theme.btnAcc}`}>
                            <i className="fa-solid fa-check mr-1" /> ACC
                          </button>
                          <button onClick={() => handleActionLeave(leave.id, 'reject')} className={`flex-1 sm:w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${theme.btnReject}`}>
                            Tolak
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

        <div className="mt-4 sm:mt-6">
          <Pagination 
            page={activeTab === 'tasks' ? taskPage : leavePage} 
            totalPages={activeTab === 'tasks' ? taskTotalPages : leaveTotalPages} 
            onChange={activeTab === 'tasks' ? setTaskPage : setLeavePage} 
            isDark={isDeveloperTheme} 
          />
        </div>
      </div>

      {/* ── REJECT MODAL ─────────────────────────────────────────────────── */}
      {rejectState && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div className={`w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl border p-6 sm:p-8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 ${isDeveloperTheme ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg sm:text-xl font-black mb-2 flex items-center gap-2 ${isDeveloperTheme ? 'text-zinc-200' : 'text-slate-800'}`}>
              <i className="fa-solid fa-triangle-exclamation text-rose-500" />
              {rejectState.type === 'task' ? 'Kembalikan untuk Revisi' : 'Tolak Pengajuan Izin'}
            </h3>
            <p className={`text-xs sm:text-sm mb-4 sm:mb-5 ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-500'}`}>Tulis alasan yang akan dilihat intern di logbook mereka.</p>
            
            <textarea
              rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Contoh: Foto bukti tidak terlihat jelas, harap upload ulang..."
              className={`w-full border rounded-xl p-3 sm:p-4 text-xs sm:text-sm outline-none transition-colors resize-none ${isDeveloperTheme ? 'bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-rose-400'}`}
            />
            
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5 pt-2 border-t border-slate-500/10">
              <button onClick={() => setRejectState(null)} className={`flex-1 py-3 rounded-xl border font-bold text-xs sm:text-sm transition-colors ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Batal
              </button>
              <button onClick={handleConfirmReject} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all active:scale-95">
                <i className="fa-solid fa-paper-plane mr-1" /> Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;