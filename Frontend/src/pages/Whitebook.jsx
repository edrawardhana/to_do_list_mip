import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Whitebook = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  
  // HANYA Admin Divisi yang bisa Edit (Superadmin & Dev cuma mantau)
  const canEdit = isAdmin && !isSuperAdmin && !isDeveloper; 
  const canViewAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS KASTA TERTINGGI
  // ==========================================
  const isDeveloperTheme = isDeveloper; // Tema Dimmed Zinc (Gak terlalu gelap, gak silau)
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; // Tema Ungu VVIP
  const isBlueTheme = isAdmin && !isSuperAdmin && !isDeveloperTheme; // Tema Biru Admin

  // ==========================================
  // DUMMY DATA
  // ==========================================
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "IT Support" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: "", type: "link", file_url: "" });

  // FETCH DATA SOP DARI BACKEND
  const fetchWhitebooks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/whiteboards');
      setDocuments(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Gagal memuat SOP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWhitebooks(); }, []);

  // Logic Filter
  const sideMenuItems = useMemo(() => {
    return documents.filter(doc => {
      const isCorrectCategory = canViewAll 
        ? (doc.category === selectedDiv || doc.category === "General")
        : (doc.category === myDivision || doc.category === "General");
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return isCorrectCategory && matchesSearch;
    });
  }, [documents, selectedDiv, canViewAll, myDivision, searchQuery]);

  const activeDoc = useMemo(() => {
    if (!activeDocId && sideMenuItems.length > 0) return sideMenuItems[0];
    return sideMenuItems.find(d => d.id === activeDocId) || sideMenuItems[0];
  }, [activeDocId, sideMenuItems]);

  // --- FUNGSI CRUD ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/whiteboards/${formData.id}`, formData);
        toast.success("SOP berhasil diperbarui!");
      } else {
        const iconMap = { "pdf": "fa-file-pdf", "image": "fa-image", "link": "fa-link" };
        const payload = { ...formData, icon: iconMap[formData.type] || "fa-book" };
        await api.post('/whiteboards', payload);
        toast.success("SOP baru berhasil ditambahkan!");
      }
      fetchWhitebooks();
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan SOP.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus dokumen ini secara permanen?")) {
      try {
        await api.delete(`/whiteboards/${id}`);
        toast.success("SOP berhasil dihapus!");
        fetchWhitebooks();
        setActiveDocId(null);
      } catch (error) {
        toast.error("Gagal menghapus SOP.");
      }
    }
  };

  const openEditForm = (doc) => {
    setFormData(doc);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setFormData({ id: null, title: "", type: "link", file_url: "" });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION - TEMA DINAMIS SESUAI ROLE                           */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col border ${
        isDeveloperTheme ? "bg-[#18181b] border-[#27272a] shadow-zinc-900/20" :
        isPurpleTheme ? "bg-[#1d1633] border-[#342459]" : 
        isBlueTheme ? "bg-[#242b4d] border-[#303861]" : 
        "bg-gradient-to-br from-[#0b1437] to-[#111c44] border-white/5 shadow-sky-900/10"
      }`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isDeveloperTheme ? "bg-zinc-600/10" :
          isPurpleTheme ? "bg-purple-500/10" : 
          isBlueTheme ? "bg-blue-500/10" : 
          "bg-sky-500/20"
        }`}></div>
        
        {/* Bagian Info Hero Atas */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg border ${
                isDeveloperTheme ? "bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-zinc-900/30 border-zinc-600/50" :
                isPurpleTheme ? "bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/30 border-purple-400/50" : 
                isBlueTheme ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30 border-blue-400/50" : 
                "bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-500/30 border-sky-400/50"
              }`}>
                <i className="fa-solid fa-book-bookmark text-lg"></i>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                isDeveloperTheme ? "text-zinc-400" :
                isPurpleTheme ? "text-purple-400" : 
                isBlueTheme ? "text-blue-400" : 
                "text-sky-300"
              }`}>
                Whitebook System
              </span>
            </div>
            
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white ${
              isDeveloperTheme ? "to-zinc-400" :
              isPurpleTheme ? "to-purple-200" : 
              isBlueTheme ? "to-blue-200" : 
              "to-sky-200"
            }`}>
              Knowledge & Guide
            </h1>
            
            {/* WIDGET ANIMASI */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`animate-[spin_3s_linear_infinite] ${isDeveloperTheme ? 'text-zinc-400' : isPurpleTheme ? 'text-purple-400' : isBlueTheme ? 'text-blue-400' : 'text-sky-400'}`} />
                </svg>
                <i className={`fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] ${isDeveloperTheme ? 'text-zinc-400' : isPurpleTheme ? 'text-purple-400' : isBlueTheme ? 'text-blue-400' : 'text-sky-400'}`}></i>
              </div>

              <div className="h-6 w-px bg-white/20 rounded-full"></div>

              <div className="flex gap-2">
                <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                    isDeveloperTheme ? 'bg-zinc-800/40 border-zinc-600/30 text-zinc-300' :
                    isPurpleTheme ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' : 
                    isBlueTheme ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' : 
                    'bg-sky-500/20 border-sky-400/30 text-sky-200'
                }`}>
                  <i className="fa-solid fa-database text-[10px]"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">SOP Synced</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                    isDeveloperTheme ? 'bg-stone-700/30 border-stone-600/30 text-stone-300' :
                    isPurpleTheme ? 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200' : 
                    isBlueTheme ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' : 
                    'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                }`} style={{ animationDelay: '500ms' }}>
                  <i className="fa-solid fa-shield-halved text-[10px]"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">{isDeveloperTheme ? 'Dev Mode' : isPurpleTheme ? 'Superadmin Mode' : 'Secured'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET KANAN WHITEBOOK */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                isDeveloperTheme ? "bg-zinc-600/30 text-zinc-300" :
                isPurpleTheme ? "bg-purple-500/20 text-purple-400" : 
                isBlueTheme ? "bg-blue-500/20 text-blue-400" : 
                "bg-sky-500/20 text-sky-400"
              }`}>
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <span className={`text-2xl font-black leading-none mb-1 ${isDeveloperTheme ? 'text-zinc-200' : 'text-white'}`}>{documents?.length || 0}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold ${isDeveloperTheme ? 'text-zinc-400' : 'text-slate-400'}`}>Total SOP</span>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                isDeveloperTheme ? "bg-zinc-600/30 text-zinc-300" :
                isPurpleTheme ? "bg-fuchsia-500/20 text-fuchsia-400" : 
                "bg-emerald-500/20 text-emerald-400"
              }`}>
                <i className={`fa-solid ${isPurpleTheme || isDeveloperTheme ? "fa-eye" : "fa-shield-check"}`}></i>
              </div>
              <span className={`text-sm font-black leading-none mb-1 mt-1 ${isDeveloperTheme ? 'text-zinc-200' : 'text-white'}`}>{isPurpleTheme || isDeveloperTheme ? "Read-Only" : "Up to date"}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${isDeveloperTheme ? 'text-zinc-400' : 'text-slate-400'}`}>{isPurpleTheme || isDeveloperTheme ? "Akses Terkunci" : "Status Sistem"}</span>
            </div>
          </div>
        </div>

        {/* Bagian Bawah Hero: Switcher Divisi Khusus VVIP */}
        {canViewAll && (
          <div className={`relative z-10 border-t px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-xl ${
             isDeveloperTheme ? "bg-[#18181b] border-zinc-800" :
             isPurpleTheme ? "bg-[#18112a] border-[#342459]" : 
             isBlueTheme ? "bg-[#1e2442] border-[#303861]" : 
             "bg-white/5 border-white/10"
          }`}>
             <label className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${
               isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-300" : "text-blue-300"
             }`}>
               <i className={`fa-solid fa-layer-group ${isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-400" : "text-blue-400"}`}></i> Pantau SOP Divisi:
             </label>
             <div className="relative w-full sm:w-72">
               <select 
                 value={selectedDiv} 
                 onChange={(e) => { setSelectedDiv(e.target.value); setActiveDocId(null); setSearchQuery(""); }}
                 className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 appearance-none cursor-pointer shadow-inner transition-all border ${
                    isDeveloperTheme ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-zinc-500" :
                    isPurpleTheme ? "bg-[#1d1633] border-[#342459] text-white focus:ring-purple-400" : 
                    isBlueTheme ? "bg-[#242b4d] border-[#303861] text-white focus:ring-blue-400" : 
                    "bg-blue-900/50 border-white/10 text-white focus:ring-blue-400"
                 }`}
               >
                 <option className="text-slate-800" value="IT Support">IT Support</option>
                 <option className="text-slate-800" value="Multimedia">Multimedia</option>
                 <option className="text-slate-800" value="Public Relation">Public Relation</option>
               </select>
               <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${
                 isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-300" : "text-blue-300"
               }`}></i>
             </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MAIN LAYOUT                                                       */}
      {/* ================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR DAFTAR ISI */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-4">
          <div className={`rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[750px] ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center shrink-0 ${
              isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-slate-50/50 border-slate-100"
            }`}>
              <h3 className={`font-black text-xs tracking-widest uppercase font-sans ${isDeveloperTheme ? "text-zinc-300" : "text-slate-800"}`}>Daftar Isi</h3>
              {canEdit && (
                <button onClick={openCreateForm} className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-md transition-all ${
                  isDeveloperTheme ? 'bg-zinc-700 hover:bg-zinc-600' :
                  isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                  <i className="fa-solid fa-plus text-[10px]"></i>
                </button>
              )}
            </div>

            <div className="px-5 pt-5 shrink-0">
              <div className="relative group">
                <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                  isDeveloperTheme ? 'text-zinc-500 group-focus-within:text-zinc-300' :
                  isPurpleTheme ? 'text-slate-400 group-focus-within:text-purple-500' : 'text-slate-400 group-focus-within:text-blue-500'
                }`}></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari panduan..."
                  className={`w-full border rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 ${
                    isDeveloperTheme ? 'bg-[#27272a] border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:ring-zinc-600' :
                    'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:ring-purple-500/20'
                  }`}
                />
              </div>
            </div>
            
            <div className="p-3 mt-2 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar min-h-[300px]">
              {sideMenuItems.length === 0 ? (
                <div className="text-center py-10">
                  <i className={`fa-solid fa-folder-open text-3xl mb-2 ${isDeveloperTheme ? "text-zinc-700" : "text-slate-200"}`}></i>
                  <p className={`text-xs font-bold ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Belum ada SOP.</p>
                </div>
              ) : (
                sideMenuItems.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      activeDoc?.id === doc.id 
                        ? (isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-lg shadow-zinc-900/50 translate-x-1" :
                           isPurpleTheme ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20 translate-x-1" : 
                           "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1")
                        : (isDeveloperTheme ? "bg-[#18181b] border-transparent text-zinc-400 hover:bg-zinc-800/50" : "bg-white border-transparent text-slate-600 hover:bg-slate-50")
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${doc.icon} text-sm ${
                        activeDoc?.id === doc.id 
                          ? "text-zinc-100" 
                          : (isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-500" : "text-blue-500")
                      }`}></i>
                      <div>
                        <p className={`text-[12px] font-black leading-tight line-clamp-1 ${activeDoc?.id === doc.id ? "text-zinc-100" : isDeveloperTheme ? "text-zinc-300" : "text-slate-700"}`}>{doc.title}</p>
                        <p className={`text-[9px] mt-1 font-black uppercase tracking-widest ${
                          activeDoc?.id === doc.id 
                            ? (isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200" : "text-blue-200") 
                            : (isDeveloperTheme ? "text-zinc-600" : "text-slate-400")
                        }`}>
                          {doc.category}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* DETAIL CONTENT */}
        <main className={`flex-1 rounded-[3rem] border shadow-sm flex flex-col overflow-hidden min-h-[600px] lg:max-h-[750px] ${
          isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
        }`}>
          {activeDoc ? (
            <>
              {/* HEADER BAGIAN DETAIL SOP */}
              <div className={`p-8 md:p-12 pb-5 border-b shrink-0 ${
                isDeveloperTheme ? "bg-[#1f1f22] border-zinc-800" : "bg-slate-50/30 border-slate-100"
              }`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shrink-0 ${
                      isDeveloperTheme ? "bg-zinc-800 text-zinc-300 shadow-zinc-900/50 border border-zinc-700" :
                      isPurpleTheme ? "bg-purple-600 text-white shadow-purple-600/20" : 
                      "bg-blue-600 text-white shadow-blue-600/20"
                    }`}>
                      <i className={`fa-solid ${activeDoc.icon}`}></i>
                    </div>
                    <div>
                      <h2 className={`text-3xl font-black tracking-tighter leading-none mb-2 ${
                        isDeveloperTheme ? "text-zinc-100" : "text-slate-800"
                      }`}>{activeDoc.title}</h2>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                        isDeveloperTheme ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                        isPurpleTheme ? "bg-purple-100 text-purple-600 border-purple-200" : 
                        "bg-blue-100 text-blue-600 border-blue-200"
                      }`}>
                        Verified SOP
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
                      <button onClick={() => openEditForm(activeDoc)} className={`px-4 py-2.5 border rounded-xl text-[11px] font-black transition-colors shadow-sm flex items-center gap-2 ${
                        isDeveloperTheme ? "bg-zinc-800 text-amber-500 border-zinc-700 hover:bg-zinc-700" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                      }`}>
                        <i className="fa-solid fa-pen-to-square"></i> EDIT
                      </button>
                      <button onClick={() => handleDelete(activeDoc.id)} className={`px-4 py-2.5 border rounded-xl text-[11px] font-black transition-colors shadow-sm flex items-center gap-2 ${
                        isDeveloperTheme ? "bg-zinc-800 text-rose-500 border-zinc-700 hover:bg-zinc-700" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                      }`}>
                        <i className="fa-solid fa-trash"></i> HAPUS
                      </button>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-4 ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isDeveloperTheme ? "bg-zinc-700 text-zinc-300" : "bg-slate-800 text-white"
                    }`}>{activeDoc.author.charAt(0)}</div>
                    <p className={`text-[11px] font-bold ${isDeveloperTheme ? "text-zinc-400" : "text-slate-600"}`}>{activeDoc.author}</p>
                  </div>
                  <div className={`h-4 w-[1px] ${isDeveloperTheme ? "bg-zinc-700" : "bg-slate-200"}`}></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest"><i className="fa-regular fa-calendar-alt mr-1"></i> {activeDoc.date}</p>
                </div>
              </div>

              {/* ISI KONTEN */}
              <div className="px-8 py-5 md:px-12 md:py-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {activeDoc.type === 'image' && (
                   <img src={activeDoc.file_url} alt={activeDoc.title} className="max-w-full rounded-xl border border-slate-200 shadow-sm mx-auto" />
                )}
                {activeDoc.type === 'pdf' && (
                   <iframe src={activeDoc.file_url} className="w-full h-[600px] rounded-xl border border-slate-200 shadow-sm"></iframe>
                )}
                {(!activeDoc.type || activeDoc.type === 'link') && (
                   <div className="text-center py-12 m-auto">
                     <i className={`fa-solid fa-link text-5xl mb-4 ${isDeveloperTheme ? 'text-zinc-700' : 'text-slate-200'}`}></i>
                     <p className={`mb-6 text-sm font-medium ${isDeveloperTheme ? 'text-zinc-400' : 'text-slate-500'}`}>Dokumen ini berupa tautan eksternal (Google Drive / Web).</p>
                     <a href={activeDoc.file_url} target="_blank" rel="noreferrer" className={`px-6 py-3 text-white rounded-xl font-bold shadow-md transition-colors ${isDeveloperTheme ? 'bg-zinc-700 hover:bg-zinc-600' : isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                       Buka Tautan <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                     </a>
                   </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               <i className={`fa-solid fa-book-open text-6xl mb-4 ${isDeveloperTheme ? "text-zinc-800" : "text-slate-100"}`}></i>
               <h3 className={`font-bold uppercase tracking-widest text-xs ${isDeveloperTheme ? "text-zinc-600" : "text-slate-400"}`}>Pilih dokumen untuk dibaca</h3>
            </div>
          )}
        </main>
      </div>

      {/* MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 ${
            isDeveloperTheme ? "bg-[#18181b] border border-zinc-800" : "bg-white"
          }`}>
            <h2 className={`text-xl font-black mb-6 ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>
              {formData.id ? "Edit SOP" : "Tambah SOP Baru"}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-500'}`}>Judul SOP</label>
                <input 
                  type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className={`w-full p-3 rounded-xl border outline-none text-sm ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-500'}`}>Tipe Format</label>
                <select 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                  className={`w-full p-3 rounded-xl border outline-none text-sm cursor-pointer ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="link">Link Eksternal (Google Drive / Notion)</option>
                  <option value="pdf">PDF Dokumen</option>
                  <option value="image">Gambar (JPEG/PNG)</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-500'}`}>URL File / Tautan</label>
                <input 
                  type="url" required value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})}
                  placeholder="https://..."
                  className={`w-full p-3 rounded-xl border outline-none text-sm ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  Batal
                </button>
                <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-all ${isDeveloperTheme ? 'bg-blue-600 hover:bg-blue-500' : isPurpleTheme ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Whitebook;