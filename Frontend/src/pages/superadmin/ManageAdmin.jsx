import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const ManageAdmin = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  
  // Pastikan cuma VVIP yang bisa akses
  const canManageRoles = isSuperAdmin || isDeveloper;

  // ==========================================
  // DUMMY DATA SEMUA USER (Lintas Divisi & Kasta)
  // ==========================================
  const [users, setUsers] = useState([
    { id: "usr-001", name: "Kiel", email: "kiel@mcc.com", division: "IT Support", role: "intern" },
    { id: "usr-002", name: "Nabil", email: "nabil@mcc.com", division: "IT Support", role: "intern" },
    { id: "usr-003", name: "Mas Anton", email: "anton@mcc.com", division: "Multimedia", role: "admin" },
    { id: "usr-004", name: "Mbak Rina", email: "rina@mcc.com", division: "Public Relation", role: "admin" },
    { id: "usr-005", name: "Root Boss", email: "super@mcc.com", division: "Global Management", role: "superadmin" },
    { id: "usr-006", name: "Developer", email: "dev@mcc.com", division: "System Root", role: "developer" },
  ]);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");

  const divisionsList = ["IT Support", "Multimedia", "Public Relation", "Creative Design", "Global Management"];

  // ==========================================
  // LOGIC FILTER
  // ==========================================
  const filteredUsers = useMemo(() => {
    let data = users;

    if (filterRole !== "semua") {
      data = data.filter(u => u.role === filterRole);
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

  // Statistik Kasta
  const stats = useMemo(() => {
    return {
      interns: users.filter(u => u.role === "intern").length,
      admins: users.filter(u => u.role === "admin").length,
      supers: users.filter(u => u.role === "superadmin").length,
    };
  }, [users]);

  // ==========================================
  // FUNGSI GANTI KASTA (PROMOTE/DEMOTE)
  // ==========================================
  const handleRoleChange = (id, name, currentRole, newRole) => {
    // 1. Safety Lock: Cegah Superadmin nurunin kastanya sendiri biar gak kehilangan akses
    if (id === user?.id && newRole !== currentRole) {
      alert("Brok! Lu gak bisa nurunin pangkat lu sendiri. Ntar siapa yang ngurus sistem?");
      return;
    }

    // 2. Safety Lock: Cegah sembarang orang ngutak-ngatik akun Developer
    if (currentRole === "developer" && !isDeveloper) {
      alert("Hanya System Root yang bisa mengubah kasta Developer.");
      return;
    }

    // 3. Logic Konfirmasi (Promote / Demote)
    const roleHierarchy = { "intern": 1, "admin": 2, "superadmin": 3, "developer": 4 };
    
    let actionText = "mengubah kasta";
    if (roleHierarchy[newRole] > roleHierarchy[currentRole]) actionText = "MENGANGKAT (Promote)";
    if (roleHierarchy[newRole] < roleHierarchy[currentRole]) actionText = "MENURUNKAN (Demote)";

    if (window.confirm(`Yakin ingin ${actionText} ${name} menjadi ${newRole.toUpperCase()}?`)) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      // Nanti tembak RPC Supabase di sini: update role user
      alert(`Sukses! ${name} sekarang adalah ${newRole.toUpperCase()}.`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* FILTER & SEARCH ROW                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-40">
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
            >
              <option value="semua">Semua Kasta</option>
              <option value="intern">Interns</option>
              <option value="admin">Admins</option>
              <option value="superadmin">Superadmins</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          </div>

          <div className="relative flex-1 md:w-48">
            <select 
              value={filterDivision} 
              onChange={e => setFilterDivision(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
            >
              <option value="semua">Semua Divisi</option>
              {divisionsList.map(div => <option key={div} value={div}>{div}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DATA TABLE (ROLE MANAGEMENT)                                        */}
      {/* ================================================================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-5">Identitas Pengguna</th>
                <th className="px-6 py-5">Divisi / Penempatan</th>
                <th className="px-6 py-5 text-right">Manajemen Kasta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => {
                // Styling visual badge kasta
                const getRoleBadge = (role) => {
                  switch(role) {
                    case 'developer': return { bg: "bg-stone-800", text: "text-stone-100", label: "Developer", icon: "fa-code" };
                    case 'superadmin': return { bg: "bg-purple-100", text: "text-purple-700", label: "Super Admin", icon: "fa-crown" };
                    case 'admin': return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Admin Divisi", icon: "fa-user-tie" };
                    default: return { bg: "bg-blue-50", text: "text-blue-600", label: "Intern", icon: "fa-user" };
                  }
                };
                const badge = getRoleBadge(u.role);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm ${badge.bg} ${badge.text}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm mb-0.5">{u.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1.5 w-max">
                        <i className="fa-solid fa-building text-slate-400"></i> {u.division}
                      </span>
                    </td>

                    {/* Kolom Pilihan Ganti Kasta */}
                    <td className="px-6 py-4 text-right">
                      {/* Jangan kasih opsi dropdown buat Developer, kecuali lu login sbg Developer */}
                      {(u.role === "developer" && !isDeveloper) ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-500 text-xs font-black rounded-xl border border-stone-200 opacity-70 cursor-not-allowed">
                           <i className="fa-solid fa-lock"></i> Protected
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          {/* Badge Status Saat Ini (Kiri) */}
                          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                            <i className={`fa-solid ${badge.icon}`}></i> {badge.label}
                          </div>

                          <i className="fa-solid fa-arrow-right-arrow-left text-slate-300 hidden sm:block mx-1"></i>

                          {/* Dropdown Ubah Kasta (Kanan) */}
                          <div className="relative">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2 text-xs font-bold text-slate-700 outline-none hover:border-amber-400 focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-sm transition-all"
                            >
                              <option value="intern">Jadi Intern</option>
                              <option value="admin">Jadi Admin</option>
                              <option value="superadmin">Jadi Superadmin</option>
                              {isDeveloper && <option value="developer">Jadi Developer</option>}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl text-slate-300 mx-auto mb-3">
                      <i className="fa-solid fa-user-slash"></i>
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">User tidak ditemukan.</h3>
                    <p className="text-xs text-slate-500 font-medium">Coba hapus filter atau cari dengan kata kunci lain.</p>
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