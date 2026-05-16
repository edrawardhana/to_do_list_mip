import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const ManageAdmin = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS
  // ==========================================
  const isDeveloperTheme = isDeveloper; 
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; 

  const [users, setUsers] = useState([]);
  const [divisionsList, setDivisionsList] = useState(["IT Support", "Multimedia", "Public Relation", "Creative Design", "Global Management"]);
  const [loading, setLoading] = useState(true);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");
  
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  // Auto-reset & Disable divisi jika pilih superadmin
  const isFilteringSuperAdmin = filterRole === "super_admin";
  useEffect(() => {
    if (isFilteringSuperAdmin) {
      setFilterDivision("semua");
    }
  }, [filterRole, isFilteringSuperAdmin]);

  // ==========================================
  // THEME CONFIGURATION OBJECT (HITAM PEKAT & BEBAS IJO UNTUK DEV)
  // ==========================================
  const theme = {
    // --- HERO THEME (HITAM PEKAT DEV, UNGU SUPERADMIN) ---
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a] shadow-zinc-900/30" : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "from-zinc-800/10 via-zinc-900/5" : isPurpleTheme ? "from-purple-500/10 via-fuchsia-500/5" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-zinc-800/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-300" : "bg-white/10 border-white/10 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/50 border-zinc-800" : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200/70" : "text-blue-100/70",
    
    // --- STATS CARDS (PROXY) ---
    proxyBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/50" : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" : "bg-blue-900/30 border-blue-700/50",
    proxyIconIntern: isDeveloperTheme ? "text-zinc-500" : "text-emerald-400",
    proxyIconAdmin: isDeveloperTheme ? "text-zinc-400" : "text-sky-400",
    proxyIconSuper: isDeveloperTheme ? "text-zinc-300" : isPurpleTheme ? "text-fuchsia-400" : "text-fuchsia-400",
    proxyIconLock: isDeveloperTheme ? "text-zinc-600" : "text-rose-400",
    proxyLabel: isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200/70" : "text-white/40",
    
    // --- TOOLBAR & FILTER (HERO) ---
    toolbarBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : isPurpleTheme ? "bg-[#18112a] border-[#342459]" : "bg-[#1c2242] border-white/10",
    inputBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-600" : isPurpleTheme ? "bg-[#1d1633] border-[#342459] focus:border-purple-400 text-white placeholder:text-purple-400/50" : "bg-white/10 border-white/20 text-white placeholder:text-white/50",
    inputDisabled: isDeveloperTheme ? "bg-[#09090b]/50 border-zinc-800/50 text-zinc-600" : isPurpleTheme ? "bg-[#18112a]/50 border-[#342459]/50 text-purple-300/50" : "bg-[#1c2242]/50 border-white/5 text-blue-200/30",
    iconMuted: isDeveloperTheme ? "text-zinc-600 group-focus-within:text-zinc-400" : isPurpleTheme ? "text-purple-400/50 group-focus-within:text-purple-300" : "text-white/60",
    optionText: isDeveloperTheme ? "text-zinc-200 bg-[#18181b]" : isPurpleTheme ? "text-white bg-[#1d1633]" : "text-slate-800 bg-white",

    // --- TABLE THEME (PUTIH UNTUK SUPERADMIN & ADMIN, GELAP HANYA UNTUK DEV) ---
    tableWrap: isDeveloperTheme ? "bg-[#0f0f11] border-zinc-800" : "bg-white border-slate-200",
    tableHeadBar: isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-slate-50 border-slate-100",
    tableIconBox: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400" : isPurpleTheme ? "bg-purple-100 border-purple-200 text-purple-600" : "bg-blue-100 border-blue-200 text-blue-600",
    tableTitle: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    tableBadge: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-600" : isPurpleTheme ? "bg-purple-50 border-purple-100 text-purple-600" : "bg-slate-100 border-slate-200 text-slate-400",
    thBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-600" : "bg-white border-slate-100 text-slate-400",
    trBorder: isDeveloperTheme ? "divide-zinc-800/60" : "divide-slate-50",
    trHover: isDeveloperTheme ? "hover:bg-zinc-800/30" : "hover:bg-slate-50/80",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-600" : "text-slate-400",
    
    // --- ACTIONS & BADGES ---
    roleDropdown: isDeveloperTheme ? "bg-[#18181b] border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-slate-200 text-slate-700 hover:border-blue-400",
    btnLock: isDeveloperTheme ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
    btnUnlock: isDeveloperTheme ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/30" : "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100",
    btnDelete: isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500",
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, divsRes] = await Promise.all([
        api.get('/profiles'),
        api.get('/divisions')
      ]);
      
      const profilesData = usersRes.data?.data || usersRes.data || [];
      const divsData = divsRes.data?.data || divsRes.data || [];
      
      setUsers(profilesData.filter(u => u.role !== 'developer').map(u => ({
        id: u.id,
        name: u.full_name || u.name || "Unknown",
        email: u.email,
        division: u.division?.name || u.division_name || u.division || "Unknown",
        role: u.role,
        is_locked: u.is_locked || false 
      })));
      
      if (divsData.length > 0) {
        setDivisionsList(divsData.map(d => d.name));
      }
    } catch (error) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // LOGIC FILTER
  // ==========================================
  const filteredUsers = useMemo(() => {
    let data = users;

    if (filterRole !== "semua") {
      if (filterRole === "user") {
        data = data.filter(u => u.role === "user" || u.role === "intern");
      } else {
        data = data.filter(u => u.role === filterRole);
      }
    }
    
    if (filterDivision !== "semua") {
      data = data.filter(u => u.division === filterDivision);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(u => 
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) || 
        (u.division || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [users, filterRole, filterDivision, searchQuery]);

  const stats = useMemo(() => {
    return {
      interns: users.filter(u => u.role === "user" || u.role === "intern").length,
      admins: users.filter(u => u.role === "admin").length,
      supers: users.filter(u => u.role === "super_admin").length,
      locked: users.filter(u => u.is_locked).length,
    };
  }, [users]);

  // ==========================================
  // LOGIC VISUAL & AKSI
  // ==========================================
  const getRoleBadge = (role) => {
    const safeRole = role?.toLowerCase() || '';
    if (isDeveloperTheme) {
      switch(safeRole) {
        case 'super_admin': return { cls: "bg-zinc-800 text-zinc-200 border-zinc-600", label: "Super Admin", icon: "fa-crown" };
        case 'admin': return { cls: "bg-zinc-800/70 text-zinc-300 border-zinc-700", label: "Admin Divisi", icon: "fa-shield-halved" };
        default: return { cls: "bg-zinc-900 text-zinc-500 border-zinc-800", label: "Intern", icon: "fa-user-graduate" };
      }
    } else if (isPurpleTheme) {
      switch(safeRole) {
        case 'super_admin': return { cls: "bg-purple-100 text-purple-700 border-purple-200", label: "Super Admin", icon: "fa-crown" };
        case 'admin': return { cls: "bg-sky-100 text-sky-700 border-sky-200", label: "Admin Divisi", icon: "fa-shield-halved" };
        default: return { cls: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", label: "Intern", icon: "fa-user-graduate" };
      }
    } else {
      switch(safeRole) {
        case 'super_admin': return { cls: "bg-purple-100 text-purple-700 border-purple-200", label: "Super Admin", icon: "fa-crown" };
        case 'admin': return { cls: "bg-sky-100 text-sky-700 border-sky-200", label: "Admin Divisi", icon: "fa-shield-halved" };
        default: return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Intern", icon: "fa-user-graduate" };
      }
    }
  };

  const handleRoleChange = async (id, name, currentRole, newRole) => {
    if (id === user?.id && newRole !== currentRole) {
      toast.error("Brok! Lu gak bisa nurunin pangkat lu sendiri.");
      return;
    }

    const roleHierarchy = { "intern": 1, "user": 1, "admin": 2, "super_admin": 3 };
    let actionText = "mengubah kasta";
    if (roleHierarchy[newRole] > roleHierarchy[currentRole]) actionText = "MENGANGKAT (Promote)";
    if (roleHierarchy[newRole] < roleHierarchy[currentRole]) actionText = "MENURUNKAN (Demote)";

    setModalState({
      isOpen: true, 
      type: "promote", 
      title: "Ubah Role", 
      message: `Yakin ingin ${actionText} ${name} menjadi ${newRole.toUpperCase()}?`, 
      actionText: "Ya, Ubah!",
      onConfirm: async () => { 
        try { 
          await api.put(`/profiles/${id}/role`, { role: newRole }); 
          toast.success(`Sukses! ${name} sekarang adalah ${newRole.toUpperCase()}.`); 
          fetchData(); 
        } catch { 
          toast.error("Gagal mengubah role pengguna"); 
        } 
      }
    });
  };

  const handleToggleLock = async (id, name, currentState) => {
    const actionText = currentState ? "Membuka Gembok" : "Mengunci";
    const confirmMsg = currentState 
      ? `Yakin ingin mengizinkan ${name} login kembali?` 
      : `Yakin ingin menendang ${name} dari sistem sekarang juga?`;

    setModalState({
      isOpen: true, 
      type: currentState ? "unlock" : "lock", 
      title: `${actionText} Akun`, 
      message: confirmMsg, 
      actionText: currentState ? "Ya, Buka" : "Ya, Kunci",
      onConfirm: async () => { 
        try { 
          await api.put(`/profiles/${id}/lock`, { is_locked: !currentState }); 
          toast.success(`Sukses! Akun ${name} berhasil di-${currentState ? 'Unlock' : 'Lock'}.`); 
          fetchData(); 
        } catch { 
          toast.error("Gagal merubah status kunci pengguna"); 
        } 
      }
    });
  };

  const handleDelete = (id, name) => {
    setModalState({
      isOpen: true, 
      type: "delete", 
      title: "Hapus Permanen", 
      message: `BAHAYA! Yakin ingin menghapus permanen akun ${name}? Seluruh data mereka akan terhapus.`, 
      actionText: "Ya, Hapus!",
      onConfirm: async () => { 
        try { 
          await api.delete(`/profiles/${id}`); 
          toast.success(`Akun ${name} telah dihapus`); 
          fetchData(); 
        } catch { 
          toast.error("Gagal menghapus akun"); 
        } 
      }
    });
  };

  const roleOptions = [
    { value: "semua", label: "Semua Kasta" },
    { value: "user", label: "Interns" },
    { value: "admin", label: "Admins" }
  ];
  if (isDeveloperTheme || isPurpleTheme) {
    roleOptions.push({ value: "super_admin", label: "Superadmins" });
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

        {/* ================================================================= */}
        {/* HERO SECTION (DYNAMIC THEME)                                        */}
        {/* ================================================================= */}
        <div className={`rounded-[2rem] md:rounded-[2.5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 ${theme.heroBg}`}>
          
          {/* Efek Cahaya / Blob */}
          <div className={`absolute top-0 right-0 w-full h-[500px] bg-gradient-to-br to-transparent pointer-events-none ${theme.blobTop}`}></div>
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${theme.blobBot}`}></div>

          <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col lg:flex-row justify-between gap-8">
            <div className="lg:max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-5 md:mb-6">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center shadow-inner shrink-0 ${theme.iconBg}`}>
                  <i className="fa-solid fa-user-shield text-lg md:text-xl"></i>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] px-3 py-1.5 md:py-2 rounded-lg border ${theme.badgeBg}`}>
                  Access & Role Management
                </span>
              </div>
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 leading-tight ${theme.title}`}>
                Role Controller.
              </h1>
              <p className={`text-xs sm:text-sm font-medium max-w-xl leading-relaxed ${theme.subtitle}`}>
                Kelola akses, role, dan keamanan akun pengguna sistem secara terpusat.
              </p>

              {/* Badges Bawah */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6 md:mt-8">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-300" : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-200" : "bg-blue-500/20 border-blue-400/30 text-blue-200"
                }`}>
                  <span className="relative flex h-2.5 w-2.5 mr-1">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDeveloperTheme ? 'bg-zinc-500' : isPurpleTheme ? 'bg-purple-400' : 'bg-blue-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isDeveloperTheme ? 'bg-zinc-400' : isPurpleTheme ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Roles Synced</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-400" : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50 text-purple-300" : "bg-blue-900/30 border-blue-700/50 text-blue-300"
                }`}>
                  <i className="fa-solid fa-shield-halved text-xs opacity-70"></i>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Security Protocol</span>
                </div>
              </div>
            </div>

            {/* Kotak Stats Kanan */}
            <div className={`w-full lg:w-80 shrink-0 flex flex-col justify-center border rounded-3xl p-6 backdrop-blur-md transition-colors ${theme.proxyBg}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-user-graduate text-sm ${theme.proxyIconIntern}`}></i>
                    <span className={`text-xs font-black uppercase tracking-widest ${theme.proxyLabel}`}>Interns</span>
                  </div>
                  <span className={`text-xl font-black ${theme.title}`}>{loading ? "·" : stats.interns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-shield-halved text-sm ${theme.proxyIconAdmin}`}></i>
                    <span className={`text-xs font-black uppercase tracking-widest ${theme.proxyLabel}`}>Admins</span>
                  </div>
                  <span className={`text-xl font-black ${theme.title}`}>{loading ? "·" : stats.admins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-crown text-sm ${theme.proxyIconSuper}`}></i>
                    <span className={`text-xs font-black uppercase tracking-widest ${theme.proxyLabel}`}>Supers</span>
                  </div>
                  <span className={`text-xl font-black ${theme.title}`}>{loading ? "·" : stats.supers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-lock text-sm ${theme.proxyIconLock}`}></i>
                    <span className={`text-xs font-black uppercase tracking-widest ${theme.proxyLabel}`}>Locked</span>
                  </div>
                  <span className={`text-xl font-black ${theme.title}`}>{loading ? "·" : stats.locked}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Bawah Hero */}
          <div className={`relative z-10 border-t px-5 sm:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-xl transition-colors ${theme.toolbarBg}`}>
            {/* Search */}
            <div className="relative w-full md:w-80 group">
              <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${theme.iconMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, atau divisi..."
                className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none border transition-all ${theme.inputBg}`}
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              
              {/* Filter Role (Bertindak sbg Tab) */}
              <div className="relative flex-1 group w-full md:w-40">
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none cursor-pointer border transition-all ${theme.inputBg}`}
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className={theme.optionText}>{opt.label}</option>
                  ))}
                </select>
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${theme.iconMuted}`} />
              </div>

              {/* Filter Divisi (Disable kalo filter role = Superadmin) */}
              <div className="relative flex-1 group w-full md:w-48">
                <select
                  value={filterDivision}
                  onChange={e => setFilterDivision(e.target.value)}
                  disabled={isFilteringSuperAdmin}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none border transition-all ${
                    isFilteringSuperAdmin ? `${theme.inputDisabled} cursor-not-allowed` : `${theme.inputBg} cursor-pointer`
                  }`}
                >
                  {isFilteringSuperAdmin ? (
                    <option value="semua" className={theme.optionText}>Global (Semua Divisi)</option>
                  ) : (
                    <>
                      <option value="semua" className={theme.optionText}>Semua Divisi</option>
                      {divisionsList.map(div => <option key={div} value={div} className={theme.optionText}>{div}</option>)}
                    </>
                  )}
                </select>
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${isFilteringSuperAdmin ? "opacity-50" : ""} ${theme.iconMuted}`} />
              </div>

              {/* Reset Button (X) - HANYA MUNCUL KALO ADA PENCARIAN (SEARCH) */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`px-5 py-3 rounded-xl text-xs font-black border transition-all shadow-sm w-full sm:w-auto ${
                    isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200" : isPurpleTheme ? "bg-purple-800 border-purple-700 text-purple-300 hover:text-white" : "bg-blue-800 border-blue-700 text-blue-300 hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TABLE SECTION (PUTIH UNTUK SUPERADMIN & ADMIN, GELAP UNTUK DEV)     */}
        {/* ================================================================= */}
        <div className={`rounded-[2rem] border overflow-hidden shadow-sm transition-colors duration-700 ${theme.tableWrap}`}>
          {/* Table header bar */}
          <div className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${theme.tableHeadBar}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${theme.tableIconBox}`}>
                <i className="fa-solid fa-users-gear text-xs" />
              </div>
              <h3 className={`font-black text-sm transition-colors ${theme.tableTitle}`}>Daftar Pengguna Sistem</h3>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border w-full sm:w-auto text-center transition-colors ${theme.tableBadge}`}>
              {loading ? "Memuat..." : `${filteredUsers.length} pengguna`}
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className={`border-b text-[10px] uppercase font-black tracking-widest transition-colors ${theme.thBg}`}>
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Identitas</th>
                  <th className="px-6 py-4 whitespace-nowrap">Divisi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Role</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${theme.trBorder}`}>

                {/* Loading Skeleton */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl shrink-0 ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /><div className="space-y-1.5"><div className={`h-3 w-28 rounded ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /><div className={`h-2 w-36 rounded ${isDeveloperTheme ? "bg-zinc-900" : "bg-slate-50"}`} /></div></div></td>
                    <td className="px-6 py-4"><div className={`h-7 w-24 rounded-lg ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4"><div className={`h-7 w-20 rounded-lg ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4 text-center"><div className={`h-7 w-16 rounded-lg mx-auto ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4"><div className={`h-8 w-40 rounded-lg ml-auto ${isDeveloperTheme ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                  </tr>
                ))}

                {/* Rows */}
                {!loading && filteredUsers.map(u => {
                  const badge = getRoleBadge(u.role);
                  const isUserSuperAdmin = u.role === 'super_admin';
                  const canDelete = isDeveloperTheme || (!isUserSuperAdmin); 

                  return (
                    <tr key={u.id} className={`transition-colors group ${theme.trHover}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${badge.cls}`}>
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-black text-[13px] sm:text-sm leading-tight truncate max-w-[150px] sm:max-w-xs transition-colors ${theme.textPrimary}`}>{u.name}</p>
                            <p className={`text-[9px] sm:text-[10px] font-medium mt-0.5 truncate max-w-[150px] sm:max-w-xs transition-colors ${theme.textSecondary}`}>{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold border inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${isDeveloperTheme ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          <i className="fa-solid fa-building text-[8px] sm:text-[9px]" /> {u.division}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${badge.cls}`}>
                          <i className={`fa-solid ${badge.icon}`} /> {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {u.is_locked ? (
                          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 transition-colors ${isDeveloperTheme ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                            <i className="fa-solid fa-lock" /> Terkunci
                          </span>
                        ) : (
                          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 transition-colors ${isDeveloperTheme ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                            <i className="fa-solid fa-unlock" /> Aman
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 justify-end w-full">
                          
                          <button onClick={() => handleToggleLock(u.id, u.name, u.is_locked)} title={u.is_locked ? "Buka Akun" : "Kunci Akun"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${u.is_locked ? theme.btnUnlock : theme.btnLock}`}>
                            <i className={`fa-solid ${u.is_locked ? "fa-unlock" : "fa-lock"}`} />
                          </button>

                          <div className="relative shrink-0">
                            <select value={u.role} onChange={e => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                              className={`w-28 sm:w-32 border rounded-xl pl-2 sm:pl-3 pr-6 py-2 text-[10px] sm:text-[11px] font-bold outline-none appearance-none cursor-pointer transition-colors ${theme.roleDropdown}`}>
                              <option value="user">USER/INTERN</option>
                              <option value="admin">ADMIN</option>
                              {(isDeveloperTheme || isUserSuperAdmin) && <option value="super_admin">SUPER ADMIN</option>}
                            </select>
                            <i className={`fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none transition-colors ${theme.textSecondary}`} />
                          </div>

                          {canDelete ? (
                            <button onClick={() => handleDelete(u.id, u.name)} title="Hapus Akun"
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${theme.btnDelete}`}>
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          ) : (
                            <div className="w-8 h-8 shrink-0"></div> 
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state */}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className={`py-16 text-center transition-colors ${isDeveloperTheme ? "bg-[#0f0f11]" : "bg-slate-50/50"}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border transition-colors ${isDeveloperTheme ? "bg-zinc-900 border-zinc-800 text-zinc-700" : "bg-white border-slate-100 text-slate-300"}`}>
                        <i className="fa-solid fa-user-slash text-xl" />
                      </div>
                      <p className={`font-black mb-1 transition-colors ${isDeveloperTheme ? "text-zinc-400" : "text-slate-700"}`}>Tidak ada pengguna.</p>
                      <p className={`text-xs font-medium transition-colors ${isDeveloperTheme ? "text-zinc-700" : "text-slate-400"}`}>Coba ubah filter atau gunakan kata kunci lain.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <ConfirmModal {...modalState} onClose={closeModal} isDark={isDeveloperTheme} />
    </>
  );
};

export default ManageAdmin;