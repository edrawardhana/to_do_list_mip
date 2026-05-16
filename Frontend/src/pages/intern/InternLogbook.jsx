import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_SIZE = 6;

const S = {
  pending:  { cls: "bg-amber-50 text-amber-600 border-amber-200",       icon: "fa-clock",        label: "Menunggu ACC" },
  approved: { cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "fa-check-circle", label: "Di-ACC ✓" },
  rejected: { cls: "bg-rose-50 text-rose-600 border-rose-200",          icon: "fa-rotate-left",  label: "Perlu Revisi" },
  revision: { cls: "bg-rose-50 text-rose-600 border-rose-200",          icon: "fa-rotate-left",  label: "Perlu Revisi" },
};

const fmt   = (b) => b < 1048576 ? (b/1024).toFixed(1)+" KB" : (b/1048576).toFixed(1)+" MB";
const isImg = (u="") => /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(u);

/* ── Pagination Component ─────────────────────────────────────────────────── */
const Pager = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4 pb-6">
      <button onClick={() => onChange(page-1)} disabled={page===1}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-left text-xs"/>
      </button>
      {Array.from({length: total},(_,i)=>i+1).map(p => {
        const show = p === 1 || p === total || Math.abs(p - page) <= 1;
        const dots = !show && (p === 2 || p === total - 1);
        if (!show && !dots) return null;
        if (dots) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
        return (
          <button key={p} onClick={()=>onChange(p)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold border shadow-sm transition-all ${
              p===page ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-blue-500/20"
                       : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}>{p}</button>
        );
      })}
      <button onClick={() => onChange(page+1)} disabled={page===total}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-right text-xs"/>
      </button>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const InternLogbook = () => {
  const { user, isDeveloper, isSuperAdmin } = useAuth(); 

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO & TABS)
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
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    
    // --- MAIN TABS (DI BAWAH TEKS HERO) ---
    mainTabActive: "bg-white text-slate-900 shadow-md", 
    mainTabInactive: "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white", 
    mainBadgeActive: "bg-blue-100 text-blue-700",
    mainBadgeInactive: "bg-black/30 text-white/70",

    // --- TOOLBAR BAWAH & SEARCH ---
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    subTabActive: isDeveloperTheme ? "bg-emerald-500 text-white shadow-sm" : isPurpleTheme ? "bg-fuchsia-500 text-white shadow-sm" : "bg-blue-500 text-white shadow-sm",
    subTabInactive: "bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 hover:text-white",
    subBadgeActive: "bg-white/20 text-white",
    subBadgeInactive: "bg-black/30 text-white/70",

    // Input Search Theme
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",
  };

  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("all");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [activeModal, setActiveModal] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [description, setDescription] = useState("");
  const [chosenFile,  setChosenFile]  = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/daily-tasks");
      setTasks(res.data?.data || res.data || []);
    } catch { toast.error("Gagal memuat tugas"); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { setPage(1); }, [activeTab, search]);

  const openModal = (task) => {
    setActiveModal(task);
    setDescription(task.description || "");
    setChosenFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };
  const closeModal = () => {
    setActiveModal(null);
    setChosenFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20*1024*1024) { toast.error("File maksimal 20 MB"); return; }
    setChosenFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!activeModal) return;
    if (!description.trim()) { toast.error("Isi catatan laporan"); return; }
    setSubmitting(true);
    const tid = toast.loading("Mengirim laporan…");
    try {
      const fd = new FormData();
      fd.append("description", description);
      if (chosenFile) fd.append("evidence_url", chosenFile);
      await api.post(`/daily-tasks/${activeModal.id}/submit`, fd);
      toast.success("✅ Laporan dikirim! Menunggu ACC Admin.", { id: tid });
      closeModal();
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengirim";
      toast.error(msg, { id: tid });
    } finally { setSubmitting(false); }
  };

  const getTitle = (t) => t.taskTemplate?.title ?? t.template?.title ?? t.description ?? "Tugas Harian";
  const fmtDate  = (d) => {
    if (!d) return "—";
    const raw = d.includes('T') ? d : d+'T00:00:00';
    return new Date(raw).toLocaleDateString('id-ID', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  };

  const counts = {
    all:      tasks.length,
    pending:  tasks.filter(t=>t.status==='pending').length,
    approved: tasks.filter(t=>t.status==='approved').length,
    rejected: tasks.filter(t=>t.status==='rejected'||t.status==='revision').length,
  };

  const filtered = tasks.filter(t => {
    const matchTab =
      activeTab==='all'      ? true :
      activeTab==='pending'  ? t.status==='pending' :
      activeTab==='approved' ? t.status==='approved' :
      activeTab==='rejected' ? (t.status==='rejected'||t.status==='revision') : true;
    const matchSearch = !search || getTitle(t).toLowerCase().includes(search.toLowerCase()) ||
      (t.task_date||'').includes(search);
    return matchTab && matchSearch;
  }).sort((a,b) => new Date(b.task_date||b.created_at) - new Date(a.task_date||a.created_at));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const TABS = [
    { id:"all",      label:"Semua",       count: counts.all },
    { id:"pending",  label:"Menunggu ACC",count: counts.pending },
    { id:"approved", label:"Di-ACC",      count: counts.approved },
    { id:"rejected", label:"Perlu Revisi",count: counts.rejected },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (TAB UTAMA DI BAWAH TEKS, SEARCH DI TOOLBAR)           */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8">
          
          {/* KOLOM KIRI (Teks + MAIN TABS pengisi Whitespace) */}
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-book-open-reader text-lg md:text-xl" />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-3 py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Arsip Laporan
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Riwayat Logbook.
            </h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Arsip formal dari semua laporan tugas yang telah dikerjakan. Upload dokumen/PDF bukti kerjamu di sini.
            </p>

            {/* 🔥 MAIN TABS (Langsung di bawah teks untuk nutupin Whitespace) */}
            <div className="mt-6 sm:mt-8 flex items-center gap-3 overflow-x-auto scrollbar-hide flex-nowrap w-full max-w-full">
              <button className={theme.mainTabActive + " flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold transition-all whitespace-nowrap shrink-0"}>
                 <i className="fa-solid fa-clock-rotate-left" /> Riwayat Laporan
              </button>
            </div>
          </div>

          {/* KOLOM KANAN (Kotak Stats) */}
          <div className={`w-full lg:w-80 shrink-0 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-md flex flex-col justify-center gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
             <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Logbook Summary</span>
               <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded-md">Total: {counts.all}</span>
             </div>
             <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 mb-1">{counts.approved}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-400/70">Di-ACC</span>
                </div>
                <div className="flex flex-col items-center justify-center pl-1">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 mb-1">{counts.pending}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-amber-400/70">Pending</span>
                </div>
                <div className="flex flex-col items-center justify-center pl-1">
                  <span className="text-xl sm:text-2xl font-black text-rose-400 mb-1">{counts.rejected}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-rose-400/70">Revisi</span>
                </div>
             </div>
          </div>
        </div>

        {/* 🔥 TOOLBAR LANTAI: SEARCH & FILTER SUB-TABS */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-8 py-3 sm:py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          
          {/* KIRI: SUB TABS */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap w-full md:w-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id ? theme.subTabActive : theme.subTabInactive
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                    activeTab === tab.id ? theme.subBadgeActive : theme.subBadgeInactive
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* KANAN: SEARCH */}
          <div className="relative w-full md:w-64 shrink-0">
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder="Cari laporan..." value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none transition-colors shadow-sm ${theme.inputBg}`} />
          </div>
        </div>
      </div>

      {/* ── INFO BAR ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400">
            Menampilkan <span className="text-slate-700">
              {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)}
            </span> dari {filtered.length} tugas
          </p>
        </div>
      )}

      {/* ================================================================= */}
      {/* TASK LIST                                                           */}
      {/* ================================================================= */}
      {loading ? (
        <div className="space-y-4 pt-2">
          {[0,1,2].map(i=>(
            <div key={i} className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 p-4 sm:p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-200 shrink-0"/>
              <div className="flex-1 space-y-2"><div className="h-4 w-48 bg-slate-200 rounded"/><div className="h-3 w-28 bg-slate-100 rounded"/></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-12 sm:p-16 text-center mt-2">
          <i className="fa-solid fa-inbox text-5xl text-slate-200 mb-4 block"/>
          <h3 className="text-slate-500 font-bold text-base sm:text-lg">Logbook Kosong</h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Belum ada laporan di kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {paged.map(task => {
            const st = S[task.status] || S.pending;
            const canSubmit = task.status !== 'approved';
            return (
              <div key={task.id}
                className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">

                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0 border ${st.cls}`}>
                    <i className={`fa-solid ${st.icon}`}/>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 text-sm sm:text-base leading-tight truncate pr-2">{getTitle(task)}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 sm:mt-1.5">
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        <i className="fa-regular fa-calendar mr-1"/> {fmtDate(task.task_date)}
                      </span>
                      {task.status === 'approved' && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600">
                          <i className="fa-solid fa-user-check mr-1"/>Verified
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-[10px] sm:text-[11px] text-slate-500 italic mt-2 line-clamp-1 bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                        "{task.description}"
                      </p>
                    )}
                    {(task.status==='rejected'||task.status==='revision') && task.reject_reason && (
                      <p className="text-[10px] sm:text-[11px] font-bold text-rose-500 mt-2 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-exclamation shrink-0"/> {task.reject_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${st.cls}`}>
                    {st.label}
                  </span>

                  <div className="flex items-center gap-2">
                    {canSubmit && (
                      <button onClick={()=>openModal(task)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-white text-[10px] sm:text-xs font-black shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5 ${
                          task.status==='rejected'||task.status==='revision' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}>
                        <i className={`fa-solid ${task.evidence_url ? 'fa-pen' : 'fa-upload'}`}/>
                        {task.status==='rejected'||task.status==='revision' ? 'Revisi' : 'Submit'}
                      </button>
                    )}
                    {task.evidence_url && (
                      <a href={task.evidence_url} target="_blank" rel="noreferrer"
                        className="w-8 h-8 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-600 flex items-center justify-center transition-colors">
                        <i className={`fa-solid ${isImg(task.evidence_url)?'fa-image':'fa-file'} text-xs`}/>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <Pager page={page} total={totalPages} onChange={setPage}/>
        </div>
      )}

      {/* ── SUBMIT MODAL ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Submit Laporan</p>
                <h3 className="font-black text-slate-800 text-sm sm:text-base line-clamp-1">{getTitle(activeModal)}</h3>
              </div>
              <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors shadow-sm">
                <i className="fa-solid fa-xmark"/>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[70vh]">
               {/* Revision notice */}
               {(activeModal.status==='rejected'||activeModal.status==='revision') && activeModal.reject_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start shadow-inner">
                  <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">Catatan Admin</p>
                    <p className="text-xs text-rose-600 font-medium">{activeModal.reject_reason}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Upload Bukti</label>
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group shadow-sm">
                  {chosenFile ? (
                    <p className="text-xs font-bold text-blue-600 truncate px-4 w-full text-center">{chosenFile.name}</p>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-300 group-hover:text-blue-500 mb-2"/>
                      <p className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600">Klik untuk pilih file (Maks 20MB)</p>
                    </>
                  )}
                  <input type="file" className="sr-only" onChange={handleFile}/>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Catatan Laporan</label>
                <textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)}
                  placeholder="Ceritakan progres kerjamu hari ini..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"/>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-white">
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                {submitting ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternLogbook;