import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Whitebook = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();

  // ── LOGIC ROLE & PERMISSIONS ─────────────────────────────────────────────
  const canEdit = isAdmin && !isSuperAdmin;
  const canViewAll = isSuperAdmin;
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ── TEMA WARNA DINAMIS ───────────────────────────────────────────────────
  const isPinkTheme = isSuperAdmin;           // VVIP Monitoring (Pink Pastel)
  const isDarkBlueTheme = isAdmin && !isSuperAdmin; // Admin Divisi (Biru Tua)
  // Intern otomatis pakai fallback default (Sky/Biru Muda)

  // ── STATE ────────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "IT Support" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    type: "link",
    file_url: "",
  });

  // ── KUNCI SCROLL BACKGROUND SAAT MODAL TERBUKA ───────────────────────────
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup saat komponen unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFormOpen]);

  // ── FETCH DATA ───────────────────────────────────────────────────────────
  const fetchWhitebooks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/whiteboards");
      setDocuments(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Gagal memuat SOP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitebooks();
  }, []);

  // ── FILTER LOGIC ─────────────────────────────────────────────────────────
  const sideMenuItems = useMemo(() => {
    return documents.filter((doc) => {
      const isCorrectCategory = canViewAll
        ? doc.category === selectedDiv || doc.category === "General"
        : doc.category === myDivision || doc.category === "General";
      const matchesSearch = doc.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return isCorrectCategory && matchesSearch;
    });
  }, [documents, selectedDiv, canViewAll, myDivision, searchQuery]);

  const activeDoc = useMemo(() => {
    if (!activeDocId && sideMenuItems.length > 0) return sideMenuItems[0];
    return sideMenuItems.find((d) => d.id === activeDocId) || sideMenuItems[0];
  }, [activeDocId, sideMenuItems]);

  // ── CRUD HANDLERS (ADMIN ONLY) ───────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/whiteboards/${formData.id}`, formData);
        toast.success("SOP berhasil diperbarui!");
      } else {
        const iconMap = { pdf: "fa-file-pdf", image: "fa-image", link: "fa-link" };
        const payload = { ...formData, icon: iconMap[formData.type] || "fa-book" };
        await api.post("/whiteboards", payload);
        toast.success("SOP baru berhasil ditambahkan!");
      }
      fetchWhitebooks();
      setIsFormOpen(false);
    } catch (error) {
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 md:pt-8 px-4 md:px-6 max-w-7xl mx-auto">
      
      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION (TEMA DINAMIS)
      ══════════════════════════════════════════════════════════════════ */}
      <div className={`rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col border transition-colors duration-500
        ${isPinkTheme ? "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-300 shadow-pink-200/50" : 
          isDarkBlueTheme ? "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20 shadow-2xl" : 
          "bg-gradient-to-br from-sky-400 to-blue-500 border-sky-300 shadow-sky-300/50"}`}
      >
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none 
          ${isPinkTheme ? "bg-white/40" : isDarkBlueTheme ? "bg-blue-500/20" : "bg-sky-200/30"}`}>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg border backdrop-blur-sm
                ${isPinkTheme ? "bg-white/20 border-white/40 text-white" : 
                  isDarkBlueTheme ? "bg-white/10 border-white/20 text-white" : 
                  "bg-white/20 border-white/30 text-white"}`}
              >
                <i className="fa-solid fa-book-bookmark text-base md:text-lg"></i>
              </div>
              <span 
                className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                  isPinkTheme 
                    ? "px-3 py-1.5 rounded-lg border text-pink-50 bg-white/20 border-pink-200" 
                    : isDarkBlueTheme 
                      ? "px-3 py-1.5 rounded-lg border text-blue-200 bg-white/10 border-white/10" 
                      : "text-white drop-shadow-sm" // Khusus Intern: Murni teks doang tanpa border/bg
                }`}
              >
                Whitebook System
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 md:mb-3 text-white">
              Knowledge & Guide
            </h1>
            <p className={`font-medium mb-4 transition-all duration-300
              ${isPinkTheme 
                ? "text-xs md:text-sm max-w-lg text-pink-50" 
                : isDarkBlueTheme 
                  ? "text-xs md:text-sm max-w-lg text-slate-300" 
                  : "text-xs md:text-[14px] text-sky-50/90 max-w-xl leading-relaxed border-l-[3px] border-white/30 pl-3 md:pl-4"
              }`}
            >
              {isPinkTheme 
                ? "Pusat pantauan SOP seluruh divisi." 
                : isDarkBlueTheme 
                  ? "Kelola panduan dan aturan divisi Anda." 
                  : "Baca panduan operasional dan SOP harian Anda di sini."}
            </p>

            {/* WIDGET STATUS KECIL */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm
                ${isPinkTheme ? "bg-white/20 border-white/30" : isDarkBlueTheme ? "bg-blue-900/50 border-blue-700" : "bg-white/20 border-white/30"}`}>
                <i className="fa-solid fa-database text-[10px]"></i>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">SOP Synced</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm
                ${isPinkTheme ? "bg-rose-500/30 border-rose-400/40" : isDarkBlueTheme ? "bg-emerald-500/20 border-emerald-500/30" : "bg-blue-600/30 border-blue-500/40"}`}>
                <i className={`fa-solid ${isPinkTheme ? "fa-eye" : isDarkBlueTheme ? "fa-shield-halved" : "fa-lock"} text-[10px]`}></i>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  {isPinkTheme ? "Superadmin Mode" : isDarkBlueTheme ? "Admin Access" : "Read Only"}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL DOKUMEN STATS */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center text-center min-w-[120px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center mb-2 md:mb-3">
                <i className="fa-solid fa-file-lines text-lg"></i>
              </div>
              <span className="text-2xl md:text-3xl font-black leading-none mb-1 text-white">
                {documents?.length || 0}
              </span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white/80">
                Total SOP
              </span>
            </div>
          </div>
        </div>

        {/* DROPDOWN KHUSUS SUPERADMIN */}
        {canViewAll && (
          <div className="relative z-10 border-t border-white/20 px-6 py-4 md:px-8 md:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 backdrop-blur-xl bg-black/10">
            <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-white">
              <i className="fa-solid fa-layer-group text-white/80"></i> Pantau Divisi:
            </label>
            <div className="relative w-full sm:w-64">
              <select
                value={selectedDiv}
                onChange={(e) => {
                  setSelectedDiv(e.target.value);
                  setActiveDocId(null);
                  setSearchQuery("");
                }}
                className="w-full rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none appearance-none cursor-pointer shadow-inner transition-all bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50"
              >
                <option className="text-slate-800" value="IT Support">IT Support</option>
                <option className="text-slate-800" value="Multimedia">Multimedia</option>
                <option className="text-slate-800" value="Public Relation">Public Relation</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white pointer-events-none"></i>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ── KIRI: SIDEBAR DAFTAR ISI ── */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0">
          <div className="rounded-[2rem] border shadow-sm overflow-hidden flex flex-col bg-white border-slate-200 lg:max-h-[750px]">
            <div className="p-5 md:p-6 border-b flex justify-between items-center shrink-0 bg-slate-50/50 border-slate-100">
              <h3 className="font-black text-xs md:text-sm tracking-widest uppercase text-slate-800">
                Daftar Isi
              </h3>
              {canEdit && (
                <button
                  onClick={openCreateForm}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-xl text-white flex items-center justify-center shadow-md transition-all bg-blue-600 hover:bg-blue-700 active:scale-95"
                  title="Tambah SOP Baru"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              )}
            </div>

            <div className="px-4 md:px-5 pt-4 md:pt-5 shrink-0">
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari panduan..."
                  className="w-full border rounded-xl pl-10 pr-4 py-2.5 md:py-3 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="p-3 mt-2 space-y-1.5 overflow-y-auto custom-scrollbar max-h-[250px] sm:max-h-[350px] lg:max-h-none lg:flex-1">
              {sideMenuItems.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-folder-open text-3xl md:text-4xl mb-3 text-slate-200"></i>
                  <p className="text-xs font-bold text-slate-400">Belum ada dokumen.</p>
                </div>
              ) : (
                sideMenuItems.map((doc) => {
                  const isActive = activeDoc?.id === doc.id;
                  const activeClass = isPinkTheme 
                    ? "bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/20 translate-x-1" 
                    : isDarkBlueTheme
                    ? "bg-blue-800 border-blue-800 text-white shadow-md shadow-blue-800/20 translate-x-1"
                    : "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 translate-x-1";
                  
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left p-3 md:p-4 rounded-2xl transition-all duration-300 border ${
                        isActive ? activeClass : "bg-white border-transparent text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fa-solid ${doc.icon} text-sm md:text-base ${
                          isActive ? "text-white" : isPinkTheme ? "text-pink-400" : isDarkBlueTheme ? "text-blue-800" : "text-blue-500"
                        }`}></i>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs md:text-[13px] font-black leading-tight truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                            {doc.title}
                          </p>
                          <p className={`text-[9px] md:text-[10px] mt-1 font-black uppercase tracking-widest ${
                            isActive ? "text-white/80" : "text-slate-400"
                          }`}>
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

        {/* ── KANAN: KONTEN DETAIL SOP ── */}
        <main className="flex-1 w-full rounded-[2rem] border shadow-sm flex flex-col overflow-hidden bg-white border-slate-200 min-h-[500px] lg:h-[750px]">
          {activeDoc ? (
            <>
              {/* Header Konten */}
              <div className="p-5 md:p-8 border-b shrink-0 bg-slate-50/50 border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start md:items-center gap-4">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-lg shrink-0 ${
                    isPinkTheme ? "bg-pink-500 text-white shadow-pink-500/20" : 
                    isDarkBlueTheme ? "bg-blue-800 text-white shadow-blue-800/20" : 
                    "bg-blue-500 text-white shadow-blue-500/20"
                  }`}>
                    <i className={`fa-solid ${activeDoc.icon}`}></i>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight mb-2 text-slate-800 pr-2">
                      {activeDoc.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                        isPinkTheme ? "bg-pink-50 text-pink-600 border-pink-200" : 
                        isDarkBlueTheme ? "bg-blue-50 text-blue-800 border-blue-200" : 
                        "bg-blue-50 text-blue-600 border-blue-200"
                      }`}>
                        Verified SOP
                      </span>
                      <p className="text-[10px] md:text-[11px] font-bold text-slate-500 flex items-center gap-1.5 border-l border-slate-300 pl-2 md:pl-3">
                        <i className="fa-regular fa-calendar-alt"></i> {activeDoc.date || new Date().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi (Hanya tampil jika canEdit = True) */}
                {canEdit && (
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => openEditForm(activeDoc)}
                      className="flex-1 md:flex-none justify-center px-4 py-2 border rounded-xl text-[10px] md:text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activeDoc.id)}
                      className="flex-1 md:flex-none justify-center px-4 py-2 border rounded-xl text-[10px] md:text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    >
                      <i className="fa-solid fa-trash"></i> Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Area Tampil Dokumen */}
              <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20">
                {activeDoc.type === "image" && (
                  <img
                    src={activeDoc.file_url}
                    alt={activeDoc.title}
                    className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm mx-auto"
                  />
                )}
                {activeDoc.type === "pdf" && (
                  <iframe
                    src={activeDoc.file_url}
                    className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-xl border border-slate-200 shadow-sm bg-white"
                  ></iframe>
                )}
                {(!activeDoc.type || activeDoc.type === "link") && (
                  <div className="text-center py-12 md:py-20 max-w-sm mx-auto">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5">
                      <i className="fa-solid fa-arrow-up-right-from-square text-3xl md:text-4xl text-slate-300"></i>
                    </div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 mb-2">Tautan Eksternal</h3>
                    <p className="mb-6 text-xs md:text-sm font-medium text-slate-500 leading-relaxed">
                      Dokumen SOP ini dialihkan ke layanan eksternal (Google Drive / Notion / Web).
                    </p>
                    <a
                      href={activeDoc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center px-6 py-3 md:py-3.5 text-white rounded-xl text-xs md:text-sm font-black tracking-wide shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto
                        ${isPinkTheme ? "bg-pink-500 hover:bg-pink-600 shadow-pink-500/30" : 
                          isDarkBlueTheme ? "bg-blue-800 hover:bg-blue-900 shadow-blue-800/30" : 
                          "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}
                    >
                      Buka Dokumen Sekarang
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12 opacity-50">
              <i className="fa-solid fa-book-open text-5xl md:text-6xl mb-4 text-slate-300"></i>
              <h3 className="font-bold uppercase tracking-widest text-xs md:text-sm text-slate-400">
                Pilih dokumen untuk dibaca
              </h3>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL FORM (CRUD ADMIN) DENGAN Z-INDEX MAKSIMAL
      ══════════════════════════════════════════════════════════════════ */}
      {isFormOpen && (
        <div 
          className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden"
          style={{ margin: 0, padding: 0 }} // Reset margin bawaan parent
        >
          <div className="w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl animate-in zoom-in-95 bg-white border border-slate-100">
            <h2 className="text-lg md:text-xl font-black mb-6 text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-blue-500"></i> {formData.id ? "Edit SOP" : "Tambah SOP Baru"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 md:space-y-5">
              <div>
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                  Judul SOP
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Prosedur Absensi"
                  className="w-full p-3 md:p-3.5 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                  Tipe Format
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-3 md:p-3.5 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 cursor-pointer"
                >
                  <option value="link">Tautan Web (G-Drive, Notion, dll)</option>
                  <option value="pdf">Dokumen PDF (.pdf)</option>
                  <option value="image">Gambar (.jpg / .png)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                  URL / Tautan File
                </label>
                <input
                  type="url"
                  required
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-3 md:p-3.5 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wide transition-all bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wide text-white shadow-md transition-all ${isPinkTheme ? "bg-pink-500 hover:bg-pink-600" : isDarkBlueTheme ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"}`}
                >
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