import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const DivisionAnalytics = () => {
  // Hanya menggunakan isSuperAdmin, developer dan admin biasa dicabut
  const { isSuperAdmin } = useAuth();

  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State UI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });

  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  // Kunci Scroll Layar saat salah satu dari 3 modal terbuka
  useEffect(() => {
    if (isFormOpen || selectedDivision || modalState.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isFormOpen, selectedDivision, modalState.isOpen]);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/divisions/analytics');
      } catch {
        res = await api.get('/divisions');
      }
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
    if (isSuperAdmin) fetchDivisions();
  }, [isSuperAdmin]);

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

  // HELPER BIKIN WARNA BADGE DINAMIS (Light Mode / Pastel)
  const getBadgeColors = (color) => {
    const lightMap = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      purple: "text-purple-600 bg-purple-50 border-purple-100",
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
      rose: "text-rose-600 bg-rose-50 border-rose-100",
      amber: "text-amber-600 bg-amber-50 border-amber-100",
    };
    return lightMap[color] || "text-slate-600 bg-slate-50 border-slate-100";
  };

  // Proteksi Halaman: Hanya Superadmin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-rose-50 text-rose-500 font-black text-xl sm:text-2xl px-4 text-center rounded-[2rem] border border-rose-200 shadow-sm mx-4 sm:mx-8">
        <div>
          <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 animate-bounce"></i>
          <p>ACCESS DENIED. VVIP / SUPERADMIN ONLY.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ================================================================= */}
        {/* HERO SECTION (PINK PASTEL VVIP THEME)                             */}
        {/* ================================================================= */}
        <div className="bg-white rounded-[2.5rem] border border-pink-100 shadow-xl relative overflow-hidden flex flex-col text-slate-800">

          {/* Glow Effects & Header */}
          <div className="bg-gradient-to-br from-pink-300 to-rose-400 relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-pink-200 text-white overflow-hidden shadow-sm">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/40 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-rose-100/30 rounded-full blur-[80px] pointer-events-none" />

            <div className="lg:max-w-xl relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-white shadow-inner shrink-0 backdrop-blur-sm">
                  <i className="fa-solid fa-chart-line text-xl" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-50 bg-white/20 px-3 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm">
                  Global Performance Monitoring
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight drop-shadow-sm">
                Global Analytics.
              </h1>
              <p className="text-sm font-medium text-pink-50 leading-relaxed">
                Pantau performa operasional, persebaran pengguna, dan leaderboard tiap divisi secara komprehensif.
              </p>
            </div>

            {/* Animating Widget */}
            <div className="w-full lg:w-72 shrink-0 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5 shadow-lg relative z-10">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
                  <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white animate-[spin_3s_linear_infinite]" />
                </svg>
                <i className="fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] text-pink-100" />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-center gap-2.5 bg-black/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-sm">Live Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Bawah */}
          <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 bg-pink-50/50">
            <div className="relative w-full sm:w-80 group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 group-focus-within:text-pink-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari divisi atau admin..."
                className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none border bg-white border-pink-100 focus:border-pink-300 focus:ring-2 focus:ring-pink-300/30 text-slate-700 placeholder:text-pink-300 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={handleOpenAddForm}
              className="w-full sm:w-auto px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/30 active:scale-95"
            >
              <i className="fa-solid fa-plus" /> Tambah Divisi
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* GRID CARDS DIVISI                                                 */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          {/* Loading Skeletons */}
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border p-6 sm:p-8 animate-pulse bg-white border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100" />
                <div className="text-right space-y-2">
                  <div className="h-2 w-16 rounded bg-slate-100" />
                  <div className="h-6 w-12 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-5 w-2/3 rounded mb-3 bg-slate-100" />
              <div className="h-3 w-full rounded mb-2 bg-slate-50" />
              <div className="h-3 w-4/5 rounded mb-6 bg-slate-50" />
              <div className="h-12 sm:h-14 w-full rounded-2xl bg-slate-50" />
            </div>
          ))}

          {/* Empty State */}
          {!loading && filteredDivisions.length === 0 && (
            <div className="col-span-1 lg:col-span-2 py-16 sm:py-20 rounded-[2rem] border flex flex-col items-center justify-center gap-4 bg-white border-pink-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border bg-pink-50 border-pink-100 text-pink-300">
                <i className="fa-solid fa-building text-xl sm:text-2xl" />
              </div>
              <div className="text-center px-4">
                <p className="font-black text-sm sm:text-base text-slate-700">{searchQuery ? "Divisi tidak ditemukan" : "Belum ada divisi"}</p>
                <p className="text-[11px] sm:text-xs font-medium mt-1 text-slate-400">{searchQuery ? "Coba kata kunci lain." : "Tambahkan divisi pertama Anda."}</p>
              </div>
            </div>
          )}

          {/* Render Cards */}
          {!loading && filteredDivisions.map((div) => {
            const badgeClass = getBadgeColors(div.color);
            return (
              <div key={div.id} onClick={() => setSelectedDivision(div)} className="rounded-[2rem] border p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col cursor-pointer bg-white border-slate-200 hover:border-pink-300 hover:shadow-pink-500/10">
                
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none hidden sm:block">
                  <i className={`fa-solid ${div.icon} text-[10rem] sm:text-[12rem] text-pink-500`} />
                </div>

                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditForm(div); }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50">
                    <i className="fa-solid fa-pen-to-square text-xs sm:text-sm" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(div.id, div.name, div.internCount); }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50">
                    <i className="fa-solid fa-trash text-xs sm:text-sm" />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-5 sm:mb-6 relative z-10">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl shadow-inner border shrink-0 ${badgeClass}`}>
                    <i className={`fa-solid ${div.icon}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Performance</p>
                    <h4 className={`text-2xl sm:text-3xl font-black ${div.performance > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>{div.performance}%</h4>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black mb-1.5 sm:mb-2 transition-colors relative z-10 text-slate-800 group-hover:text-pink-600">{div.name}</h3>

                <p className="text-xs sm:text-[14px] font-medium leading-relaxed mb-5 sm:mb-6 line-clamp-2 relative z-10 text-slate-500">
                  {div.description}
                </p>

                <div className="mb-5 sm:mb-6 relative z-10">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5 sm:mb-2 text-slate-400">Penanggung Jawab</p>
                  {div.head ? (
                    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border bg-slate-50 border-slate-100">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm border shrink-0 bg-white text-slate-600 border-slate-200">
                        {div.head.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-[14px] font-bold leading-tight truncate text-slate-700">{div.head}</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase mt-0.5">Admin Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] sm:text-[11px] font-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 w-max bg-rose-50 text-rose-600 border-rose-100">
                      <i className="fa-solid fa-triangle-exclamation animate-pulse" /> Belum Ada
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4 sm:pt-6 border-t flex items-center justify-between z-10 border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-100">
                    <i className="fa-solid fa-users text-[10px] sm:text-xs text-slate-400" />
                    <span className="text-[10px] sm:text-xs font-black text-slate-600">{div.internCount} Anggota</span>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors border bg-pink-50 border-pink-200 text-pink-500 group-hover:bg-pink-600 group-hover:text-white group-hover:shadow-md">
                    <i className="fa-solid fa-arrow-right text-xs sm:text-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* SEMUA MODAL DENGAN CREATEPORTAL (Z-INDEX AMAN & FULLSCREEN)       */}
      {/* ================================================================= */}

      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <ConfirmModal {...modalState} onClose={closeModal} isDark={false} />
        </div>,
        document.body
      )}

      {/* MODAL FORM TAMBAH / EDIT DIVISI */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in p-4 sm:p-6">
          <div className="w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 border bg-white border-pink-200">
            
            <div className="p-5 sm:p-6 md:p-8 flex justify-between items-center shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <div>
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                    <i className="fa-solid fa-layer-group text-sm" />
                  </div>
                  {formData.id ? "Edit Divisi" : "Tambah Divisi Baru"}
                </h2>
                <p className="text-[10px] sm:text-xs font-medium mt-2 text-pink-100">
                  Lengkapi informasi divisi operasional di bawah ini.
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors flex items-center justify-center shrink-0 bg-white/10 text-white/90 hover:bg-white hover:text-rose-500">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              <div className="p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 sm:space-y-5 bg-white border-slate-200">
                <div>
                  <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Nama Divisi</label>
                  <div className="relative">
                    <i className="fa-solid fa-signature absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Misal: IT Support" className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-pink-400 focus:border-pink-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Ikon FontAwesome</label>
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-lg border bg-pink-50 border-pink-200 text-pink-500">
                        <i className={`fa-solid ${formData.icon || 'fa-building'}`} />
                      </div>
                      <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="fa-video" className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-pink-400 focus:border-pink-300" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Warna Tema (Badge)</label>
                    <select value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full rounded-xl px-4 py-3 h-12 text-sm font-bold outline-none focus:ring-2 transition-all cursor-pointer border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-pink-400 focus:border-pink-300">
                      <option value="blue">Biru (Blue)</option>
                      <option value="purple">Ungu (Purple)</option>
                      <option value="emerald">Hijau (Emerald)</option>
                      <option value="rose">Merah (Rose)</option>
                      <option value="amber">Kuning (Amber)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Kepala Divisi (Opsional)</label>
                  <div className="relative">
                    <i className="fa-solid fa-user-tie absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                    <input type="text" value={formData.head} onChange={e => setFormData({ ...formData, head: e.target.value })} placeholder="Nama penanggung jawab..." className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-pink-400 focus:border-pink-300" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Deskripsi Tugas</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Jelaskan peran divisi ini..." className="w-full rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 resize-none transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-pink-400 focus:border-pink-300" />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-1/3 py-3.5 sm:py-4 font-bold rounded-xl transition-colors border text-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-100">Batal</button>
                <button type="submit" className="w-full sm:w-2/3 py-3.5 sm:py-4 text-white font-black tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all text-sm bg-pink-500 hover:bg-pink-600 shadow-pink-500/30 active:scale-95">
                  <i className="fa-solid fa-floppy-disk" /> {formData.id ? "Simpan Perubahan" : "Simpan Divisi Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: FULL-SCREEN PROFILE DETAIL DIVISI */}
      {selectedDivision && createPortal(
        <div className="fixed inset-0 z-[999999] flex flex-col animate-in fade-in zoom-in-95 duration-300 bg-slate-50 overflow-hidden m-0">

          {/* Top Bar Header Fullscreen */}
          <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b shadow-sm flex flex-row justify-between items-center gap-4 shrink-0 bg-white border-pink-100">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl text-white shadow-lg shrink-0 bg-pink-500 shadow-pink-500/30">
                <i className={`fa-solid ${selectedDivision.icon}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black leading-tight truncate text-slate-800">
                  {selectedDivision.name}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1 truncate text-pink-400">
                  Profil Lengkap Divisi
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedDivision(null)} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all shrink-0 bg-pink-50 text-pink-600 hover:bg-rose-500 hover:text-white border border-pink-200 hover:border-rose-500 shadow-sm">
              <i className="fa-solid fa-arrow-left" /> <span className="hidden sm:inline">Tutup Panel</span>
            </button>
          </div>

          {/* Fullscreen Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-12">

              {/* KOLOM KIRI (Info Divisi & Jobdesk Utama) */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                {/* Deskripsi & Info Kepala */}
                <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 border shadow-sm bg-white border-pink-100">
                  <h3 className="text-base sm:text-lg font-black mb-4 text-slate-800">Tentang Divisi</h3>
                  <p className="text-sm sm:text-[15px] font-medium leading-relaxed text-slate-600">
                    {selectedDivision.description}
                  </p>

                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t flex items-center gap-3 sm:gap-4 border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black border shadow-sm shrink-0 bg-pink-50 text-pink-500 border-pink-200">
                      {selectedDivision.head ? selectedDivision.head.charAt(0) : <i className="fa-solid fa-user-slash" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Penanggung Jawab (Lead)</p>
                      <p className="text-sm sm:text-base font-bold truncate text-slate-800">
                        {selectedDivision.head || "Belum Ada Admin"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Jobdesk (Tugas Utama) */}
                <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 border shadow-sm bg-white border-pink-100">
                  <h3 className="text-base sm:text-lg font-black mb-5 sm:mb-6 flex items-center gap-3 text-slate-800">
                    <i className="fa-solid fa-clipboard-check text-lg sm:text-xl text-pink-500" />
                    Tanggung Jawab Utama
                  </h3>

                  {selectedDivision.jobDescriptions?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {selectedDivision.jobDescriptions.map((job, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl border bg-pink-50/50 border-pink-100 hover:border-pink-300 transition-colors">
                          <i className="fa-solid fa-circle-check mt-1 shrink-0 text-pink-500" />
                          <span className="text-xs sm:text-[13px] font-bold leading-relaxed text-slate-700">{job.task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 rounded-2xl border bg-slate-50 border-slate-100">
                      <p className="text-xs sm:text-sm font-medium text-slate-400">Belum ada rincian tanggung jawab.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN (Daftar Anggota & Leaderboard) */}
              <div className="lg:col-span-4 space-y-6 sm:space-y-8">

                {/* Daftar Anggota */}
                <div className="rounded-[2.5rem] p-5 sm:p-6 md:p-8 border shadow-sm bg-white border-pink-100">
                  <div className="flex justify-between items-center mb-5 sm:mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 sm:gap-3 text-slate-800">
                      <i className="fa-solid fa-users text-base sm:text-lg text-pink-500" />
                      Anggota Tim
                    </h3>
                    <span className="text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg text-pink-600 bg-pink-50 border border-pink-200">
                      {selectedDivision.internCount} User
                    </span>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    {selectedDivision.members?.length > 0 ? (
                      selectedDivision.members.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl transition-colors border bg-slate-50 border-slate-100 hover:border-pink-200">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black text-white shadow-sm shrink-0 bg-gradient-to-br from-pink-400 to-pink-500">
                            {member.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-black leading-tight truncate text-slate-800">{member.name}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5 text-slate-400">{member.role}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-5 sm:py-6 text-center rounded-xl border bg-slate-50 border-slate-100 text-slate-400">
                        <p className="text-[11px] sm:text-xs font-medium">Belum ada anggota.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Interns */}
                <div className="rounded-[2.5rem] p-5 sm:p-6 md:p-8 border shadow-sm bg-white border-pink-100">
                  <h3 className="text-xs sm:text-sm font-black mb-5 sm:mb-6 border-b border-slate-100 pb-4 flex items-center gap-2 sm:gap-3 text-slate-800">
                    <i className="fa-solid fa-fire text-orange-500 text-base sm:text-lg" /> Top Interns
                  </h3>

                  <div className="space-y-2.5 sm:space-y-3">
                    {selectedDivision.leaderboard?.length > 0 ? selectedDivision.leaderboard.map((intern, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-colors ${
                        idx === 0
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm"
                          : "bg-white border-slate-100 hover:border-pink-200"
                        }`}>
                        <div className="flex items-center gap-3.5 min-w-0 w-full">
                          <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm shrink-0 ${
                            idx === 0 
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30" 
                              : idx === 1 
                                ? "bg-slate-200 text-slate-600" 
                                : "bg-orange-100 text-orange-600"
                            }`}>
                            {idx === 0 ? <i className="fa-solid fa-trophy text-[10px] sm:text-[11px]" /> : idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black leading-tight truncate text-slate-800">{intern.name}</p>
                            <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate ${
                              intern.status === 'Warning' ? 'text-rose-500' : 'text-slate-400'
                            }`}>{intern.status}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="border rounded-2xl p-5 sm:p-6 text-center bg-slate-50 border-slate-100">
                        <p className="text-[11px] sm:text-xs font-medium text-slate-500">Leaderboard kosong.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};

export default DivisionAnalytics;