import React, { useState, useEffect, useMemo } from "react";
import InternTaskCard from "../../components/ui/InternTaskCard";
import LiveCameraModal from "../../components/ui/LiveCameraModal";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

/* ── Pagination ─────────────────────────────────────────────────────────── */
const Pager = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-6">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => {
        const show = p === 1 || p === total || Math.abs(p - page) <= 1;
        const dots = !show && (p === 2 || p === total - 1);
        if (!show && !dots) return null;
        if (dots) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold border shadow-sm transition-all ${p === page
              ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-blue-500/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {p}
          </button>
        );
      })}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────────────────── */
const InternTasks = () => {
  const { user, isDeveloper, isSuperAdmin } = useAuth(); 

  const currentUser = user ? {
    id:       user.id,
    name:     user.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.division?.name || "IT Support",
  } : { id: "1", name: "Intern", division: "IT Support" };

  const canSubmit = user?.role === 'intern';

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO SECTION)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  
  const theme = {
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
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    progressIcon: isDeveloperTheme ? "text-emerald-400" : isPurpleTheme ? "text-purple-400" : "text-blue-400",
    progressBarBg: isDeveloperTheme ? "bg-emerald-500" : isPurpleTheme ? "bg-purple-500" : "bg-blue-500",
    progressTrack: isDeveloperTheme ? "bg-zinc-950 border-zinc-800" : "bg-black/40 border-white/10",
    
    // --- MAIN TABS (DI BAWAH TEKS HERO) ---
    mainTabActive: "bg-white text-slate-900 shadow-md", // Tombol aktif selalu putih solid
    mainTabInactive: "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white", 
    mainBadgeActive: "bg-blue-100 text-blue-700",
    mainBadgeInactive: "bg-black/30 text-white/70",

    // --- TOOLBAR BAWAH & SUB TABS (HANYA MUNCUL DI HISTORY) ---
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]", // Background toolbar sedikit beda warna
    subTabActive: isDeveloperTheme ? "bg-emerald-500 text-white border-emerald-400 shadow-sm" : isPurpleTheme ? "bg-fuchsia-500 text-white border-fuchsia-400 shadow-sm" : "bg-blue-500 text-white border-blue-400 shadow-sm", // Warna terang jelas
    subTabInactive: "bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 hover:text-white",
    subBadgeActive: "bg-white/20 text-white",
    subBadgeInactive: "bg-black/30 text-white/70",
    
    // Input Search Theme
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",
  };

  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("todo");
  const [historyTab,   setHistoryTab]   = useState("all"); 
  const [historyPage,  setHistoryPage]  = useState(1);
  const [search,       setSearch]       = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  /* ── Fetch ── */
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res  = await api.get('/daily-tasks');
      const data = res.data?.data || res.data || [];
      setTasks(data.map(t => {
        let uiStatus = "todo";
        if (t.status === "approved") uiStatus = "completed";
        else if (t.status === "rejected" || t.status === "revision") uiStatus = "revision";
        else if (t.status === "pending" && t.evidence_url) uiStatus = "pending";
        else if (t.status === "pending" && !t.evidence_url) uiStatus = "todo";

        return {
          id:            t.id,
          title:         t.taskTemplate?.title || t.taskTemplate?.task_name || t.template?.title || t.description || "Tugas Harian",
          location:      "Kantor MCC",
          status:        uiStatus,
          rawStatus:     t.status,
          admin_notes:   t.reject_reason || "",
          is_urgent:     !t.template_id,
          photo:         t.evidence_url || null,
          description:   t.description || "",
          inviter_name:  t.assignedBy?.full_name || t.assigner?.full_name || "",
          tagged_users:  Array.isArray(t.confirmed_participants) ? t.confirmed_participants : [],
          due_date:      t.due_date,
          task_date:     t.task_date,
          assign_note:   t.assign_note || "",
        };
      }));
    } catch {
      toast.error("Gagal memuat logbook tugas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { setHistoryPage(1); }, [historyTab, search, activeTab]);

  /* ── Data Filter ── */
  const searchQ = search.toLowerCase();
  const regularTasks   = tasks.filter(t => !t.is_urgent && t.status !== 'completed' && (!search || t.title.toLowerCase().includes(searchQ)));
  const urgentTasks    = tasks.filter(t => t.is_urgent && t.status !== 'completed' && (!search || t.title.toLowerCase().includes(searchQ)));
  
  const totalTasks     = tasks.length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const progressPct    = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const allHistory = useMemo(() => {
    return tasks
      .filter(t => {
        const matchTab =
          historyTab === "all"      ? true :
          historyTab === "completed"? t.status === "completed" :
          historyTab === "pending"  ? (t.status === "pending" || t.status === "waiting_confirmation") :
          historyTab === "revision" ? t.status === "revision" : true;
        const matchSearch = !search || t.title.toLowerCase().includes(searchQ);
        return matchTab && matchSearch;
      })
      .sort((a, b) => new Date(b.task_date || 0) - new Date(a.task_date || 0));
  }, [tasks, historyTab, search, searchQ]);

  const totalPages   = Math.max(1, Math.ceil(allHistory.length / PAGE_SIZE));
  const pagedHistory = allHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const hCounts = useMemo(() => ({
    all:       tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending:   tasks.filter(t => t.status === "pending" || t.status === "waiting_confirmation").length,
    revision:  tasks.filter(t => t.status === "revision").length,
  }), [tasks]);

  const handleOpenCamera = (task) => {
    if (!canSubmit) { toast.error("Hanya intern yang dapat mengirim laporan tugas."); return; }
    if (task.photo && task.status !== "revision") { toast.error("Bukti tugas telah tersegel."); return; }
    setSelectedTask(task);
    setIsCameraOpen(true);
  };
  const handleCloseCamera = () => { setIsCameraOpen(false); setSelectedTask(null); };

  const handleSubmitReport = async (submittedData) => {
    if (!selectedTask?.id) return;
    try {
      await api.post(`/daily-tasks/${selectedTask.id}/submit`, submittedData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Laporan dikirim! Menunggu ACC admin.");
      handleCloseCamera();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim laporan.");
    }
  };

  const handleConfirmTask = async (taskId) => {
    try {
      await api.put(`/daily-tasks/${taskId}/confirm`);
      toast.success("Berhasil konfirmasi tugas rekan!");
      fetchTasks();
    } catch { toast.error("Gagal mengkonfirmasi."); }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const STATUS_BADGE = {
    completed:             { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-check-double",   label: "Selesai" },
    pending:               { cls: "bg-amber-100 text-amber-700 border-amber-200",       icon: "fa-hourglass-half", label: "Menunggu ACC" },
    waiting_confirmation:  { cls: "bg-amber-100 text-amber-700 border-amber-300",       icon: "fa-users",          label: "Menunggu Rekan" },
    revision:              { cls: "bg-rose-100 text-rose-700 border-rose-200",          icon: "fa-rotate-left",    label: "Perlu Revisi" },
    todo:                  { cls: "bg-slate-100 text-slate-600 border-slate-200",       icon: "fa-circle",         label: "Belum Dikerjakan" },
  };

  const MAIN_TABS = [
    { id: "todo",    label: "Tugas Aktif",   icon: "fa-list-check",       count: tasks.filter(t=>t.status!=='completed').length },
    { id: "history", label: "Riwayat Tugas", icon: "fa-clock-rotate-left", count: tasks.length },
  ];

  const HIST_TABS = [
    { id: "all",       label: "Semua",         count: hCounts.all },
    { id: "pending",   label: "Menunggu ACC",  count: hCounts.pending },
    { id: "completed", label: "Selesai",       count: hCounts.completed },
    { id: "revision",  label: "Revisi",        count: hCounts.revision },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (TAB UTAMA DI BAWAH TEKS)                              */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        {/* ── BAGIAN ATAS: TEKS & STATS ── */}
        <div className={`relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 ${activeTab === 'todo' ? 'pb-8 sm:pb-10' : ''}`}>
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-clipboard-check text-lg md:text-xl" />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-3 py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Daily Logbook
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Daily Tasks.
            </h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Selesaikan tugas dan lampirkan bukti foto/dokumen. Pantau progress harianmu di sini.
            </p>

            {/* 🔥 MAIN TABS (Langsung di bawah teks untuk nutupin Whitespace) */}
            <div className="mt-6 sm:mt-8 flex items-center gap-3 overflow-x-auto scrollbar-hide flex-nowrap w-full max-w-full">
              {MAIN_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold transition-all border whitespace-nowrap shrink-0 ${
                    activeTab === tab.id ? theme.mainTabActive : theme.mainTabInactive
                  }`}>
                  <i className={`fa-solid ${tab.icon}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                      activeTab === tab.id ? theme.mainBadgeActive : theme.mainBadgeInactive
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Kotak Stats Kanan */}
          <div className={`w-full lg:w-80 shrink-0 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-md flex flex-col justify-center gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${theme.progressIcon}`}>Progress Hari Ini</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400">{loading ? "…" : totalTasks} tugas total</p>
              </div>
              <i className={`fa-solid fa-chart-pie text-lg ${theme.progressIcon}`} />
            </div>
            <h3 className={`text-4xl sm:text-5xl font-black leading-none tracking-tighter mb-1 ${theme.progressIcon}`}>{loading ? 0 : progressPct}%</h3>
            <div className={`w-full h-2.5 rounded-full overflow-hidden border shadow-inner mt-2 ${theme.progressTrack}`}>
              <div className={`h-full rounded-full transition-all duration-1000 ${theme.progressBarBg}`} style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-medium text-white/60 mt-1 text-right">
              <span className="font-bold text-white">{loading ? "…" : completedCount}</span> dari {loading ? "…" : totalTasks} selesai
            </p>
          </div>
        </div>

        {/* 🔥 TOOLBAR BAWAH: HANYA MUNCUL DI TAB RIWAYAT */}
        {activeTab === "history" && (
          <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-8 py-3 sm:py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
            
            {/* KIRI: SUB TABS */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap w-full md:w-auto">
              {HIST_TABS.map(tab => (
                <button key={tab.id} onClick={() => setHistoryTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-all border whitespace-nowrap shrink-0 ${
                    historyTab === tab.id ? theme.subTabActive : theme.subTabInactive
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                      historyTab === tab.id ? theme.subBadgeActive : theme.subBadgeInactive
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* KANAN: SEARCH */}
            <div className="relative w-full md:w-64 shrink-0">
              <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
              <input type="text" placeholder="Cari riwayat tugas..." value={search} onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none transition-colors shadow-sm ${theme.inputBg}`} />
            </div>
          </div>
        )}
      </div>

      {/* ── INFO BAR ── */}
      {activeTab === "history" && !loading && allHistory.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400">
            Menampilkan <span className="text-slate-700">
              {Math.min((historyPage - 1) * PAGE_SIZE + 1, allHistory.length)}–{Math.min(historyPage * PAGE_SIZE, allHistory.length)}
            </span> dari {allHistory.length} tugas
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: TUGAS HARI INI
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "todo" && (
        <div className="space-y-6 pt-2">
          <div className="bg-slate-50/50 p-3 sm:p-4 rounded-[2rem] border border-slate-100 shadow-inner">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200/60 pb-3 pl-2 pt-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-blue-500 shadow-sm">
                <i className="fa-solid fa-desktop text-sm" />
              </div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Semua Tugas Rutin</h2>
            </div>
            <div className="flex flex-col gap-3">
              {loading ? (
                <p className="text-center text-sm font-bold text-slate-400 py-8"><i className="fa-solid fa-spinner fa-spin mr-2" />Memuat tugas…</p>
              ) : regularTasks.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fa-solid fa-mug-hot text-4xl text-slate-200 mb-3 block" />
                  <p className="text-sm font-bold text-slate-400">Tidak ada tugas rutinitas hari ini.</p>
                  <p className="text-xs text-slate-300 mt-1">Cek tab Riwayat Tugas untuk melihat tugas sebelumnya.</p>
                </div>
              ) : (
                regularTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i} onOpenCameraModal={handleOpenCamera} onConfirmTask={handleConfirmTask} currentUserId={currentUser.id} />
                ))
              )}
            </div>
          </div>

          {!loading && urgentTasks.length > 0 && (
            <div className="bg-rose-50/30 p-3 sm:p-4 rounded-[2rem] border border-rose-100 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 border-b border-rose-200/60 pb-3 pl-2 pt-1">
                <i className="fa-solid fa-bolt text-rose-500 animate-pulse text-lg" />
                <h2 className="text-sm font-black text-rose-600 uppercase tracking-widest">Tugas Tambahan (Urgent)</h2>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                {urgentTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i} onOpenCameraModal={handleOpenCamera} onConfirmTask={handleConfirmTask} currentUserId={currentUser.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: RIWAYAT TUGAS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-4 w-3/4 sm:w-48 bg-slate-200 rounded" /><div className="h-3 w-1/2 sm:w-32 bg-slate-100 rounded" /></div>
                  <div className="hidden sm:block w-24 h-7 bg-slate-100 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : allHistory.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-10 sm:p-16 text-center mt-2">
              <i className="fa-solid fa-inbox text-4xl sm:text-5xl text-slate-200 mb-4 block" />
              <h3 className="text-slate-500 font-bold text-base sm:text-lg">{search ? "Tidak ditemukan" : "Belum ada riwayat"}</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{search ? "Coba kata kunci lain." : "Riwayat tugas akan muncul di sini."}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 pt-2">
                {pagedHistory.map(task => {
                  const badge = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
                  return (
                    <div key={task.id}
                      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden ${
                        task.status === 'revision'   ? 'border-rose-200 bg-rose-50/30' :
                        task.status === 'completed'  ? 'border-emerald-200 bg-emerald-50/20' :
                        task.status === 'pending' || task.status === 'waiting_confirmation' ? 'border-amber-200 bg-amber-50/20' :
                        'border-slate-200'
                      }`}>
                      <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl ${
                        task.status==='completed'?'bg-emerald-400':task.status==='revision'?'bg-rose-400':
                        task.status==='pending'||task.status==='waiting_confirmation'?'bg-amber-400':'bg-slate-300'}`} />

                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 pl-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.cls}`}>
                          <i className={`fa-solid ${badge.icon} text-sm`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-bold text-slate-800 text-sm leading-tight truncate ${task.status==='completed'?'line-through text-slate-500':''}`}>
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              <i className="fa-regular fa-calendar mr-1" />{fmtDate(task.task_date)}
                            </span>
                            {task.due_date && (
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                <i className="fa-solid fa-flag mr-1" />Deadline {fmtDate(task.due_date)}
                              </span>
                            )}
                          </div>
                          {task.description && task.status !== 'todo' && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 italic mt-1 line-clamp-1">"{task.description}"</p>
                          )}
                          {task.status === 'revision' && task.admin_notes && (
                            <p className="text-[10px] sm:text-[11px] font-bold text-rose-500 mt-1 flex items-start sm:items-center gap-1">
                              <i className="fa-solid fa-circle-exclamation mt-0.5 sm:mt-0 shrink-0" />{task.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-3 sm:pl-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <div className="flex gap-2">
                          {task.status === 'revision' && (
                            <button onClick={() => handleOpenCamera(task)}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
                              <i className="fa-solid fa-wrench" /> Revisi
                            </button>
                          )}
                          {task.photo && (
                            <a href={task.photo} target="_blank" rel="noreferrer"
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 flex items-center justify-center transition-colors"
                              title="Lihat bukti">
                              <i className="fa-solid fa-image text-[10px] sm:text-xs" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pager page={historyPage} total={totalPages} onChange={setHistoryPage} />
            </>
          )}
        </div>
      )}

      {/* ── CAMERA MODAL ── */}
      {isCameraOpen && selectedTask && (
        <LiveCameraModal task={selectedTask} currentUser={currentUser}
          onClose={handleCloseCamera} onSubmit={handleSubmitReport} />
      )}
    </div>
  );
};

export default InternTasks;