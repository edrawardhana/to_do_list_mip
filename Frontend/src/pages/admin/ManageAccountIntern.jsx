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
  // LOGIC WARNA TEMA DINAMIS (ADMIN-CENTRIC)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  const isDark = isDeveloperTheme; // Disamakan untuk ConfirmModal
  
  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-emerald-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-emerald-400" 
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
    
    // Toolbar & Filter (Lantai Hero)
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",

    // Content
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    trHover: isDeveloperTheme ? "hover:bg-zinc-800/30" : "hover:bg-slate-50",
  };

  // ==========================================
  // DATA ANAK MAGANG
  // ==========================================
  const [interns, setInterns] = useState([]);
  const [divisions, setDivisions] = useState([]); 

  const fetchInterns = async () => {
    try {
      const [res, divRes] = await Promise.all([
        api.get('/profiles'),
        canViewAll ? api.get('/divisions') : Promise.resolve({ data: [] })
      ]);
      
      const data = res.data?.data || res.data || [];
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
  // LOGIC FILTER
  // ==========================================
  const filteredInterns = useMemo(() => {
    let data = interns;

    if (!canViewAll) {
      data = data.filter(intern => intern.division === myDivision);
    } else if (filterDivision !== "Semua") {
      data = data.filter(intern => intern.division === filterDivision);
    }

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

  const pendingInterns  = useMemo(() => filteredInterns.filter(i => !i.is_verified), [filteredInterns]);
  const verifiedInterns = useMemo(() => filteredInterns.filter(i => i.is_verified),  [filteredInterns]);

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

  const handleDelete = (id, name, isVerified = true) => {
    const isReject = !isVerified;
    setModalState({
      isOpen: true,
      type: "delete",
      title: isReject ? "Tolak Pendaftaran" : "Hapus Permanen",
      message: isReject
        ? `Tolak dan hapus pendaftaran ${name}? Akun mereka akan dihapus dari sistem.`
        : `BAHAYA! Yakin ingin menghapus permanen akun ${name}? Seluruh data tugas dan histori mereka akan terhapus.`,
      actionText: isReject ? "Ya, Tolak" : "Ya, Hapus!",
      onConfirm: async () => {
        try {
          await api.delete(`/profiles/${id}`);
          toast.success(isReject ? `Pendaftaran ${name} ditolak` : `Akun ${name} telah dihapus`);
          fetchInterns();
        } catch (error) {
          const msg = error.response?.data?.message || "Gagal menghapus akun";
          toast.error(msg);
        }
      }
    });
  };

  return (
    <div className={`space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto ${isDark ? 'text-zinc-100' : ''}`}>
      
      {/* ================================================================= */}
      {/* HERO SECTION (RESPONSIVE & NO WHITESPACE)                           */}
      {/* ================================================================= */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8 pb-6 sm:pb-10">
          
          {/* KOLOM KIRI */}
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-users-gear text-sm sm:text-lg md:text-xl" />
              </div>
              <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                {canViewAll ? "Master Access Control" : "Division Admin Mode"}
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-2 sm:mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Kelola Akun Intern.
            </h1>
            <p className={`text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Verifikasi pendaftaran baru dan kelola akun intern {canViewAll ? "seluruh divisi" : `divisi ${myDivision}`}.
            </p>
          </div>

          {/* KOLOM KANAN (Stats Widget) - FIX: h-fit & lg:self-center biar rapet */}
          <div className={`w-full lg:w-80 shrink-0 h-fit lg:self-center rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md flex flex-col gap-3 sm:gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 sm:pb-3 mb-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Intern Summary</span>
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 sm:py-1 rounded-md">{canViewAll ? "Global" : myDivision}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-amber-400 mb-0.5 sm:mb-1">Pending ACC</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.pending}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-emerald-400 mb-0.5 sm:mb-1">Akun Aktif</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{verifiedInterns.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 TOOLBAR LANTAI HERO: FILTER & SEARCH (RESPONSIVE) */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <i className={`fa-solid fa-filter transition-colors ${theme.iconMuted}`}></i>
             {canViewAll ? (
               <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)}
                 className="rounded-lg px-2 py-1.5 text-[11px] sm:text-xs font-bold outline-none cursor-pointer bg-transparent text-white border-none appearance-none w-full sm:w-auto"
               >
                 <option className="text-slate-800" value="Semua">Semua Divisi</option>
                 {divisions.map((divName, idx) => <option key={idx} className="text-slate-800" value={divName}>{divName}</option>)}
               </select>
             ) : (
               <p className="text-[11px] font-black uppercase text-white tracking-widest">{myDivision}</p>
             )}
          </div>

          <div className="relative w-full sm:max-w-xs md:max-w-sm lg:w-64 shrink-0 group">
            <i className={`fa-solid fa-magnifying-glass absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder="Cari nama atau email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium outline-none border transition-colors shadow-sm ${theme.inputBg}`} />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PENDING ACC SECTION (RESPONSIVE)                                  */}
      {/* ================================================================= */}
      {pendingInterns.length > 0 && (
        <div className={`rounded-[1.5rem] sm:rounded-[2rem] border overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#09090b] border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-100/60'}`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500 text-white'}`}>
              <i className="fa-solid fa-user-clock text-xs sm:text-sm"></i>
            </div>
            <div className="min-w-0">
              <h3 className={`font-black text-xs sm:text-sm truncate ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                Menunggu Persetujuan ACC
              </h3>
              <p className={`text-[9px] sm:text-[11px] font-medium truncate ${isDark ? 'text-amber-500/70' : 'text-amber-600'}`}>
                {pendingInterns.length} akun intern baru perlu diverifikasi
              </p>
            </div>
          </div>

          <div className={`divide-y ${isDark ? 'divide-amber-500/10' : 'divide-amber-200/30'}`}>
            {pendingInterns.map((intern) => (
              <div key={intern.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors ${isDark ? 'hover:bg-amber-500/5' : 'hover:bg-amber-100/50'}`}>
                {/* Avatar & Info */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-amber-200 text-amber-700 border-amber-300'}`}>
                    {intern.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{intern.name}</p>
                    <p className={`text-[10px] sm:text-[11px] truncate mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{intern.email}</p>
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                      {intern.division}
                    </span>
                  </div>
                </div>

                {/* Actions (Full width di mobile, inline di desktop) */}
                <div className="flex flex-row items-center gap-2 shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleVerify(intern.id, intern.name)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all shadow-md active:scale-95 ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    }`}
                  >
                    <i className="fa-solid fa-check"></i> ACC
                  </button>
                  <button
                    onClick={() => handleDelete(intern.id, intern.name, false)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all border active:scale-95 ${
                      isDark
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <i className="fa-solid fa-xmark"></i> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DATA TABLE (RESPONSIVE HORIZONTAL SCROLL)                           */}
      {/* ================================================================= */}
      <div className={`rounded-[1.5rem] sm:rounded-[2rem] border shadow-xl relative overflow-hidden transition-all duration-500 ${theme.panelBg}`}>
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800 bg-[#141417]/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <h3 className={`font-black text-xs sm:text-sm flex items-center gap-2 ${theme.textPrimary}`}>
            <i className={`fa-solid fa-users ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}></i> Intern Aktif
            <span className={`ml-1.5 sm:ml-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
              {verifiedInterns.length}
            </span>
          </h3>
        </div>

        {/* Wrapper overflow untuk scroll nyamping di HP */}
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className={`w-full text-left text-xs sm:text-sm min-w-[500px] sm:min-w-[600px] ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
            <thead className={`border-b text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] ${
              isDark ? "bg-[#18181b] border-zinc-800 text-zinc-500" : "bg-slate-50/50 border-slate-100 text-slate-400"
            }`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">Nama & Info</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">Status Akun</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-zinc-800/50" : "divide-slate-50"}`}>
              {verifiedInterns.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`px-4 sm:px-6 py-12 sm:py-16 text-center ${theme.textSecondary}`}>
                    <i className="fa-solid fa-user-slash text-3xl sm:text-4xl mb-2 sm:mb-3 block opacity-30"></i>
                    <p className="text-xs sm:text-sm font-bold">Belum ada intern aktif di divisi ini.</p>
                  </td>
                </tr>
              ) : verifiedInterns.map((intern) => (
                <tr key={intern.id} className={`group transition-colors ${theme.trHover}`}>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border ${
                        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700 shadow-inner" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {intern.name.charAt(0)}
                      </div>
                      <div className="min-w-[120px] sm:min-w-[150px]">
                        <p className={`font-bold text-xs sm:text-sm mb-0.5 whitespace-nowrap ${theme.textPrimary}`}>{intern.name}</p>
                        <p className={`text-[9px] sm:text-[10px] font-medium mb-0.5 whitespace-nowrap ${theme.textSecondary}`}>{intern.email}</p>
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isDark ? "text-emerald-500" : "text-blue-500"}`}>{intern.division}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    {intern.is_locked ? (
                      <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 sm:gap-1.5 w-max ${
                        isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        <i className="fa-solid fa-lock"></i> Terkunci
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 sm:gap-1.5 w-max ${
                        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        <i className="fa-solid fa-unlock"></i> Aktif
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    {/* Tampil selalu di HP (opacity-100), hidden di Desktop sampai hover (lg:opacity-0 lg:group-hover:opacity-100) */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-max opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {/* Lock / Unlock */}
                      {(isAdmin || isDeveloper || isSuperAdmin) && (
                        <button
                          onClick={() => handleToggleLock(intern.id, intern.name, intern.is_locked)}
                          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors ${
                            intern.is_locked
                              ? (isDark ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/40" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100")
                              : (isDark ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/40" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")
                          }`}
                          title={intern.is_locked ? "Buka Akun" : "Kunci Akun"}
                        >
                          <i className={`fa-solid ${intern.is_locked ? "fa-unlock" : "fa-lock"}`}></i>
                          <span className="hidden sm:inline">{intern.is_locked ? "Buka" : "Kunci"}</span>
                        </button>
                      )}

                      {/* Delete */}
                      {(isDeveloper || isSuperAdmin) && (
                        <button
                          onClick={() => handleDelete(intern.id, intern.name, true)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all shadow-sm border flex items-center justify-center ${
                            isDark ? "bg-zinc-900 border-zinc-700 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-500 hover:text-white"
                          }`}
                          title="Hapus Akun"
                        >
                          <i className="fa-solid fa-trash-can text-[10px] sm:text-xs"></i>
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