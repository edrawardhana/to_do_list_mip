import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Whitebook = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();

  // Role Logic: Pastikan Admin beneran admin divisi, bukan superadmin yang bawa hak admin
  const isAdmin = user?.role === 'admin';
  const myDivision = user?.division?.name || user?.division_name || "IT Support";
  
  // Hak Akses
  const canEdit = isAdmin && !isSuperAdmin; // HANYA Admin divisi yang bisa CRUD
  const canViewAll = isSuperAdmin; // HANYA Superadmin yang bisa liat semua

  // ==========================================
  // BLOKIR DEVELOPER
  // ==========================================
  if (isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-in fade-in zoom-in duration-500">
        <i className="fa-solid fa-ban text-6xl text-rose-500 mb-5 animate-bounce"></i>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Akses Ditolak</h1>
        <p className="text-sm font-medium text-slate-500">
          Fitur Whitebook & SOP tidak diperuntukkan bagi Developer.
        </p>
      </div>
    );
  }

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO VVIP, BAWAH LIGHT MODE)
  // ==========================================
  const isPurpleTheme = isSuperAdmin;

  const theme = {
    // --- HERO THEME (GELAP/VVIP) ---
    heroBg: isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" : "bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 border-blue-500 shadow-blue-900/20",
    blobTop: isPurpleTheme ? "bg-purple-500/20" : "bg-white/10",
    blobBot: isPurpleTheme ? "bg-fuchsia-500/10" : "bg-white/5",
    iconBg: isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" : "bg-white/20 border-white/20 text-white shadow-inner",
    badgeBg: isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" : "text-blue-100 bg-black/20 border-white/10",
    title: "text-white",
    subtitle: isPurpleTheme ? "text-purple-200/70" : "text-blue-100/90",
    widgetBg: isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" : "bg-white/10 border-white/20 backdrop-blur-md",
    progressIcon: isPurpleTheme ? "text-purple-400" : "text-blue-200",
    
    // --- WHITESPACE FILLER BADGES ---
    heroBadge: isPurpleTheme ? "bg-purple-900/50 border-purple-700/50 text-purple-200" : "bg-black/20 border-white/10 text-white",
    heroBadgeActive: isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-300" : "bg-emerald-500/20 border-emerald-400/30 text-emerald-300",
    dotActive: isPurpleTheme ? "bg-purple-400" : "bg-emerald-400",

    // --- TOOLBAR BAWAH (BACKGROUND NYATU SAMA HERO, TAPI INPUT NYA PUTIH) ---
    toolbarBorder: isPurpleTheme ? "border-purple-700/30" : "border-white/10",
    toolbarBg: isPurpleTheme ? "bg-[#281c47]" : "bg-blue-900/40",
    inputBg: "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 shadow-sm",
    iconMuted: "text-slate-400",

    // --- PANELS THEME (100% LIGHT MODE UNTUK SEMUA) ---
    panelBg: "bg-white border-slate-200",
    panelHead: "bg-slate-50/80 border-slate-100",
    textPrimary: "text-slate-800",
    textSecondary: "text-slate-500",
    sidebarHover: "hover:bg-slate-50 hover:border-slate-300",
    sidebarActive: isPurpleTheme ? "bg-purple-600 border-purple-500 text-white shadow-purple-900/20" : "bg-blue-600 border-blue-500 text-white shadow-blue-900/20",
    sidebarActiveIcon: "text-white",
    sidebarInactiveIcon: isPurpleTheme ? "text-purple-500" : "text-blue-500",
  };

  const [documents, setDocuments] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "semua" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: "", type: "link", file_url: "" });

  const fetchWhitebooks = async () => {
    setIsLoading(true);
    try {
      const [docsRes, divsRes] = await Promise.all([
        api.get('/whiteboards'),
        isSuperAdmin ? api.get('/divisions') : Promise.resolve({ data: { data: [] } })
      ]);
      
      setDocuments(docsRes.data?.data || docsRes.data || []);
      
      if (isSuperAdmin) {
        const divs = divsRes.data?.data || divsRes.data || [];
        setDivisionsList(divs.map(d => d.name));
      }
    } catch (error) {
      toast.error("Gagal memuat SOP");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWhitebooks(); }, []);

  // Logic Filter
  const sideMenuItems = useMemo(() => {
    return documents.filter(doc => {
      let isCorrectCategory = false;
      if (isSuperAdmin) {
        isCorrectCategory = selectedDiv === "semua" ? true : (doc.category === selectedDiv || doc.category === "General");
      } else {
        isCorrectCategory = (doc.category === myDivision || doc.category === "General");
      }
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return isCorrectCategory && matchesSearch;
    });
  }, [documents, selectedDiv, isSuperAdmin, myDivision, searchQuery]);

  const activeDoc = useMemo(() => {
    if (!activeDocId && sideMenuItems.length > 0) return sideMenuItems[0];
    return sideMenuItems.find(d => d.id === activeDocId) || sideMenuItems[0];
  }, [activeDocId, sideMenuItems]);

  // --- FUNGSI CRUD (KHUSUS ADMIN DIVISI) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      if (formData.id) {
        await api.put(`/whiteboards/${formData.id}`, formData);
        toast.success("SOP berhasil diperbarui!");
      } else {
        const iconMap = { "pdf": "fa-file-pdf", "image": "fa-image", "link": "fa-link" };
        const payload = { ...formData, category: myDivision, icon: iconMap[formData.type] || "fa-book" };
        await api.post('/whiteboards', payload);
        toast.success("SOP baru berhasil ditambahkan!");
      }
      fetchWhitebooks();
      setIsFormOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan SOP.");
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (TETAP VVIP)                                         */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 pb-8 sm:pb-10">
          
          <div className="lg:max-w-xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-book-bookmark text-lg md:text-xl" />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-3 py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Whitebook System
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Knowledge & Guide.
            </h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Pusat panduan dan SOP resmi. Pelajari semua prosedur operasional standar dan dokumentasi teknis di sini.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors duration-500 ${theme.heroBadge}`}>
                <i className="fa-regular fa-calendar-check opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors duration-500 ${theme.heroBadgeActive}`}>
                 <span className="relative flex h-2 w-2 shrink-0">
                   <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotActive}`}></span>
                   <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dotActive}`}></span>
                 </span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Database Synced</span>
              </div>
            </div>
          </div>

          <div className={`w-full lg:w-80 shrink-0 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col justify-center gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Whitebook Summary</span>
              <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded-md">
                {isSuperAdmin ? (selectedDiv === "semua" ? "Global Mode" : selectedDiv) : myDivision}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.progressIcon}`}>Total SOP</span>
                <span className="text-3xl sm:text-4xl font-black text-white leading-none">{sideMenuItems.length} <span className="text-sm font-bold text-white/50">File</span></span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.progressIcon}`}>Status</span>
                <span className="text-xl sm:text-2xl font-black text-white leading-none mt-1">{isPurpleTheme ? "Secured" : "Updated"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR LANTAI: SEARCH & DIVISION SWITCHER (INPUT PUTIH/LIGHT) */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-8 py-3 sm:py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <i className={`fa-solid fa-layer-group transition-colors text-white/50`}></i>
             {canViewAll ? (
               <div className="relative">
                 <select
                   value={selectedDiv}
                   onChange={(e) => { setSelectedDiv(e.target.value); setActiveDocId(null); setSearchQuery(""); }}
                   className={`rounded-lg pl-3 pr-8 py-2 text-[11px] sm:text-xs font-bold outline-none cursor-pointer transition-colors appearance-none ${theme.inputBg}`}
                 >
                   <option value="semua">Global (Semua Divisi)</option>
                   {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
                 <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-slate-400" />
               </div>
             ) : (
               <p className={`text-[10px] sm:text-xs font-bold transition-colors text-white uppercase tracking-wider`}>
                 Divisi {myDivision}
               </p>
             )}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder="Cari dokumen SOP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none transition-colors ${theme.inputBg}`} />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MAIN LAYOUT (2 KOLOM: SIDEBAR & KONTEN) - 100% LIGHT MODE         */}
      {/* ================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* SIDEBAR DAFTAR ISI */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-4">
          <div className={`rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[750px] transition-colors duration-500 ${theme.panelBg}`}>
            <div className={`p-6 border-b flex justify-between items-center shrink-0 transition-colors duration-500 ${theme.panelHead}`}>
              <h3 className={`font-black text-xs tracking-widest uppercase ${theme.textPrimary}`}>Daftar Isi</h3>
              {/* TOMBOL PLUS HANYA MUNCUL JIKA ADMIN DIVISI */}
              {canEdit && (
                <button onClick={openCreateForm} className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-md transition-all active:scale-95 bg-blue-600 hover:bg-blue-700`}>
                  <i className="fa-solid fa-plus text-[10px]"></i>
                </button>
              )}
            </div>

            <div className="p-3 mt-2 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                  <i className={`fa-solid fa-circle-notch fa-spin text-2xl mb-2 ${theme.textSecondary}`}></i>
                  <p className={`text-xs font-bold ${theme.textSecondary}`}>Memuat SOP...</p>
                </div>
              ) : sideMenuItems.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <i className={`fa-solid fa-folder-open text-3xl mb-2 text-slate-300`}></i>
                  <p className={`text-xs font-bold ${theme.textSecondary}`}>Belum ada SOP.</p>
                </div>
              ) : (
                sideMenuItems.map((doc) => {
                  const isActive = activeDoc?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        isActive 
                          ? `${theme.sidebarActive} translate-x-1` 
                          : `bg-transparent border-transparent ${theme.textSecondary} ${theme.sidebarHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fa-solid ${doc.icon} text-sm ${isActive ? theme.sidebarActiveIcon : theme.sidebarInactiveIcon}`}></i>
                        <div>
                          <p className={`text-[12px] font-black leading-tight line-clamp-1 ${isActive ? "text-white" : theme.textPrimary}`}>{doc.title}</p>
                          <p className={`text-[9px] mt-1 font-black uppercase tracking-widest ${isActive ? "text-white/70" : theme.textSecondary}`}>
                            {doc.category}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* DETAIL CONTENT */}
        <main className={`flex-1 rounded-[3rem] border shadow-sm flex flex-col overflow-hidden min-h-[600px] lg:max-h-[750px] transition-colors duration-500 ${theme.panelBg}`}>
          {activeDoc ? (
            <>
              {/* HEADER BAGIAN DETAIL SOP */}
              <div className={`p-8 md:p-12 pb-5 border-b shrink-0 transition-colors duration-500 ${theme.panelHead}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shrink-0 ${isPurpleTheme ? "bg-purple-600 text-white shadow-purple-600/20" : "bg-blue-600 text-white shadow-blue-600/20"}`}>
                      <i className={`fa-solid ${activeDoc.icon}`}></i>
                    </div>
                    <div>
                      <h2 className={`text-2xl md:text-3xl font-black tracking-tighter leading-none mb-2 ${theme.textPrimary}`}>{activeDoc.title}</h2>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${isPurpleTheme ? "bg-purple-100 text-purple-600 border-purple-200" : "bg-blue-100 text-blue-600 border-blue-200"}`}>
                        Verified SOP
                      </span>
                    </div>
                  </div>

                  {/* TOMBOL CRUD (HANYA MUNCUL JIKA ADMIN DIVISI) */}
                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
                      <button onClick={() => openEditForm(activeDoc)} className="px-4 py-2.5 border rounded-xl text-[11px] font-black transition-colors shadow-sm flex items-center gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100">
                        <i className="fa-solid fa-pen-to-square"></i> EDIT
                      </button>
                      <button onClick={() => handleDelete(activeDoc.id)} className="px-4 py-2.5 border rounded-xl text-[11px] font-black transition-colors shadow-sm flex items-center gap-2 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100">
                        <i className="fa-solid fa-trash"></i> HAPUS
                      </button>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-4 ${theme.textSecondary}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] bg-slate-800 text-white`}>
                      {activeDoc.author ? activeDoc.author.charAt(0) : "A"}
                    </div>
                    <p className={`text-[11px] font-bold ${theme.textPrimary}`}>{activeDoc.author || "Admin"}</p>
                  </div>
                  <div className={`h-4 w-[1px] bg-slate-200`}></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest"><i className="fa-regular fa-calendar-alt mr-1"></i> {activeDoc.date}</p>
                </div>
              </div>

              {/* ISI KONTEN */}
              <div className="px-8 py-5 md:px-12 md:py-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-white">
                {activeDoc.type === 'image' && (
                  <img src={activeDoc.file_url} alt={activeDoc.title} className={`max-w-full rounded-xl border shadow-sm mx-auto border-slate-200`} />
                )}
                {activeDoc.type === 'pdf' && (
                  <iframe src={activeDoc.file_url} className={`w-full h-[600px] rounded-xl border shadow-sm border-slate-200`}></iframe>
                )}
                {(!activeDoc.type || activeDoc.type === 'link') && (
                  <div className="text-center py-12 m-auto">
                    <i className={`fa-solid fa-link text-5xl mb-4 text-slate-300`}></i>
                    <p className={`mb-6 text-sm font-medium ${theme.textSecondary}`}>Dokumen ini berupa tautan eksternal (Google Drive / Web / Notion).</p>
                    <a href={activeDoc.file_url} target="_blank" rel="noreferrer" className={`px-6 py-3 text-white rounded-xl font-bold shadow-md transition-colors ${isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      Buka Tautan <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <i className={`fa-solid fa-book-open text-6xl mb-4 opacity-30 text-slate-400`}></i>
              <h3 className={`font-bold uppercase tracking-widest text-xs opacity-70 ${theme.textSecondary}`}>Pilih dokumen untuk dibaca</h3>
            </div>
          )}
        </main>
      </div>

      {/* MODAL FORM EDIT/CREATE (HANYA MUNCUL BUAT ADMIN DIVISI) */}
      {isFormOpen && canEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 bg-white border border-slate-200">
            <h2 className="text-xl font-black mb-6 text-slate-800">
              {formData.id ? "Edit SOP" : "Tambah SOP Baru"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block text-slate-500">Judul SOP</label>
                <input
                  type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3.5 rounded-xl border outline-none text-sm transition-colors bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block text-slate-500">Tipe Format</label>
                <select
                  value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-3.5 rounded-xl border outline-none text-sm cursor-pointer transition-colors bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500"
                >
                  <option value="link">Link Eksternal (Google Drive / Notion)</option>
                  <option value="pdf">PDF Dokumen</option>
                  <option value="image">Gambar (JPEG/PNG)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block text-slate-500">URL File / Tautan</label>
                <input
                  type="url" required value={formData.file_url} onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-3.5 rounded-xl border outline-none text-sm transition-colors bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold transition-all bg-slate-100 text-slate-500 hover:bg-slate-200">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3.5 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-900/20">
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