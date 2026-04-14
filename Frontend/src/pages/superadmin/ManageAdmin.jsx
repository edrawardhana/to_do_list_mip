import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const ManageAdmin = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  
  // Pastikan cuma VVIP yang bisa akses
  const canManageRoles = isSuperAdmin || isDeveloper;

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS
  // ==========================================
  const isDeveloperTheme = isDeveloper; // Kasta Tertinggi: Hitam/Zinc
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; // Kasta 2: Ungu

  const [users, setUsers] = useState([]);
  const [divisionsList, setDivisionsList] = useState(["IT Support", "Multimedia", "Public Relation", "Creative Design", "Global Management"]);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");

  const fetchData = async () => {
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
        role: u.role
      })));
      
      if (divsData.length > 0) {
        setDivisionsList(divsData.map(d => d.name));
      }
    } catch (error) {
      console.error("Gagal memuat data admin:", error);
      toast.error("Gagal memuat data pengguna");
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
      data = data.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return data;
  }, [users, filterRole, filterDivision, searchQuery]);

  // Statistik Kasta (Tanpa Developer)
  const stats = useMemo(() => {
    return {
      interns: users.filter(u => u.role === "user" || u.role === "intern").length,
      admins: users.filter(u => u.role === "admin").length,
      supers: users.filter(u => u.role === "super_admin").length,
    };
  }, [users]);

  // ==========================================
  // FUNGSI GANTI KASTA (PROMOTE/DEMOTE)
  // ==========================================
  const handleRoleChange = async (id, name, currentRole, newRole) => {
    // 1. Safety Lock: Cegah Superadmin nurunin kastanya sendiri
    if (id === user?.id && newRole !== currentRole) {
      toast.error("Brok! Lu gak bisa nurunin pangkat lu sendiri. Ntar siapa yang ngurus sistem?");
      return;
    }

    // 2. Logic Konfirmasi
    // Kita anggap 'user' dan 'intern' ada di level hierarki kasta yang sama (1)
    const roleHierarchy = { "intern": 1, "user": 1, "admin": 2, "super_admin": 3 };
    
    let actionText = "mengubah kasta";
    if (roleHierarchy[newRole] > roleHierarchy[currentRole]) actionText = "MENGANGKAT (Promote)";
    if (roleHierarchy[newRole] < roleHierarchy[currentRole]) actionText = "MENURUNKAN (Demote)";

    if (window.confirm(`Yakin ingin ${actionText} ${name} menjadi ${newRole.toUpperCase()}?`)) {
      try {
        await api.put(`/profiles/${id}/role`, { role: newRole });
        toast.success(`Sukses! ${name} sekarang adalah ${newRole.toUpperCase()}.`);
        fetchData();
      } catch (error) {
        toast.error("Gagal mengubah role pengguna");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION & TOOLBAR (TEMA DINAMIS VVIP)                        */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden flex flex-col ${
        isDeveloperTheme ? "bg-[#0f0f11] border-[#27272a]" : "bg-[#1d1633] border-[#342459] shadow-purple-900/20"
      }`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isDeveloperTheme ? "bg-zinc-500/10" : "bg-purple-500/20"
        }`}></div>
        
        {/* Header Content */}
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner backdrop-blur-md ${
              isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700 text-zinc-300" : "bg-purple-500/20 border-purple-400/30 text-purple-400"
            }`}>
              <i className="fa-solid fa-user-shield text-lg"></i>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isDeveloperTheme ? "text-zinc-400" : "text-purple-300"
            }`}>Access & Role Management</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white ${
            isDeveloperTheme ? "to-zinc-300" : "to-purple-200"
          }`}>Role Controller System</h1>
          
          {/* WIDGET ANIMASI */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`animate-[spin_3s_linear_infinite] ${isDeveloperTheme ? 'text-zinc-500' : 'text-purple-400'}`} />
              </svg>
              <i className={`fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] ${isDeveloperTheme ? 'text-zinc-400' : 'text-purple-400'}`}></i>
            </div>

            <div className="h-6 w-px bg-white/20 rounded-full"></div>

            <div className="flex gap-2">
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                  isDeveloperTheme ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300' : 'bg-purple-500/20 border-purple-400/30 text-purple-200'
              }`}>
                <i className="fa-solid fa-database text-[10px]"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">Roles Synced</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-sm animate-pulse ${
                  isDeveloperTheme ? 'bg-zinc-700/30 border-zinc-600/30 text-zinc-200' : 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200'
              }`} style={{ animationDelay: '500ms' }}>
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">{isDeveloperTheme ? 'Dev Protocol' : 'Superadmin Mode'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Filters (Bawah Hero) */}
        <div className={`relative z-10 border-t px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-xl ${
           isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-[#18112a] border-[#342459]"
        }`}>
           
           {/* Search */}
           <div className="relative w-full md:w-80 group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <i className={`fa-solid fa-magnifying-glass transition-colors ${
                 isDeveloperTheme ? "text-zinc-500 group-focus-within:text-zinc-300" : "text-purple-400/50 group-focus-within:text-purple-300"
               }`}></i>
             </div>
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Cari nama atau email..."
               className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 appearance-none shadow-inner transition-all border ${
                  isDeveloperTheme ? "bg-zinc-900 border-zinc-700 focus:ring-zinc-500 placeholder:text-zinc-600" : 
                  "bg-[#1d1633] border-[#342459] focus:ring-purple-400 placeholder:text-purple-400/50"
               }`}
             />
           </div>

           {/* Dropdowns */}
           <div className="flex w-full md:w-auto gap-3">
             <div className="relative flex-1 md:w-40 group">
               <select 
                 value={filterRole} 
                 onChange={e => setFilterRole(e.target.value)}
                 className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 appearance-none cursor-pointer shadow-inner transition-all border ${
                    isDeveloperTheme ? "bg-zinc-900 border-zinc-700 focus:ring-zinc-500" : 
                    "bg-[#1d1633] border-[#342459] focus:ring-purple-400"
                 }`}
               >
                 <option className="text-slate-800" value="semua">Semua Kasta</option>
                 <option className="text-slate-800" value="user">Interns</option>
                 <option className="text-slate-800" value="admin">Admins</option>
                 <option className="text-slate-800" value="super_admin">Superadmins</option>
               </select>
               <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${
                 isDeveloperTheme ? "text-zinc-500 group-focus-within:text-zinc-300" : "text-purple-400/50 group-focus-within:text-purple-300"
               }`}></i>
             </div>

             <div className="relative flex-1 md:w-48 group">
               <select 
                 value={filterDivision} 
                 onChange={e => setFilterDivision(e.target.value)}
                 className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 appearance-none cursor-pointer shadow-inner transition-all border ${
                    isDeveloperTheme ? "bg-zinc-900 border-zinc-700 focus:ring-zinc-500" : 
                    "bg-[#1d1633] border-[#342459] focus:ring-purple-400"
                 }`}
               >
                 <option className="text-slate-800" value="semua">Semua Divisi</option>
                 {divisionsList.map(div => <option className="text-slate-800" key={div} value={div}>{div}</option>)}
               </select>
               <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${
                 isDeveloperTheme ? "text-zinc-500 group-focus-within:text-zinc-300" : "text-purple-400/50 group-focus-within:text-purple-300"
               }`}></i>
             </div>
           </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* QUICK STATS CARDS                                                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className={`rounded-[1.5rem] p-5 border shadow-sm flex flex-col gap-2 ${
           isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
         }`}>
            <i className={`fa-solid fa-user text-lg ${isDeveloperTheme ? "text-blue-400" : "text-blue-500"}`}></i>
            <h3 className={`text-2xl font-black mt-1 ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>
              {stats.interns} <span className={`text-xs font-bold ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>User</span>
            </h3>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Total Interns</span>
         </div>
         <div className={`rounded-[1.5rem] p-5 border shadow-sm flex flex-col gap-2 ${
           isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
         }`}>
            <i className={`fa-solid fa-user-tie text-lg ${isDeveloperTheme ? "text-emerald-400" : "text-emerald-500"}`}></i>
            <h3 className={`text-2xl font-black mt-1 ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>
              {stats.admins} <span className={`text-xs font-bold ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>User</span>
            </h3>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Total Admins</span>
         </div>
         <div className={`rounded-[1.5rem] p-5 border shadow-sm flex flex-col gap-2 ${
           isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
         }`}>
            <i className={`fa-solid fa-crown text-lg ${isDeveloperTheme ? "text-purple-400" : "text-purple-500"}`}></i>
            <h3 className={`text-2xl font-black mt-1 ${isDeveloperTheme ? "text-zinc-100" : "text-slate-800"}`}>
              {stats.supers} <span className={`text-xs font-bold ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>User</span>
            </h3>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Superadmins</span>
         </div>
      </div>

      {/* ================================================================= */}
      {/* DATA TABLE (ROLE MANAGEMENT)                                        */}
      {/* ================================================================= */}
      <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${
        isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
      }`}>
        <div className={`p-6 border-b flex items-center gap-3 ${
          isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-slate-50/50 border-slate-100"
        }`}>
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
             isDeveloperTheme ? "bg-zinc-800" : "bg-purple-600"
           }`}>
              <i className="fa-solid fa-users-gear text-xs"></i>
           </div>
           <h3 className={`font-black ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>Daftar Pengguna Sistem</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-[10px] uppercase font-black tracking-widest ${
              isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-500" : "bg-white border-slate-100 text-slate-400"
            }`}>
              <tr>
                <th className="px-6 py-5">Identitas Pengguna</th>
                <th className="px-6 py-5">Divisi / Penempatan</th>
                <th className="px-6 py-5 text-right">Manajemen Kasta</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDeveloperTheme ? "divide-zinc-800" : "divide-slate-50"}`}>
              {filteredUsers.map((u) => {
                // Styling visual badge kasta
                const getRoleBadge = (role) => {
                  if (isDeveloperTheme) {
                    switch(role) {
                      case 'super_admin': return { bg: "bg-purple-500/10 border border-purple-500/20", text: "text-purple-400", label: "Super Admin", icon: "fa-crown" };
                      case 'admin': return { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-400", label: "Admin Divisi", icon: "fa-user-tie" };
                      default: return { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-400", label: "Intern", icon: "fa-user" };
                    }
                  } else {
                    switch(role) {
                      case 'super_admin': return { bg: "bg-purple-100", text: "text-purple-700", label: "Super Admin", icon: "fa-crown" };
                      case 'admin': return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Admin Divisi", icon: "fa-user-tie" };
                      default: return { bg: "bg-blue-50", text: "text-blue-600", label: "Intern", icon: "fa-user" };
                    }
                  }
                };
                const badge = getRoleBadge(u.role);

                return (
                  <tr key={u.id} className={`transition-colors ${
                    isDeveloperTheme ? "hover:bg-zinc-800/40" : "hover:bg-slate-50/80"
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${badge.bg} ${badge.text}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-black text-sm mb-0.5 ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>{u.name}</p>
                          <p className={`text-[10px] font-bold ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 w-max ${
                        isDeveloperTheme ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        <i className={`fa-solid fa-building ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}></i> {u.division}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Badge Status Saat Ini (Kiri) */}
                        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                          <i className={`fa-solid ${badge.icon}`}></i> {badge.label}
                        </div>

                        <i className={`fa-solid fa-arrow-right-arrow-left hidden sm:block mx-1 ${isDeveloperTheme ? "text-zinc-700" : "text-slate-300"}`}></i>

                        {/* Dropdown Ubah Kasta (Kanan) */}
                        <div className="relative">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                            className={`border rounded-xl pl-4 pr-8 py-2.5 text-xs font-bold outline-none focus:ring-2 appearance-none cursor-pointer shadow-sm transition-all ${
                              isDeveloperTheme ? "bg-[#09090b] border-zinc-700 text-zinc-300 hover:border-zinc-500 focus:ring-zinc-600" : 
                              "bg-white border-slate-200 text-slate-700 hover:border-purple-400 focus:ring-purple-500"
                            }`}
                          >
                            <option value="user">Set Intern</option>
                            <option value="admin">Set Admin</option>
                            <option value="super_admin">Set Superadmin</option>
                          </select>
                          <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="3" className={`px-6 py-12 text-center ${isDeveloperTheme ? "bg-[#18181b]" : "bg-slate-50/50"}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border shadow-sm ${
                      isDeveloperTheme ? "bg-zinc-800/50 text-zinc-600 border-zinc-700" : "bg-white text-slate-300 border-slate-100"
                    }`}>
                      <i className="fa-solid fa-user-slash"></i>
                    </div>
                    <h3 className={`font-black mb-1 ${isDeveloperTheme ? "text-zinc-300" : "text-slate-800"}`}>User tidak ditemukan.</h3>
                    <p className={`text-xs font-medium ${isDeveloperTheme ? "text-zinc-500" : "text-slate-500"}`}>Coba hapus filter atau cari dengan kata kunci lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ManageAdmin;