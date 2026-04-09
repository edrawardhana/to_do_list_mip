import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Divisions = () => {
  const { isSuperAdmin, isDeveloper } = useAuth();
  
  // Pastikan cuma bos besar yang bisa akses (Meskipun udah dijaga di App.jsx, ini buat double kill)
  const canManage = isSuperAdmin || isDeveloper;

  // ==========================================
  // DUMMY DATA DIVISI
  // ==========================================
  const [divisions, setDivisions] = useState([
    { id: "div-001", name: "IT Support", icon: "fa-network-wired", color: "blue", head: "Pak Budi", internCount: 12, description: "Menangani jaringan, server, dan perbaikan perangkat keras MCC." },
    { id: "div-002", name: "Multimedia", icon: "fa-video", color: "purple", head: "Mas Anton", internCount: 8, description: "Produksi video, dokumentasi kegiatan, dan live streaming." },
    { id: "div-003", name: "Public Relation", icon: "fa-bullhorn", color: "rose", head: "Mbak Rina", internCount: 5, description: "Mengurus humas, kemitraan, dan sosial media MCC." },
    { id: "div-004", name: "Creative Design", icon: "fa-pen-nib", color: "emerald", head: "Pak Joko", internCount: 6, description: "Desain grafis, UI/UX, dan branding visual institusi." },
  ]);

  // State UI & Form
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });

  // ==========================================
  // LOGIC FILTER PENCARIAN
  // ==========================================
  const filteredDivisions = useMemo(() => {
    if (!searchQuery) return divisions;
    return divisions.filter(div => 
      div.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      div.head.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [divisions, searchQuery]);

  // ==========================================
  // FUNGSI CRUD
  // ==========================================
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
      alert(`GAK BISA DIHAPUS BROK! Masih ada ${internCount} anak magang di divisi ${name}. Pindahin dulu mereka ke divisi lain!`);
      return;
    }
    if (window.confirm(`Yakin ingin menghapus divisi ${name} secara permanen?`)) {
      setDivisions(prev => prev.filter(div => div.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      // UPDATE
      setDivisions(prev => prev.map(div => div.id === formData.id ? { ...formData, internCount: div.internCount } : div));
    } else {
      // CREATE
      const newDiv = { ...formData, id: `div-${Date.now()}`, internCount: 0 };
      setDivisions([...divisions, newDiv]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      {/* ================================================================= */}
      {/* FILTER & TOMBOL TAMBAH                                              */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama divisi atau kepala..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Tombol Tambah */}
        {canManage && (
          <button 
            onClick={handleOpenAddForm}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Buat Divisi Baru
          </button>
        )}
      </div>

      {/* ================================================================= */}
      {/* GRID DIVISI CARDS                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDivisions.map((div) => {
          // Dynamic Colors
          const colorStyles = {
            blue: "text-blue-600 bg-blue-50 border-blue-100",
            purple: "text-purple-600 bg-purple-50 border-purple-100",
            rose: "text-rose-600 bg-rose-50 border-rose-100",
            emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
            amber: "text-amber-600 bg-amber-50 border-amber-100",
          }[div.color] || "text-slate-600 bg-slate-50 border-slate-100";

          return (
            <div key={div.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 group flex flex-col overflow-hidden relative">
              
              {/* Menu Aksi Hover */}
              {canManage && (
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleOpenEditForm(div)} className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-purple-600 flex items-center justify-center shadow-sm border border-slate-200 transition-colors">
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  <button onClick={() => handleDelete(div.id, div.name, div.internCount)} className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-sm border border-slate-200 transition-colors">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              )}

              <div className="p-6 pb-0 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner mb-5 ${colorStyles}`}>
                  <i className={`fa-solid ${div.icon}`}></i>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                  {div.name}
                </h3>
                
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                  {div.description}
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                    {div.head.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kepala Divisi</p>
                    <p className="text-xs font-bold text-slate-700">{div.head || "Belum Ditentukan"}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 mt-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500">Kapasitas Magang</span>
                <span className="bg-white px-3 py-1.5 rounded-lg text-[11px] font-black border border-slate-200 text-slate-700 shadow-sm">
                  {div.internCount} Orang
                </span>
              </div>
            </div>
          );
        })}
        
        {filteredDivisions.length === 0 && (
          <div className="col-span-full bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-300 mx-auto mb-4">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Divisi tidak ditemukan</h3>
            <p className="text-sm text-slate-500 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL FORM CRUD DIVISI                                              */}
      {/* ================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-sitemap text-purple-500"></i> {formData.id ? "Edit Divisi" : "Buat Divisi Baru"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block ml-1">Nama Divisi</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Misal: Artificial Intelligence" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block ml-1">Ikon (FontAwesome)</label>
                  <div className="relative">
                     <i className={`fa-solid ${formData.icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`}></i>
                     <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500" placeholder="fa-robot" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block ml-1">Warna Tema</label>
                  <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="blue">Biru (Blue)</option>
                    <option value="purple">Ungu (Purple)</option>
                    <option value="emerald">Hijau (Emerald)</option>
                    <option value="rose">Merah (Rose)</option>
                    <option value="amber">Kuning (Amber)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block ml-1">Nama Kepala Divisi</label>
                <input type="text" value={formData.head} onChange={e => setFormData({...formData, head: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nama Koordinator/Supervisor..." />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block ml-1">Deskripsi Tugas</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Jelaskan peran divisi ini secara singkat..."></textarea>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                   <i className="fa-solid fa-floppy-disk"></i> Simpan Divisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Divisions;