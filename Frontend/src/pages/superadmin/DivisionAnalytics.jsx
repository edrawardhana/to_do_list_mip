import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const DivisionAnalytics = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  
  const canManage = isSuperAdmin || isDeveloper;

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS
  // ==========================================
  const isDeveloperTheme = isDeveloper; // Tema Hitam Elegan
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; // Tema Ungu
  const isBlueTheme = isAdmin && !isSuperAdmin && !isDeveloperTheme; // Tema Biru

  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => {} });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  // State UI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [formData, setFormData] = useState({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      // Coba endpoint analytics dulu, fallback ke /divisions biasa
      let res;
      try {
        res = await api.get('/divisions/analytics');
      } catch {
        res = await api.get('/divisions');
      }
      // Backend analytics returns plain array, /divisions returns array or {data:[]}
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setDivisions(raw.map(d => ({
        id: d.id,
        name: d.name,
        icon: d.icon || 'fa-building',
        color: d.color || 'blue',
        head: d.head || '',
        internCount: d.intern_count || d.internCount || 0,
        description: d.description || '',
        performance: d.performance || 0,
        jobDescriptions: d.job_descriptions || d.jobDescriptions || [],
        members: d.members || [],
        leaderboard: d.leaderboard || []
      })));
    } catch (error) {
      console.error("Gagal memuat data divisi:", error);
      toast.error("Gagal memuat data analitik divisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  // Filter
  const filteredDivisions = useMemo(() => {
    if (!searchQuery) return divisions;
    const q = searchQuery.toLowerCase();
    return divisions.filter(div =>
      (div.name || "").toLowerCase().includes(q) ||
      (div.head || "").toLowerCase().includes(q) ||
      (div.description || "").toLowerCase().includes(q)
    );
  }, [divisions, searchQuery]);

  // FUNGSI CRUD
  const handleOpenAddForm = () => {
    setFormData({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (div) => {
    setFormData({ ...div });
    setIsFormOpen(true);
  };

  const handleDelete = (id, name, internCount) => {
    if (internCount > 0) {
      toast.error(`Tidak bisa dihapus! Masih ada ${internCount} anggota di divisi ${name}.`);
      return;
    }
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Hapus Divisi",
      message: `Yakin ingin menghapus divisi "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      actionText: "Ya, Hapus!",
      onConfirm: async () => {
        try {
          await api.delete(`/divisions/${id}`);
          toast.success(`Divisi ${name} berhasil dihapus.`);
          fetchDivisions();
        } catch (error) {
          toast.error("Gagal menghapus divisi");
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/divisions/${formData.id}`, formData);
        toast.success("Data divisi berhasil diperbarui");
      } else {
        await api.post('/divisions', formData);
        toast.success("Divisi baru berhasil ditambahkan");
      }
      fetchDivisions();
      setIsFormOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan data divisi");
    }
  };

  // HELPER BIKIN WARNA BADGE DINAMIS
  const getBadgeColors = (color) => {
    if (isDeveloperTheme) {
      const darkMap = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
      return darkMap[color] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    } else {
      const lightMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
      };
      return lightMap[color] || "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* HERO SECTION ANALYTICS & TOOLBAR */}
      <div className={`rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden flex flex-col ${
        isDeveloperTheme ? "bg-[#18181b] border-[#27272a] shadow-zinc-900/20" : 
        isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" : "bg-[#242b4d] border-[#303861] shadow-blue-900/20"
      }`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isDeveloperTheme ? "bg-zinc-600/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-sky-500/20"
        }`}></div>
        
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner backdrop-blur-md ${
              isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700 text-zinc-300" : 
              isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" : "bg-white/10 border-white/20 text-sky-400"
            }`}>
              <i className="fa-solid fa-chart-line text-lg"></i>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-300" : "text-sky-300"
            }`}>Global Performance Monitoring</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white ${
            isDeveloperTheme ? "to-zinc-300" : isPurpleTheme ? "to-purple-200" : "to-sky-200"
          }`}>MCC Global Analytics</h1>
          
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`animate-[spin_3s_linear_infinite] ${isDeveloperTheme ? 'text-zinc-500' : isPurpleTheme ? 'text-purple-400' : 'text-blue-400'}`} />
              </svg>
              <i className={`fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] ${isDeveloperTheme ? 'text-zinc-400' : isPurpleTheme ? 'text-purple-400' : 'text-sky-400'}`}></i>
            </div>
            <div className="h-6 w-px bg-white/20 rounded-full"></div>
            <div className="flex gap-2">
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                  isDeveloperTheme ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300' : 
                  isPurpleTheme ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
              }`}>
                <i className="fa-solid fa-database text-[10px]"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">Data Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Bawah */}
        <div className={`relative z-10 border-t px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-xl ${
           isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : 
           isPurpleTheme ? "bg-[#18112a] border-[#342459]" : "bg-white/5 border-white/10"
        }`}>
           <div className="relative w-full sm:w-80 group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <i className={`fa-solid fa-magnifying-glass transition-colors ${
                 isDeveloperTheme ? "text-zinc-500 group-focus-within:text-zinc-300" : 
                 isPurpleTheme ? "text-purple-400/50 group-focus-within:text-purple-300" : "text-blue-300/50 group-focus-within:text-blue-300"
               }`}></i>
             </div>
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Cari divisi atau admin..."
               className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold outline-none focus:ring-2 appearance-none shadow-inner transition-all border ${
                  isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500 placeholder:text-zinc-500" : 
                  isPurpleTheme ? "bg-[#1d1633] border-[#342459] text-white focus:ring-purple-400 placeholder:text-purple-400/50" : 
                  "bg-blue-900/50 border-white/10 text-white focus:ring-blue-400 placeholder:text-blue-300/50"
               }`}
             />
           </div>

           {canManage && (
             <button onClick={handleOpenAddForm} className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl text-[13px] font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                 isDeveloperTheme ? "bg-zinc-800 hover:bg-zinc-700 shadow-zinc-900/30 border border-zinc-700" : 
                 isPurpleTheme ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/30 border border-purple-500" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 border border-blue-500"
               }`}>
               <i className="fa-solid fa-plus"></i> Tambah Divisi
             </button>
           )}
        </div>
      </div>

      {/* GRID CARDS (2 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Loading Skeletons */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`rounded-[2rem] border p-8 animate-pulse ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" :
            isPurpleTheme ? "bg-white border-slate-200" : "bg-white border-slate-200"
          }`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-16 h-16 rounded-2xl ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} />
              <div className="text-right space-y-2">
                <div className={`h-2 w-16 rounded ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} />
                <div className={`h-6 w-12 rounded ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} />
              </div>
            </div>
            <div className={`h-5 w-2/3 rounded mb-3 ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} />
            <div className={`h-3 w-full rounded mb-2 ${isDeveloperTheme ? "bg-zinc-900" : "bg-slate-50"}`} />
            <div className={`h-3 w-4/5 rounded mb-6 ${isDeveloperTheme ? "bg-zinc-900" : "bg-slate-50"}`} />
            <div className={`h-14 w-full rounded-2xl ${isDeveloperTheme ? "bg-zinc-900" : "bg-slate-50"}`} />
          </div>
        ))}

        {/* Empty State */}
        {!loading && filteredDivisions.length === 0 && (
          <div className={`col-span-2 py-20 rounded-[2rem] border flex flex-col items-center justify-center gap-4 ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-100"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
              isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-700" : "bg-slate-50 border-slate-100 text-slate-300"
            }`}>
              <i className="fa-solid fa-building text-2xl" />
            </div>
            <div className="text-center">
              <p className={`font-black ${isDeveloperTheme ? "text-zinc-400" : "text-slate-700"}`}>
                {searchQuery ? "Divisi tidak ditemukan" : "Belum ada divisi"}
              </p>
              <p className={`text-xs font-medium mt-1 ${isDeveloperTheme ? "text-zinc-600" : "text-slate-400"}`}>
                {searchQuery ? "Coba kata kunci lain." : "Tambahkan divisi pertama Anda."}
              </p>
            </div>
          </div>
        )}

        {!loading && filteredDivisions.map((div) => {
          const badgeClass = getBadgeColors(div.color);

          return (
            <div key={div.id} onClick={() => setSelectedDivision(div)} className={`rounded-[2rem] border p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col cursor-pointer ${
                isDeveloperTheme ? "bg-[#18181b] border-zinc-800 hover:border-zinc-500 hover:shadow-zinc-900/50" : 
                isPurpleTheme ? "bg-white border-slate-200 hover:border-purple-400 hover:shadow-purple-500/10" : 
                "bg-white border-slate-200 hover:border-blue-400 hover:shadow-blue-500/10"
              }`}>
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <i className={`fa-solid ${div.icon} text-[12rem] ${isDeveloperTheme ? 'text-white' : ''}`}></i>
              </div>

              {canManage && (
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenEditForm(div);
                    }} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors ${
                      isDeveloperTheme ? "bg-zinc-800/90 backdrop-blur-md text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500" : 
                      isPurpleTheme ? "bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 hover:text-purple-600 hover:border-purple-300 hover:bg-white" : 
                      "bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-white"
                    }`}
                  >
                    <i className="fa-solid fa-pen-to-square text-sm"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(div.id, div.name, div.internCount);
                    }} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors ${
                      isDeveloperTheme ? "bg-zinc-800/90 backdrop-blur-md text-zinc-400 border-zinc-700 hover:text-rose-500 hover:bg-zinc-700 hover:border-rose-900/50" :
                      "bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-white border-slate-200"
                    }`}
                  >
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${badgeClass}`}>
                  <i className={`fa-solid ${div.icon}`}></i>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Performance</p>
                  <h4 className={`text-3xl font-black ${
                    div.performance > 80 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>{div.performance}%</h4>
                </div>
              </div>

              <h3 className={`text-2xl font-black mb-2 transition-colors relative z-10 ${
                isDeveloperTheme ? "text-zinc-200 group-hover:text-white" : 
                isPurpleTheme ? "text-slate-800 group-hover:text-purple-600" : "text-slate-800 group-hover:text-blue-600"
              }`}>{div.name}</h3>
              
              <p className={`text-[14px] font-medium leading-relaxed mb-6 line-clamp-2 relative z-10 ${
                isDeveloperTheme ? "text-zinc-400" : "text-slate-500"
              }`}>{div.description}</p>

              <div className="mb-6 relative z-10">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Penanggung Jawab (Lead)</p>
                {div.head ? (
                  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm border ${
                      isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-white text-slate-600 border-slate-200"
                    }`}>{div.head.charAt(0)}</div>
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-bold leading-tight ${isDeveloperTheme ? "text-zinc-200" : "text-slate-700"}`}>{div.head}</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase mt-0.5">Admin Aktif</span>
                    </div>
                  </div>
                ) : (
                  <span className={`text-[11px] font-black px-4 py-2.5 rounded-xl border flex items-center gap-2 w-max ${
                    isDeveloperTheme ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    <i className="fa-solid fa-triangle-exclamation animate-pulse"></i> Belum Ada Admin
                  </span>
                )}
              </div>

              <div className={`mt-auto pt-6 border-t flex items-center justify-between z-10 ${
                isDeveloperTheme ? "border-zinc-800/50" : "border-slate-100"
              }`}>
                 <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                      isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-slate-100"
                    }`}>
                       <i className={`fa-solid fa-users text-xs ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}></i>
                       <span className={`text-xs font-black ${isDeveloperTheme ? "text-zinc-400" : "text-slate-600"}`}>{div.internCount} Anggota</span>
                    </div>
                 </div>
                 <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors border ${
                    isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white group-hover:border-zinc-500" : 
                    isPurpleTheme ? "bg-purple-50 border-purple-200 text-purple-500 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600" : 
                    "bg-blue-50 border-blue-200 text-blue-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                 }`}>
                   <i className="fa-solid fa-arrow-right"></i>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Modal untuk hapus */}
      <ConfirmModal
        {...modalState}
        onClose={closeModal}
        isDark={isDeveloperTheme}
      />

      {/* ================================================================= */}
      {/* MODAL FORM TAMBAH / EDIT DIVISI                                     */}
      {/* ================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#09090b]/80 backdrop-blur-sm animate-in fade-in p-4 sm:p-6">
          <div className={`w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 border ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className={`p-6 md:p-8 flex justify-between items-center ${
              isDeveloperTheme ? "bg-[#09090b] border-b border-zinc-800 text-zinc-100" : 
              isPurpleTheme ? "bg-[#1d1633] text-white" : "bg-[#242b4d] text-white"
            }`}>
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <i className={`fa-solid fa-layer-group ${isDeveloperTheme ? "text-zinc-600" : "text-white/50"}`}></i> 
                  {formData.id ? "Edit Divisi" : "Tambah Divisi Baru"}
                </h2>
                <p className={`text-xs font-medium mt-1 ${isDeveloperTheme ? "text-zinc-500" : "text-white/60"}`}>Lengkapi informasi divisi operasional di bawah ini.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center ${
                isDeveloperTheme ? "bg-zinc-800 text-zinc-400 hover:bg-rose-500 hover:text-white" : "bg-white/10 text-white/70 hover:bg-rose-500 hover:text-white"
              }`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={`p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar ${
              isDeveloperTheme ? "bg-[#09090b]" : "bg-slate-50"
            }`}>
              <div className={`p-6 rounded-2xl border shadow-sm space-y-5 ${
                isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
              }`}>
                <div>
                  <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Nama Divisi</label>
                  <div className="relative">
                    <i className={`fa-solid fa-signature absolute left-4 top-1/2 -translate-y-1/2 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}></i>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Misal: IT Support" className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 transition-all border ${
                      isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500 placeholder:text-zinc-600" : 
                      "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-purple-500"
                    }`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Ikon FontAwesome</label>
                    <div className="relative flex items-center gap-3">
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-lg border ${
                        isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}>
                        <i className={`fa-solid ${formData.icon || 'fa-building'}`}></i>
                      </div>
                      <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} placeholder="fa-video" className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all border ${
                        isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500 placeholder:text-zinc-600" : 
                        "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-purple-500"
                      }`} />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Warna Tema (Badge)</label>
                    <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className={`w-full rounded-xl px-4 py-3 h-12 text-sm font-bold outline-none focus:ring-2 transition-all cursor-pointer border ${
                        isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500" : 
                        "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-purple-500"
                    }`}>
                      <option value="blue">Biru (Blue)</option>
                      <option value="purple">Ungu (Purple)</option>
                      <option value="emerald">Hijau (Emerald)</option>
                      <option value="rose">Merah (Rose)</option>
                      <option value="amber">Kuning (Amber)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Kepala Divisi (Opsional)</label>
                  <div className="relative">
                    <i className={`fa-solid fa-user-tie absolute left-4 top-1/2 -translate-y-1/2 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}></i>
                    <input type="text" value={formData.head} onChange={e => setFormData({...formData, head: e.target.value})} placeholder="Nama penanggung jawab..." className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all border ${
                        isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500 placeholder:text-zinc-600" : 
                        "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-purple-500"
                    }`} />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Deskripsi Tugas</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" placeholder="Jelaskan peran divisi ini..." className={`w-full rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 resize-none transition-all border ${
                        isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500 placeholder:text-zinc-600" : 
                        "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-purple-500"
                  }`}></textarea>
                </div>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className={`w-1/3 py-4 font-bold rounded-xl transition-colors border ${
                  isDeveloperTheme ? "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>Batal</button>
                <button type="submit" className={`w-2/3 py-4 text-white font-black tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all ${
                  isDeveloperTheme ? 'bg-zinc-800 hover:bg-zinc-700 shadow-zinc-900/30 border border-zinc-700' : 
                  isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                }`}>
                   <i className="fa-solid fa-floppy-disk"></i> {formData.id ? "Simpan Perubahan" : "Simpan Divisi Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: FULL-SCREEN PROFILE DETAIL DIVISI (REDESIGNED)             */}
      {/* ================================================================= */}
      {selectedDivision && (
        <div className={`fixed inset-0 z-[300] flex flex-col animate-in fade-in duration-300 ${
          isDeveloperTheme ? "bg-[#09090b]" : "bg-slate-50"
        }`}>
          
          {/* Top Bar Header Fullscreen */}
          <div className={`px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white shadow-lg ${
                isDeveloperTheme ? 'bg-zinc-800 shadow-zinc-900/50 border border-zinc-700' : 
                isPurpleTheme ? 'bg-purple-600 shadow-purple-600/30' : 'bg-blue-600 shadow-blue-600/30'
              }`}>
                <i className={`fa-solid ${selectedDivision.icon}`}></i>
              </div>
              <div>
                <h2 className={`text-2xl font-black leading-tight ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>{selectedDivision.name}</h2>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Profil Lengkap Divisi</p>
              </div>
            </div>
            <button onClick={() => setSelectedDivision(null)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors ${
              isDeveloperTheme ? "bg-zinc-800 text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500 border border-zinc-700" : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
            }`}>
              <i className="fa-solid fa-arrow-left"></i> Kembali
            </button>
          </div>

          {/* Fullscreen Body Content (REDESIGNED: Clean Profile View without percentages) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              
              {/* KOLOM KIRI (Info Divisi & Jobdesk Utama) */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Deskripsi & Info Kepala */}
                <div className={`rounded-[2rem] p-8 md:p-10 border shadow-sm ${
                  isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
                }`}>
                   <h3 className={`text-lg font-black mb-4 ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>Tentang Divisi</h3>
                   <p className={`text-[15px] font-medium leading-relaxed ${isDeveloperTheme ? "text-zinc-400" : "text-slate-600"}`}>
                     {selectedDivision.description}
                   </p>
                   
                   <div className={`mt-8 pt-8 border-t flex items-center gap-4 ${isDeveloperTheme ? "border-zinc-800/50" : "border-slate-100"}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border shadow-sm ${
                        isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                         {selectedDivision.head ? selectedDivision.head.charAt(0) : <i className="fa-solid fa-user-slash"></i>}
                      </div>
                      <div>
                         <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Penanggung Jawab (Lead)</p>
                         <p className={`text-base font-bold ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>
                           {selectedDivision.head || "Belum Ada Admin"}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Jobdesk (Tugas Utama) - Tanpa Progress Bar */}
                <div className={`rounded-[2rem] p-8 md:p-10 border shadow-sm ${
                  isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
                }`}>
                  <h3 className={`text-lg font-black mb-6 flex items-center gap-3 ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>
                    <i className={`fa-solid fa-clipboard-check text-xl ${isDeveloperTheme ? 'text-zinc-500' : isPurpleTheme ? 'text-purple-500' : 'text-blue-500'}`}></i> 
                    Tanggung Jawab Utama
                  </h3>
                  
                  {selectedDivision.jobDescriptions?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDivision.jobDescriptions.map((job, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-4 rounded-2xl border ${
                          isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <i className={`fa-solid fa-circle-check mt-1 ${isDeveloperTheme ? "text-zinc-600" : "text-emerald-500"}`}></i>
                          <span className={`text-[13px] font-bold leading-snug ${isDeveloperTheme ? "text-zinc-300" : "text-slate-700"}`}>{job.task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 rounded-xl border ${
                      isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-slate-100"
                    }`}>
                      <p className={`text-sm font-medium ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Belum ada rincian tanggung jawab.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* KOLOM KANAN (Daftar Anggota & Leaderboard) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Daftar Anggota */}
                <div className={`rounded-[2rem] p-6 border shadow-sm ${
                  isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-sm font-black flex items-center gap-3 ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>
                      <i className={`fa-solid fa-users text-lg ${isDeveloperTheme ? 'text-zinc-500' : isPurpleTheme ? 'text-purple-500' : 'text-blue-500'}`}></i> 
                      Anggota Tim
                    </h3>
                    <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                      isDeveloperTheme ? "text-zinc-400 bg-zinc-800" : "text-slate-500 bg-slate-100"
                    }`}>{selectedDivision.internCount} User</span>
                  </div>

                  <div className="space-y-3">
                    {selectedDivision.members?.length > 0 ? (
                      selectedDivision.members.map((member, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors border ${
                          isDeveloperTheme ? "bg-[#27272a]/40 border-zinc-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm ${
                            isDeveloperTheme ? 'bg-zinc-700' : isPurpleTheme ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {member.avatar}
                          </div>
                          <div>
                            <p className={`text-sm font-black leading-tight ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>{member.name}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>{member.role}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`py-6 text-center rounded-xl border ${isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800 text-zinc-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                        <p className="text-xs font-medium">Belum ada anggota.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Interns */}
                <div className={`rounded-[2rem] p-6 border shadow-sm ${
                  isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
                }`}>
                   <h3 className={`text-sm font-black mb-6 flex items-center gap-3 ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>
                     <i className="fa-solid fa-fire text-orange-500 text-lg"></i> Top Interns
                   </h3>
                   <div className="space-y-3">
                     {selectedDivision.leaderboard?.length > 0 ? selectedDivision.leaderboard.map((intern, idx) => (
                       <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                         idx === 0 
                           ? (isDeveloperTheme ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50/50 border-orange-200 shadow-sm") 
                           : (isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-white border-slate-100")
                       }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm ${
                              idx === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30" : 
                              idx === 1 ? (isDeveloperTheme ? "bg-zinc-700 text-zinc-300" : "bg-slate-200 text-slate-600") : 
                              (isDeveloperTheme ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")
                            }`}>
                              {idx === 0 ? <i className="fa-solid fa-trophy text-[10px]"></i> : idx + 1}
                            </div>
                             <div className="min-w-0">
                              <p className={`text-sm font-black leading-tight truncate max-w-[150px] sm:max-w-xs ${
                                isDeveloperTheme && idx === 0 ? "text-orange-400" : 
                                isDeveloperTheme ? "text-zinc-200" : "text-slate-800"
                              }`}>{intern.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap ${
                                intern.status === 'Warning' ? 'text-rose-500' : (isDeveloperTheme ? 'text-zinc-500' : 'text-slate-400')
                              }`}>{intern.status}</p>
                             </div>
                          </div>
                       </div>
                     )) : (
                       <div className={`border rounded-2xl p-6 text-center ${
                         isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-slate-50 border-slate-100"
                       }`}>
                          <p className={`text-xs font-medium ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Leaderboard kosong.</p>
                       </div>
                     )}
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DivisionAnalytics;