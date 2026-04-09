import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

const Whitebook = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  
  // HANYA Admin Divisi yang bisa Edit (Superadmin cuma mantau)
  const canEdit = isAdmin && !isSuperAdmin && !isDeveloper; 
  const canViewAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division_name || "IT Support";

  // Logic Warna Tema Dinamis Berdasarkan Kasta
  const isPurpleTheme = isSuperAdmin || isDeveloper;
  const isBlueTheme = isAdmin && !isPurpleTheme;

  // ==========================================
  // DUMMY DATA
  // ==========================================
  const [documents, setDocuments] = useState([
    {
      id: 1, title: "SOP Reset Router & Switch", category: "IT Support",
      icon: "fa-network-wired", author: "Admin CPG", date: "10 Apr 2026",
      content: "Panduan langkah demi langkah mereset dan mengkonfigurasi ulang router Mikrotik di lantai 2 dan 3.\n\n### Langkah 1\nPastikan membackup konfigurasi sebelum melakukan hard reset.\n\n### Langkah 2\n- Colok kabel LAN ke ether2.\n- Buka Winbox, login dengan MAC Address.\n- Pilih menu System > Reset Configuration."
    },
    {
      id: 2, title: "Standard Tone of Voice", category: "Public Relation",
      icon: "fa-comments", author: "Mbak Rina", date: "05 Apr 2026",
      content: "Panduan gaya bahasa untuk membalas pesan di media sosial MCC.\n\n- Gunakan bahasa semi-formal.\n- Hindari singkatan alay (yg, kyk, bgt).\n- Akhiri setiap balasan dengan salam hangat."
    },
    {
      id: 3, title: "Aturan Cuti & Izin", category: "General",
      icon: "fa-envelope-open-text", author: "HRD", date: "12 Apr 2026",
      content: "Semua pengajuan izin wajib dilakukan melalui portal H-1.\n\n- Sakit wajib lampirkan surat dokter.\n- Tukar shift wajib persetujuan kedua belah pihak."
    },
  ]);

  // State UI
  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "IT Support" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: "", category: "", content: "" });

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
  const handleSave = (e) => {
    e.preventDefault();
    if (formData.id) {
      setDocuments(prev => prev.map(d => d.id === formData.id ? { ...d, ...formData, date: "Barusan diupdate" } : d));
    } else {
      const iconMap = { "IT Support": "fa-desktop", "Multimedia": "fa-video", "Public Relation": "fa-bullhorn", "General": "fa-file-lines" };
      const newDoc = { 
        ...formData, 
        id: Date.now(), 
        author: user?.nickname || "Admin", 
        date: "Baru saja", 
        icon: iconMap[formData.category] || "fa-book" 
      };
      setDocuments([newDoc, ...documents]);
      setActiveDocId(newDoc.id);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus dokumen ini secara permanen?")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      setActiveDocId(null);
    }
  };

  const openEditForm = (doc) => {
    setFormData(doc);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setFormData({ id: null, title: "", category: myDivision, content: "" });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION - DINAMIS & TERGABUNG DENGAN SWITCHER (KHUSUS SUPERADMIN) */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden flex flex-col ${
        isPurpleTheme ? "bg-purple-950/95 shadow-purple-900/20" : 
        isBlueTheme ? "bg-blue-950/95 shadow-blue-900/20" : 
        "bg-gradient-to-br from-[#0b1437] to-[#111c44] shadow-sky-900/10"
      }`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isPurpleTheme ? "bg-purple-500/20" : 
          isBlueTheme ? "bg-blue-500/20" : 
          "bg-sky-500/20"
        }`}></div>
        
        {/* Bagian Info Hero Atas */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg border ${
                isPurpleTheme ? "bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/30 border-purple-400/50" : 
                isBlueTheme ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30 border-blue-400/50" : 
                "bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-500/30 border-sky-400/50"
              }`}>
                <i className="fa-solid fa-book-bookmark text-lg"></i>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                isPurpleTheme ? "text-purple-300" : 
                isBlueTheme ? "text-blue-300" : 
                "text-sky-300"
              }`}>
                Whitebook System
              </span>
            </div>
            
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white ${
              isPurpleTheme ? "to-purple-200" : 
              isBlueTheme ? "to-blue-200" : 
              "to-sky-200"
            }`}>
              Knowledge & Guide
            </h1>
            
            {/* WIDGET ANIMASI (PENGGANTI TEKS PARAGRAF) */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`animate-[spin_3s_linear_infinite] ${isPurpleTheme ? 'text-purple-400' : isBlueTheme ? 'text-blue-400' : 'text-sky-400'}`} />
                </svg>
                <i className={`fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] ${isPurpleTheme ? 'text-purple-400' : isBlueTheme ? 'text-blue-400' : 'text-sky-400'}`}></i>
              </div>

              <div className="h-6 w-px bg-white/20 rounded-full"></div>

              <div className="flex gap-2">
                <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                    isPurpleTheme ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' : 
                    isBlueTheme ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' : 
                    'bg-sky-500/20 border-sky-400/30 text-sky-200'
                }`}>
                  <i className="fa-solid fa-database text-[10px]"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">SOP Synced</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                    isPurpleTheme ? 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200' : 
                    isBlueTheme ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' : 
                    'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                }`} style={{ animationDelay: '500ms' }}>
                  <i className="fa-solid fa-shield-halved text-[10px]"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">{isPurpleTheme ? 'Superadmin Mode' : 'Secured'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET KANAN WHITEBOOK */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                isPurpleTheme ? "bg-purple-500/20 text-purple-400" : 
                isBlueTheme ? "bg-blue-500/20 text-blue-400" : 
                "bg-sky-500/20 text-sky-400"
              }`}>
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <span className="text-2xl font-black text-white leading-none mb-1">{documents?.length || 0}</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total SOP</span>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                isPurpleTheme ? "bg-fuchsia-500/20 text-fuchsia-400" : 
                "bg-emerald-500/20 text-emerald-400"
              }`}>
                <i className={`fa-solid ${isPurpleTheme ? "fa-eye" : "fa-shield-check"}`}></i>
              </div>
              <span className="text-sm font-black text-white leading-none mb-1 mt-1">{isPurpleTheme ? "Read-Only" : "Up to date"}</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{isPurpleTheme ? "Akses Terkunci" : "Status Sistem"}</span>
            </div>
          </div>
        </div>

        {/* Bagian Bawah Hero: Switcher Divisi Khusus Superadmin */}
        {canViewAll && (
          <div className="relative z-10 bg-white/5 border-t border-white/10 px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-xl">
             <label className="text-[11px] font-black uppercase tracking-widest text-purple-200 flex items-center gap-2">
               <i className="fa-solid fa-layer-group text-purple-400"></i> Pantau SOP Divisi:
             </label>
             <div className="relative w-full sm:w-72">
               <select 
                 value={selectedDiv} 
                 onChange={(e) => { setSelectedDiv(e.target.value); setActiveDocId(null); setSearchQuery(""); }}
                 className="w-full bg-purple-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer shadow-inner transition-all"
               >
                 <option className="text-slate-800" value="IT Support">IT Support</option>
                 <option className="text-slate-800" value="Multimedia">Multimedia</option>
                 <option className="text-slate-800" value="Public Relation">Public Relation</option>
               </select>
               <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 text-xs pointer-events-none"></i>
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
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[750px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-black text-slate-800 text-xs tracking-widest uppercase font-sans">Daftar Isi</h3>
              {canEdit && (
                <button onClick={openCreateForm} className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-md transition-all ${
                  isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                  <i className="fa-solid fa-plus text-[10px]"></i>
                </button>
              )}
            </div>

            <div className="px-5 pt-5 shrink-0">
              <div className="relative group">
                <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-colors ${
                  isPurpleTheme ? 'group-focus-within:text-purple-500' : 'group-focus-within:text-blue-500'
                }`}></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari panduan..."
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ${
                    isPurpleTheme ? 'focus:ring-purple-500/20' : 'focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </div>
            
            <div className="p-3 mt-2 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar min-h-[300px]">
              {sideMenuItems.length === 0 ? (
                <div className="text-center py-10">
                  <i className="fa-solid fa-folder-open text-3xl text-slate-200 mb-2"></i>
                  <p className="text-xs font-bold text-slate-400">Belum ada SOP.</p>
                </div>
              ) : (
                sideMenuItems.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      activeDoc?.id === doc.id 
                        ? (isPurpleTheme ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20 translate-x-1" : "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1")
                        : "bg-white border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${doc.icon} text-sm ${
                        activeDoc?.id === doc.id 
                          ? "text-white" 
                          : (isPurpleTheme ? "text-purple-500" : "text-blue-500")
                      }`}></i>
                      <div>
                        <p className="text-[12px] font-black leading-tight line-clamp-1">{doc.title}</p>
                        <p className={`text-[9px] mt-1 font-black uppercase tracking-widest ${
                          activeDoc?.id === doc.id 
                            ? (isPurpleTheme ? "text-purple-200" : "text-blue-200") 
                            : "text-slate-400"
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
        <main className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[600px] lg:max-h-[750px]">
          {activeDoc ? (
            <>
              {/* HEADER BAGIAN DETAIL SOP */}
              <div className="p-8 md:p-12 pb-5 border-b border-slate-100 bg-slate-50/30 shrink-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center text-3xl shadow-xl shrink-0 ${
                      isPurpleTheme ? "bg-purple-600 shadow-purple-600/20" : "bg-blue-600 shadow-blue-600/20"
                    }`}>
                      <i className={`fa-solid ${activeDoc.icon}`}></i>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">{activeDoc.title}</h2>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                        isPurpleTheme ? "bg-purple-100 text-purple-600 border-purple-200" : "bg-blue-100 text-blue-600 border-blue-200"
                      }`}>
                        Verified SOP
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
                      <button onClick={() => openEditForm(activeDoc)} className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-[11px] font-black hover:bg-amber-100 transition-colors shadow-sm flex items-center gap-2">
                        <i className="fa-solid fa-pen-to-square"></i> EDIT
                      </button>
                      <button onClick={() => handleDelete(activeDoc.id)} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-black hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-2">
                        <i className="fa-solid fa-trash"></i> HAPUS
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">{activeDoc.author.charAt(0)}</div>
                    <p className="text-[11px] font-bold text-slate-600">{activeDoc.author}</p>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200"></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest"><i className="fa-regular fa-calendar-alt mr-1"></i> {activeDoc.date}</p>
                </div>
              </div>

              {/* ISI KONTEN */}
              <div className="px-8 py-5 md:px-12 md:py-8 flex-1 overflow-y-auto custom-scrollbar">
                <article className="max-w-none">
                  {activeDoc.content.split('\n').map((line, index) => {
                    if (line.trim() === '') return null;
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-xl md:text-2xl font-black mt-6 mb-3 tracking-tight text-slate-800">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="text-slate-700 text-[15px] md:text-[16px] leading-[1.8] font-normal font-sans antialiased ml-5 list-disc mb-1.5">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    return (
                      <p key={index} className="text-slate-700 text-[15px] md:text-[16px] leading-[1.8] font-normal font-sans antialiased mb-4">
                        {line}
                      </p>
                    );
                  })}
                </article>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               <i className="fa-solid fa-book-open text-6xl text-slate-100 mb-4"></i>
               <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pilih dokumen untuk dibaca</h3>
            </div>
          )}
        </main>
      </div>

      {/* MODAL FORM CRUD (HANYA BISA DIAKSES OLEH ADMIN) */}
      {isFormOpen && canEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0b1437]/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <i className={`fa-solid fa-pen-nib ${isPurpleTheme ? 'text-purple-500' : 'text-blue-500'}`}></i> 
                {formData.id ? "Edit SOP" : "Tambah SOP Baru"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 font-sans tracking-widest">Judul Dokumen</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 ${isPurpleTheme ? 'focus:ring-purple-500' : 'focus:ring-blue-500'}`} placeholder="Misal: SOP Reset Router..." />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 font-sans tracking-widest">Kategori Divisi</label>
                <select value={formData.category} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 outline-none cursor-not-allowed">
                  <option value={myDivision}>{myDivision} (Terkunci)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 flex justify-between font-sans tracking-widest">
                  <span>Konten Dokumentasi</span>
                  <span className={`${isPurpleTheme ? 'text-purple-500' : 'text-blue-500'} normal-case`}>Gunakan "### " untuk Sub Judul</span>
                </label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows="12" className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[15px] font-medium text-slate-700 outline-none focus:ring-2 ${isPurpleTheme ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} resize-none custom-scrollbar leading-relaxed`} placeholder="Ketik panduan di sini..."></textarea>
              </div>
              <div className="flex gap-3 pt-4 shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all ${
                  isPurpleTheme ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                }`}>Simpan Dokumen</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Whitebook;