import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const AdminTaskCRUD = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const canManageAll = isSuperAdmin || isDeveloper;
  const myDivisionId = user?.division_id || user?.division?.id;
  const myDivisionName = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (ADMIN DEEP NAVY)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  
  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-white/10 border-white/10 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" 
      : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" 
      : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-100/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    
    // --- MAIN TABS ---
    mainTabActive: "bg-white text-slate-900 shadow-md", 
    mainTabInactive: "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white", 

    // --- TOOLBAR LANTAI ---
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",
    btnAdd: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20" : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 shadow-purple-900/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20",

    // --- CONTENT & MODAL ---
    cardBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800" : "bg-white border-slate-200",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    inputField: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:ring-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-500",
  };

  const [activeTab, setActiveTab] = useState("template"); // 'template' atau 'live'

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form State
  const [taskName, setTaskName] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [taskDivisionId, setTaskDivisionId] = useState(myDivisionId || "");

  // Data State
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [liveTasks, setLiveTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, liveRes, internRes, divRes] = await Promise.all([
        api.get('/task-templates'),
        api.get('/daily-tasks'),
        api.get('/profiles'),
        canManageAll ? api.get('/divisions') : Promise.resolve({ data: [] })
      ]);
      setTaskTemplates(tplRes.data?.data || []);
      setLiveTasks(liveRes.data?.data || []);
      
      const allInterns = (internRes.data?.data || []).filter(u => u.role === 'intern');
      setInterns(canManageAll ? allInterns : allInterns.filter(i => i.division_id === myDivisionId));
      if (canManageAll) setDivisions(divRes.data?.data || []);
    } catch (err) {
      toast.error("Gagal sinkronisasi data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter Data
  const filteredTemplates = taskTemplates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const filteredLiveTasks = liveTasks.filter(t => 
    t.description?.toLowerCase().includes(search.toLowerCase()) || 
    t.taskTemplate?.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.assignee?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setTaskName("");
    setTaskDetail("");
    setAssignee("");
    setDueDate("");
    setAssignNote("");
    setTaskDivisionId(myDivisionId || "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === "template") {
        const payload = { 
          title: taskName, 
          description: taskDetail, 
          division_id: canManageAll ? taskDivisionId : myDivisionId 
        };
        await api.post('/task-templates', payload);
      } else {
        if (!assignee) { toast.error("Pilih intern penerima tugas!"); return; }
        const selectedTpl = taskTemplates.find(t => t.id.toString() === taskName);
        
        const payload = {
          task_date: new Date().toISOString().split('T')[0],
          due_date: dueDate || null,
          status: 'pending',
          assignee_id: assignee,
          assign_note: assignNote
        };
        
        if (selectedTpl) {
          payload.template_id = selectedTpl.id;
        } else {
          payload.custom_title = taskName;
          payload.description = taskDetail;
        }
        await api.post('/daily-tasks', payload);
      }

      setShowAddModal(false);
      setShowSuccessModal(true);
      resetForm();
      fetchData();

      setTimeout(() => setShowSuccessModal(false), 2500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan data.");
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        if (type === 'template') {
          await api.delete(`/task-templates/${id}`);
        } else {
          await api.delete(`/daily-tasks/${id}`);
        }
        toast.success("Berhasil dihapus!");
        fetchData();
      } catch { toast.error("Gagal menghapus."); }
    }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (ADMIN COMMAND CENTER STYLE)                           */}
      {/* ================================================================= */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        
        {/* Ornamen Command Center (Matrix Dots) - Membedakan dari Intern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '16px 16px', maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
        
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8">
          
          {/* KOLOM KIRI */}
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-server text-sm sm:text-lg md:text-xl" />
              </div>
              <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Control Room
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-2 sm:mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Manajemen Tugas.
            </h1>
            <p className={`text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Akses kendali penuh. Rancang template tugas rutin divisi atau delegasikan instruksi operasional secara spesifik ke intern.
            </p>

            {/* 🔥 MAIN TABS (Mobile Scrollable) */}
            <div className="mt-5 sm:mt-6 md:mt-8 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-nowrap w-full max-w-full pb-1 sm:pb-0">
              {[
                { id: "template", label: "Template Bank", icon: "fa-layer-group" },
                { id: "live",     label: "Live Assignments",  icon: "fa-satellite-dish" },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl text-[10px] sm:text-[11px] md:text-[13px] font-bold transition-all border whitespace-nowrap shrink-0 ${
                    activeTab === tab.id ? theme.mainTabActive : theme.mainTabInactive
                  }`}>
                  <i className={`fa-solid ${tab.icon}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* KOLOM KANAN (Stats Widget) - FIX: h-fit & lg:self-center biar rapet */}
          <div className={`w-full lg:w-80 shrink-0 h-fit lg:self-center rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md flex flex-col gap-3 sm:gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 sm:pb-3 mb-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Task Summary</span>
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 sm:py-1 rounded-md">{canManageAll ? "Global" : myDivisionName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-white/40 mb-0.5 sm:mb-1">Templates</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{taskTemplates.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-emerald-400 mb-0.5 sm:mb-1">Live Tasks</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{liveTasks.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 TOOLBAR LANTAI HERO: SEARCH & ADD BUTTON (RESPONSIVE) */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          <div className="relative w-full sm:max-w-xs md:max-w-sm lg:w-80 shrink-0 group">
            <i className={`fa-solid fa-magnifying-glass absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder={`Cari di ${activeTab === 'template' ? 'template' : 'tugas aktif'}...`} value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium outline-none border transition-colors shadow-sm ${theme.inputBg}`} />
          </div>

          <button onClick={() => { resetForm(); setShowAddModal(true); }} 
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-black text-white transition-all active:scale-95 shadow-lg shrink-0 ${theme.btnAdd}`}>
            <i className="fa-solid fa-plus-circle" /> {activeTab === "template" ? "Buat Template" : "Assign Tugas"}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CONTENT LIST (RESPONSIVE GRID)                                      */}
      {/* ================================================================= */}
      <div className="pt-2 sm:pt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[0,1,2,3,4,5].map(i => <div key={i} className={`h-36 sm:h-40 rounded-2xl sm:rounded-[2rem] border animate-pulse ${theme.cardBg}`} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* ── RENDER TEMPLATES ── */}
            {activeTab === "template" && (
              filteredTemplates.length === 0 ? (
                <div className="col-span-full py-16 sm:py-20 text-center opacity-40">
                  <i className={`fa-solid fa-layer-group text-4xl sm:text-5xl mb-3 sm:mb-4 ${theme.textSecondary}`} />
                  <h3 className={`font-black text-base sm:text-lg ${theme.textPrimary}`}>Belum Ada Template</h3>
                  <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textSecondary}`}>Klik tombol "Buat Template" untuk menyusun database tugas.</p>
                </div>
              ) : (
                filteredTemplates.map(tpl => (
                  <div key={tpl.id} className={`rounded-2xl sm:rounded-[2rem] border p-5 sm:p-6 flex flex-col justify-between group hover:shadow-lg transition-all duration-300 ${theme.cardBg}`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${isDeveloperTheme ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                          {tpl.division?.name || 'Global'}
                        </span>
                        <div className="flex gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDelete(tpl.id, 'template')} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><i className="fa-solid fa-trash text-[9px] sm:text-[10px]" /></button>
                        </div>
                      </div>
                      <h3 className={`font-black text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2 ${theme.textPrimary}`}>{tpl.title}</h3>
                      <p className={`text-[10px] sm:text-xs font-medium line-clamp-3 leading-relaxed italic ${theme.textSecondary}`}>"{tpl.description || 'Tanpa detail deskripsi.'}"</p>
                    </div>
                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-dashed border-slate-200/50 flex justify-between items-center">
                      <span className={`text-[9px] sm:text-[10px] font-bold ${theme.textSecondary}`}>ID: #{tpl.id.toString().slice(0,5)}</span>
                      <button onClick={() => { /* Edit Tpl Logic Later */ }} className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:underline ${isDeveloperTheme ? 'text-emerald-500' : 'text-blue-500'}`}>Edit Template</button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── RENDER LIVE TASKS ── */}
            {activeTab === "live" && (
              filteredLiveTasks.length === 0 ? (
                <div className="col-span-full py-16 sm:py-20 text-center opacity-40">
                  <i className={`fa-solid fa-satellite-dish text-4xl sm:text-5xl mb-3 sm:mb-4 ${theme.textSecondary}`} />
                  <h3 className={`font-black text-base sm:text-lg ${theme.textPrimary}`}>Tidak Ada Tugas Berjalan</h3>
                  <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textSecondary}`}>Klik tombol "Assign Tugas" untuk memberi instruksi operasional.</p>
                </div>
              ) : (
                filteredLiveTasks.map(task => (
                  <div key={task.id} className={`rounded-2xl sm:rounded-[2rem] border p-4 sm:p-5 md:p-6 flex flex-col group hover:shadow-lg transition-all duration-300 ${theme.cardBg}`}>
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                          {task.assignee?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>Assigned to</p>
                          <h4 className={`font-black text-[11px] sm:text-xs md:text-sm truncate max-w-[100px] sm:max-w-[120px] ${theme.textPrimary}`}>{task.assignee?.full_name || 'Unassigned'}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDelete(task.id, 'live')} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><i className="fa-solid fa-trash text-[8px] sm:text-[10px]" /></button>
                      </div>
                    </div>

                    <div className="mb-3 sm:mb-4 flex-1">
                      <h3 className={`font-black text-xs sm:text-sm mb-1 sm:mb-1.5 line-clamp-2 ${theme.textPrimary}`}>{task.taskTemplate?.title || task.custom_title || task.description || "Tugas Harian"}</h3>
                      {task.assign_note && (
                        <p className={`text-[10px] sm:text-[11px] p-2 sm:p-2.5 rounded-lg border italic line-clamp-2 mt-2 ${isDeveloperTheme ? 'bg-[#141417] border-zinc-800 text-zinc-400' : 'bg-amber-50/50 border-amber-100 text-amber-700'}`}>
                          <i className="fa-solid fa-circle-info mr-1" /> {task.assign_note}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 border-t border-dashed border-slate-200/50 pt-3 sm:pt-4">
                       <div>
                         <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 ${theme.textSecondary}`}>Deadline</p>
                         <p className={`text-[10px] sm:text-[11px] font-black ${theme.textPrimary}`}><i className="fa-regular fa-calendar text-rose-500 mr-1" /> {fmtDate(task.due_date)}</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 ${theme.textSecondary}`}>Status</p>
                         <span className={`inline-block px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase border ${
                            task.status === 'completed' || task.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            task.status === 'rejected' || task.status === 'revision' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            'bg-amber-50 text-amber-600 border-amber-200'
                         }`}>
                           {task.status}
                         </span>
                       </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* ADD MODAL (RESPONSIVE FORM)                                         */}
      {/* ================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className={`w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh] ${theme.cardBg}`}>
            
            {/* Header Modal */}
            <div className={`px-5 sm:px-8 py-4 sm:py-6 border-b shrink-0 flex justify-between items-center ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-base sm:text-xl font-black flex items-center gap-2 ${theme.textPrimary}`}>
                {activeTab === "template" ? <><i className="fa-solid fa-layer-group" /> Tambah Template</> : <><i className="fa-solid fa-user-astronaut" /> Assign Tugas</>}
              </h2>
              <button onClick={() => setShowAddModal(false)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme.textSecondary} hover:bg-rose-500 hover:text-white`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            {/* Body Modal (Scrollable) */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 custom-scrollbar px-5 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
              
              {activeTab === "template" ? (
                /* --- FORM: BUAT TEMPLATE --- */
                <>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Judul Tugas</label>
                    <input type="text" required value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Contoh: Maintenance Server"
                      className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors ${theme.inputField}`} />
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Instruksi / Detail</label>
                    <textarea rows={4} required value={taskDetail} onChange={e => setTaskDetail(e.target.value)} placeholder="Tuliskan step-by-step pengerjaan..."
                      className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-medium resize-none transition-colors ${theme.inputField}`} />
                  </div>
                  {canManageAll && (
                    <div>
                      <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Divisi Spesifik (Opsional)</label>
                      <select value={taskDivisionId} onChange={e => setTaskDivisionId(e.target.value)}
                        className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors cursor-pointer ${theme.inputField}`}>
                        <option value="">-- Semua Divisi (Global) --</option>
                        {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                /* --- FORM: ASSIGN LIVE TASK --- */
                <>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Pilih Intern <span className="text-rose-500">*</span></label>
                    <select required value={assignee} onChange={e => setAssignee(e.target.value)}
                      className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors cursor-pointer ${theme.inputField}`}>
                      <option value="">-- Pilih Anggota Tim --</option>
                      {interns.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.division?.name || 'General'})</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Tugas / Template <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="text" required list="templatesList" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Ketik tugas baru atau pilih template..."
                        className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors ${theme.inputField}`} />
                      <datalist id="templatesList">
                        {taskTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </datalist>
                    </div>
                    <p className={`text-[9px] mt-1 ml-1 italic ${theme.textSecondary}`}>*Ketik manual untuk tugas bebas, atau pilih dari daftar template.</p>
                  </div>

                  {/* Jika ngetik manual (bukan milih template), kasih kolom detail */}
                  {!taskTemplates.find(t => t.id.toString() === taskName) && taskName.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                       <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Deskripsi Tugas Kustom <span className="text-rose-500">*</span></label>
                       <textarea rows={2} required value={taskDetail} onChange={e => setTaskDetail(e.target.value)} placeholder="Tuliskan instruksi tugas..."
                         className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-medium resize-none transition-colors ${theme.inputField}`} />
                    </div>
                  )}

                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Catatan Tambahan (Opsional)</label>
                    <textarea rows={2} value={assignNote} onChange={e => setAssignNote(e.target.value)} placeholder="Pesan khusus..."
                      className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-medium resize-none transition-colors ${theme.inputField}`} />
                  </div>

                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Batas Waktu (Deadline) <span className="text-rose-500">*</span></label>
                    <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors ${theme.inputField} ${isDeveloperTheme ? '[color-scheme:dark]' : ''}`} />
                  </div>
                </>
              )}

              {/* Footer Modal */}
              <div className={`flex gap-3 pt-4 sm:pt-5 mt-2 sm:mt-4 border-t shrink-0 ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button type="button" onClick={() => { resetForm(); setShowAddModal(false); }} className={`flex-1 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Batal</button>
                <button type="submit" className={`flex-1 py-3 sm:py-3.5 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${theme.btnAdd}`}>Simpan & Proses</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL SUCCESS AFTER-EFFECT (PORTAL)                               */}
      {/* ================================================================= */}
      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-75 slide-in-from-bottom-10 duration-300 border-[6px] sm:border-[8px] max-w-xs sm:max-w-sm w-full ${isDeveloperTheme ? 'bg-[#09090b] border-[#18181b] ring-1 ring-emerald-900/50' : 'bg-white border-white ring-1 ring-slate-100'}`}>
             <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl sm:text-5xl mb-5 sm:mb-6 shadow-inner animate-bounce border-4 border-white ring-4 ring-emerald-50">
                <i className="fa-solid fa-check"></i>
             </div>
             <h2 className={`text-xl sm:text-2xl font-black mb-1 sm:mb-2 tracking-tight ${theme.textPrimary}`}>Data Tersimpan!</h2>
             <p className={`font-medium text-xs sm:text-sm ${theme.textSecondary}`}>
                {activeTab === "template" 
                  ? "Sistem automation berhasil di-update." 
                  : "Tugas telah di-assign ke anggota tim."}
             </p>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminTaskCRUD;