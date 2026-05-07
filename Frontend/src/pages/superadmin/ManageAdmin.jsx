import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const ManageAdmin = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (Hanya untuk Bawah)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;

  const [users, setUsers] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, divsRes] = await Promise.all([api.get("/profiles"), api.get("/divisions")]);
      const profilesData = usersRes.data?.data || usersRes.data || [];
      const divsData = divsRes.data?.data || divsRes.data || [];
      setUsers(profilesData.filter(u => u.role !== "developer").map(u => ({
        id: u.id,
        name: u.full_name || u.name || "Unknown",
        email: u.email || "",
        division: u.division?.name || u.division || "Unknown",
        role: u.role || "intern",
        is_locked: u.is_locked || false,
      })));
      if (divsData.length > 0) setDivisionsList(divsData.map(d => d.name));
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = useMemo(() => {
    let data = users;
    if (filterRole !== "semua") data = data.filter(u => filterRole === "intern" ? u.role === "intern" : u.role === filterRole);
    if (filterDivision !== "semua") data = data.filter(u => u.division === filterDivision);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.division || "").toLowerCase().includes(q));
    }
    return data;
  }, [users, filterRole, filterDivision, searchQuery]);

  const stats = useMemo(() => ({
    interns: users.filter(u => u.role === "intern").length,
    admins: users.filter(u => u.role === "admin").length,
    supers: users.filter(u => u.role === "super_admin").length,
    locked: users.filter(u => u.is_locked).length,
  }), [users]);

  const getRoleBadge = (role) => {
    if (isDeveloperTheme) {
      switch (role) {
        case "super_admin": return { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "fa-crown", label: "Super Admin" };
        case "admin": return { cls: "bg-sky-500/15 text-sky-400 border-sky-500/30", icon: "fa-shield-halved", label: "Admin" };
        default: return { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "fa-user-graduate", label: "Intern" };
      }
    }
    switch (role) {
      case "super_admin": return { cls: "bg-purple-100 text-purple-700 border-purple-200", icon: "fa-crown", label: "Super Admin" };
      case "admin": return { cls: "bg-sky-100 text-sky-700 border-sky-200", icon: "fa-shield-halved", label: "Admin" };
      default: return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-user-graduate", label: "Intern" };
    }
  };

  const handleRoleChange = (id, name, currentRole, newRole) => {
    if (id === user?.id) { toast.error("Tidak bisa mengubah role akun sendiri."); return; }
    const h = { intern: 1, admin: 2, super_admin: 3 };
    const action = h[newRole] > h[currentRole] ? "PROMOTE" : h[newRole] < h[currentRole] ? "DEMOTE" : "ubah";
    setModalState({
      isOpen: true, type: "promote", title: "Ubah Role", message: `${action} ${name} → ${newRole.toUpperCase()}?`, actionText: "Ya, Ubah!",
      onConfirm: async () => { try { await api.put(`/profiles/${id}`, { role: newRole }); toast.success(`${name} → ${newRole.toUpperCase()}`); fetchData(); } catch { toast.error("Gagal mengubah role"); } }
    });
  };

  const handleToggleLock = (id, name, locked) => {
    setModalState({
      isOpen: true, type: locked ? "unlock" : "lock", title: locked ? "Buka Akun" : "Kunci Akun", message: `${locked ? "Buka gembok" : "Kunci"} akun ${name}?`, actionText: locked ? "Ya, Buka" : "Ya, Kunci",
      onConfirm: async () => { try { await api.put(`/profiles/${id}`, { is_locked: !locked }); toast.success(`Akun ${name} ${locked ? "dibuka" : "dikunci"}`); fetchData(); } catch { toast.error("Gagal mengubah status gembok"); } }
    });
  };

  const handleDelete = (id, name) => {
    setModalState({
      isOpen: true, type: "delete", title: "Hapus Permanen", message: `BAHAYA! Hapus permanen akun ${name}? Tidak dapat dibatalkan.`, actionText: "Ya, Hapus!",
      onConfirm: async () => { try { await api.delete(`/profiles/${id}`); toast.success(`Akun ${name} dihapus`); fetchData(); } catch { toast.error("Gagal menghapus akun"); } }
    });
  };

  const D = isDeveloperTheme;

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ================================================================= */}
        {/* HERO SECTION (FORCE DARK THEME - DEVELOPER STYLE)                 */}
        {/* ================================================================= */}
        <div className="bg-[#09090b] rounded-[2.5rem] border border-[#27272a] shadow-2xl relative overflow-hidden flex flex-col text-white">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner shrink-0">
                  <i className="fa-solid fa-user-shield text-xl" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                  Access & Role Management
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
                Role Controller.
              </h1>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-md">
                Kelola akses, role, dan keamanan akun pengguna sistem secara terpusat.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Roles Synced
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-wider">
                  <i className="fa-solid fa-shield-halved" /> Security Protocol
                </div>
              </div>
            </div>

            {/* Stats mini */}
            <div className="w-full lg:w-80 shrink-0 bg-zinc-900/50 border border-zinc-800/60 rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-center gap-4">
              {[
                { label: "Interns", val: stats.interns, icon: "fa-user-graduate", cls: "text-emerald-400" },
                { label: "Admins", val: stats.admins, icon: "fa-shield-halved", cls: "text-sky-400" },
                { label: "Supers", val: stats.supers, icon: "fa-crown", cls: "text-purple-400" },
                { label: "Locked", val: stats.locked, icon: "fa-lock", cls: "text-rose-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 flex justify-center ${s.cls}`}><i className={`fa-solid ${s.icon} text-sm`} /></div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500">{s.label}</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white">{loading ? "·" : s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar Bawah */}
          <div className="relative z-10 p-5 sm:p-8 flex flex-col md:flex-row gap-3 items-center bg-zinc-900/30">
            <div className="relative w-full md:w-80 group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, atau divisi..."
                className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 border transition-all bg-[#18181b] border-zinc-800 focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {[
                { val: filterRole, onChange: setFilterRole, opts: [["semua", "Semua Role"], ["intern", "Intern"], ["admin", "Admin"], ["super_admin", "Super Admin"]] },
                { val: filterDivision, onChange: setFilterDivision, opts: [["semua", "Semua Divisi"], ...divisionsList.map(d => [d, d])] },
              ].map((sel, i) => (
                <div key={i} className="relative flex-1 group">
                  <select
                    value={sel.val}
                    onChange={e => sel.onChange(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 appearance-none cursor-pointer border transition-all bg-[#18181b] border-zinc-800 focus:border-zinc-600 text-zinc-300"
                  >
                    {sel.opts.map(([v, l]) => <option key={v} value={v} className="text-slate-800 bg-white">{l}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-zinc-600" />
                </div>
              ))}
              {(searchQuery || filterRole !== "semua" || filterDivision !== "semua") && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterRole("semua"); setFilterDivision("semua"); }}
                  className="px-5 py-3 rounded-xl text-xs font-black border transition-all bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 shadow-sm w-full sm:w-auto"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TABLE (Dinamis Sesuai Role Pengguna) ────────────────────────────────────── */}
        <div className={`rounded-[2rem] border overflow-hidden shadow-sm ${D ? "bg-[#0f0f11] border-zinc-800" : "bg-white border-slate-200"}`}>
          {/* Table header bar */}
          <div className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${D ? "bg-[#18181b] border-zinc-800" : "bg-slate-50 border-slate-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${D ? "bg-zinc-800 border border-zinc-700 text-zinc-400" : "bg-purple-600 text-white"}`}>
                <i className="fa-solid fa-users-gear text-xs" />
              </div>
              <h3 className={`font-black text-sm ${D ? "text-zinc-200" : "text-slate-800"}`}>Daftar Pengguna Sistem</h3>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border w-full sm:w-auto text-center ${D ? "bg-zinc-900 border-zinc-800 text-zinc-600" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
              {loading ? "Memuat..." : `${filteredUsers.length} pengguna`}
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className={`border-b text-[10px] uppercase font-black tracking-widest ${D ? "bg-[#18181b] border-zinc-800 text-zinc-600" : "bg-white border-slate-100 text-slate-400"}`}>
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Identitas</th>
                  <th className="px-6 py-4 whitespace-nowrap">Divisi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Role</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${D ? "divide-zinc-800/60" : "divide-slate-50"}`}>

                {/* Loading */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl shrink-0 ${D ? "bg-zinc-800" : "bg-slate-100"}`} /><div className="space-y-1.5"><div className={`h-3 w-28 rounded ${D ? "bg-zinc-800" : "bg-slate-100"}`} /><div className={`h-2 w-36 rounded ${D ? "bg-zinc-900" : "bg-slate-50"}`} /></div></div></td>
                    <td className="px-6 py-4"><div className={`h-7 w-24 rounded-lg ${D ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4"><div className={`h-7 w-20 rounded-lg ${D ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4 text-center"><div className={`h-7 w-16 rounded-lg mx-auto ${D ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                    <td className="px-6 py-4"><div className={`h-8 w-40 rounded-lg ml-auto ${D ? "bg-zinc-800" : "bg-slate-100"}`} /></td>
                  </tr>
                ))}

                {/* Rows */}
                {!loading && filteredUsers.map(u => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className={`transition-colors group ${D ? "hover:bg-zinc-800/30" : "hover:bg-slate-50/80"}`}>
                      {/* Identitas */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${badge.cls}`}>
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-black text-[13px] sm:text-sm leading-tight truncate max-w-[150px] sm:max-w-xs ${D ? "text-zinc-200" : "text-slate-800"}`}>{u.name}</p>
                            <p className={`text-[9px] sm:text-[10px] font-medium mt-0.5 truncate max-w-[150px] sm:max-w-xs ${D ? "text-zinc-600" : "text-slate-400"}`}>{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Divisi */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold border inline-flex items-center gap-1.5 whitespace-nowrap ${D ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          <i className="fa-solid fa-building text-[8px] sm:text-[9px]" /> {u.division}
                        </span>
                      </td>

                      {/* Role badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 whitespace-nowrap ${badge.cls}`}>
                          <i className={`fa-solid ${badge.icon}`} /> {badge.label}
                        </span>
                      </td>

                      {/* Status lock */}
                      <td className="px-6 py-4 text-center">
                        {u.is_locked ? (
                          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${D ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                            <i className="fa-solid fa-lock" /> Terkunci
                          </span>
                        ) : (
                          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${D ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                            <i className="fa-solid fa-unlock" /> Aman
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 justify-end w-full">
                          {/* Lock/Unlock */}
                          <button onClick={() => handleToggleLock(u.id, u.name, u.is_locked)} title={u.is_locked ? "Buka Akun" : "Kunci Akun"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${u.is_locked
                              ? (D ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100")
                              : (D ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/30" : "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100")}`}>
                            <i className={`fa-solid ${u.is_locked ? "fa-unlock" : "fa-lock"}`} />
                          </button>

                          {/* Role dropdown */}
                          <div className="relative shrink-0">
                            <select value={u.role} onChange={e => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                              className={`w-28 sm:w-32 border rounded-xl pl-2 sm:pl-3 pr-6 py-2 text-[10px] sm:text-[11px] font-bold outline-none appearance-none cursor-pointer transition-all ${D ? "bg-[#18181b] border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-slate-200 text-slate-700 hover:border-purple-400"}`}>
                              <option value="user">USER/INTERN</option>
                              <option value="admin">ADMIN</option>
                              <option value="super_admin">SUPER ADMIN</option>
                            </select>
                            <i className={`fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none ${D ? "text-zinc-600" : "text-slate-400"}`} />
                          </div>

                          {/* Delete */}
                          <button onClick={() => handleDelete(u.id, u.name)} title="Hapus Akun"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${D ? "bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500"}`}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state */}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className={`py-16 text-center ${D ? "bg-[#0f0f11]" : "bg-slate-50/50"}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border ${D ? "bg-zinc-900 border-zinc-800 text-zinc-700" : "bg-white border-slate-100 text-slate-300"}`}>
                        <i className="fa-solid fa-user-slash text-xl" />
                      </div>
                      <p className={`font-black mb-1 ${D ? "text-zinc-400" : "text-slate-700"}`}>Tidak ada pengguna.</p>
                      <p className={`text-xs font-medium ${D ? "text-zinc-700" : "text-slate-400"}`}>Coba ubah filter atau gunakan kata kunci lain.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SEMUA MODAL DI LUAR ANIMASI CONTAINER */}
      <ConfirmModal {...modalState} onClose={closeModal} isDark={isDeveloperTheme} />
    </>
  );
};

export default ManageAdmin;