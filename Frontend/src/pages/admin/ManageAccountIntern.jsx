import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const ManageAccountIntern = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  
  // Tentukan kasta & batasan wilayah
  const canViewAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // DUMMY DATA ANAK MAGANG
  // ==========================================
  const [interns, setInterns] = useState([]);
  const [divisions, setDivisions] = useState([]); // State tambahan untuk filter divisi dinamis

  const fetchInterns = async () => {
    try {
      // Tarik data profil dan divisi secara serentak dari database
      const [res, divRes] = await Promise.all([
        api.get('/profiles'),
        canViewAll ? api.get('/divisions') : Promise.resolve({ data: [] })
      ]);
      
      const data = res.data?.data || res.data || [];
      
      // Filter murni HANYA role intern
      const internsData = data.filter(u => u.role === 'intern');
      
      const normalized = internsData.map(i => ({
        ...i,
        name: i.name || i.full_name || "Unknown",
        division: i.division?.name || i.division_name || (typeof i.division === 'string' ? i.division : "Unknown")
      }));
      setInterns(normalized);

      if (canViewAll) {
        const divsData = divRes.data?.data || divRes.data || [];
        setDivisions(divsData.map(d => d.name));
      }
    } catch (error) {
      console.error("Gagal memuat data akun:", error);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState(canViewAll ? "Semua" : myDivision);

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => {} });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  // ==========================================
  // LOGIC FILTER SAKTI
  // ==========================================
  const filteredInterns = useMemo(() => {
    let data = interns;

    // 1. Tembok Kasta
    if (!canViewAll) {
      data = data.filter(intern => intern.division === myDivision);
    } 
    // 2. Filter Dropdown Bos
    else if (filterDivision !== "Semua") {
      data = data.filter(intern => intern.division === filterDivision);
    }

    // 3. Fitur Pencarian
    if (searchQuery) {
      data = data.filter(intern => 
        intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [interns, canViewAll, myDivision, filterDivision, searchQuery]);

  const stats = useMemo(() => {
    const pending = filteredInterns.filter(i => !i.is_verified).length;
    const locked = filteredInterns.filter(i => i.is_locked).length;
    return { total: filteredInterns.length, pending, locked };
  }, [filteredInterns]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleVerify = (id, name) => {
    setModalState({
      isOpen: true,
      type: "promote",
      title: "Verifikasi Akun",
      message: `Yakin ingin memverifikasi akun ${name}? Mereka akan mendapatkan akses penuh ke sistem absensi dan aktivitas.`,
      actionText: "Ya, Verifikasi",
      onConfirm: async () => {
        try {
          await api.put(`/profiles/${id}`, { is_verified: true });
          toast.success(`Akun ${name} telah terverifikasi`);
          fetchInterns();
        } catch (error) {
          toast.error("Gagal memverifikasi akun");
        }
      }
    });
  };

  const handleToggleLock = (id, name, currentStatus) => {
    const action = currentStatus ? "Membuka Gembok" : "Menggembok";
    setModalState({
      isOpen: true,
      type: currentStatus ? "unlock" : "lock",
      title: `${action} Akun`,
      message: `Yakin ingin ${action} akun ${name} secara individual? ${!currentStatus ? 'Mereka tidak akan bisa login lagi.' : ''}`,
      actionText: currentStatus ? "Ya, Buka" : "Ya, Kunci",
      onConfirm: async () => {
        try {
          await api.put(`/profiles/${id}`, { is_locked: !currentStatus });
          toast.success(`Berhasil ${action} akun ${name}`);
          fetchInterns();
        } catch (error) {
          toast.error("Gagal mengubah status gembok");
        }
      }
    });
  };

  const handleDelete = (id, name) => {
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Hapus Permanen",
      message: `BAHAYA! Yakin ingin menghapus permanen akun ${name}? Seluruh data tugas dan histori absensi mereka mungkin akan terhapus.`,
      actionText: "Ya, Hapus!",
      onConfirm: async () => {
        try {
          await api.delete(`/profiles/${id}`);
          toast.success(`Akun ${name} telah dihapus permanen`);
          fetchInterns();
        } catch (error) {
          toast.error("Gagal menghapus akun");
        }
      }
    });
  };

  const isDark = isDeveloper; // Terapkan tema gelap khusus developer

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${isDark ? 'text-zinc-100' : ''}`}>
      
      {/* HEADER MASTER CONTROL (Jika Developer) */}
      {isDark && (
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-800/80 border border-zinc-700 text-zinc-300 shadow-inner">
            <i className="fa-solid fa-users-gear text-xl hover:text-emerald-400 transition-colors"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              Master Control Panel
            </span>
            <h1 className="text-3xl font-black tracking-tighter text-zinc-100 leading-none mt-1">
              Manajemen Akun.
            </h1>
          </div>
        </div>
      )}

      {/* FILTER ROW */}
      <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 sm:p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
        isDark ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200"
      }`}>
        {isDark && (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          </>
        )}
        <div className="relative w-full sm:w-80 z-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className={`fa-solid fa-magnifying-glass ${isDark ? "text-zinc-500" : "text-slate-400"}`}></i>
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama atau email..." 
            className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none transition-colors ${
              isDark ? "bg-[#18181b] border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" : "bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500"
            }`} 
          />
        </div>

        {canViewAll ? (
          <div className="relative w-full sm:w-auto z-10">
            <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} 
              className={`w-full sm:w-48 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none cursor-pointer transition-colors ${
                isDark ? "bg-[#18181b] border border-zinc-800 text-zinc-200 focus:border-emerald-500" : "bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}>
              <option value="Semua">Semua Divisi</option>
              {divisions.map((divName, idx) => (
                <option key={idx} value={divName}>{divName}</option>
              ))}
            </select>
            <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${isDark ? "text-zinc-500" : "text-slate-400"}`}></i>
          </div>
        ) : (
          <div className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-sm font-black flex items-center gap-2 justify-center z-10 ${
            isDark ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-blue-50 border border-blue-100 text-blue-700"
          }`}>
            <i className="fa-solid fa-building text-blue-400"></i> {myDivision}
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className={`rounded-[2rem] border shadow-xl relative overflow-hidden transition-all ${
        isDark ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200"
      }`}>
        <div className="overflow-x-auto relative z-10">
          <table className={`w-full text-left text-sm ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
            <thead className={`border-b text-[10px] uppercase font-black tracking-widest ${
              isDark ? "bg-[#18181b] border-zinc-800 text-zinc-500" : "bg-slate-50/50 border-slate-100 text-slate-400"
            }`}>
              <tr>
                <th className="px-6 py-5 whitespace-nowrap">Nama & Info</th>
                <th className="px-6 py-5 whitespace-nowrap">Status Verifikasi</th>
                <th className="px-6 py-5 whitespace-nowrap">Status Gembok</th>
                <th className="px-6 py-5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-zinc-800/50" : "divide-slate-50"}`}>
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className={`group transition-colors ${isDark ? "hover:bg-zinc-800/30" : "hover:bg-slate-50/50"}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700 shadow-inner" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {intern.name.charAt(0)}
                      </div>
                      <div className="min-w-[150px]">
                        <p className={`font-bold text-sm mb-0.5 whitespace-nowrap ${isDark ? "text-zinc-200" : "text-slate-800"}`}>{intern.name}</p>
                        <p className={`text-[10px] font-medium mb-0.5 whitespace-nowrap ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{intern.email}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isDark ? "text-emerald-500" : "text-blue-500"}`}>{intern.division}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {intern.is_verified ? (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-max ${
                        isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        <i className="fa-solid fa-check-circle"></i> Terverifikasi
                      </span>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-max animate-pulse ${
                        isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        <i className="fa-solid fa-clock"></i> Pending ACC
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {intern.is_locked ? (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-max ${
                        isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        <i className="fa-solid fa-lock"></i> Terkunci
                      </span>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-max ${
                        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        <i className="fa-solid fa-unlock"></i> Aman
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 min-w-max opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      
                      {!intern.is_verified && (
                        <button onClick={() => handleVerify(intern.id, intern.name)} className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                          isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                        }`} title="ACC Akun Ini">
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}

                      {/* KHUSUS ADMIN DIVISI, DEVELOPER, & SUPERADMIN: Tombol Lock/Unlock individual */}
                      {(isAdmin || isDeveloper || isSuperAdmin) && (
                        <button 
                          onClick={() => handleToggleLock(intern.id, intern.name, intern.is_locked)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border transition-colors ${
                            intern.is_locked 
                              ? (isDark ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/40" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100") 
                              : (isDark ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/40" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")
                          }`}
                          title={intern.is_locked ? "Buka Gembok Individual" : "Kunci Akun Individual"}
                        >
                          <i className={`fa-solid ${intern.is_locked ? "fa-unlock" : "fa-lock"}`}></i>
                        </button>
                      )}

                      {(isAdmin || isDeveloper || isSuperAdmin) && (
                         <button onClick={() => handleDelete(intern.id, intern.name)} className={`w-8 h-8 rounded-lg transition-all shadow-sm border ${
                           isDark ? "bg-zinc-900 border-zinc-700 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-500 hover:text-white"
                         }`} title="Hapus Akun">
                           <i className="fa-solid fa-trash-can"></i>
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        {...modalState} 
        onClose={closeModal} 
        isDark={isDark} 
      />

    </div>
  );
};

export default ManageAccountIntern;