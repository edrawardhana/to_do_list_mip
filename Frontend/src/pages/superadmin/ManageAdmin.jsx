import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const ManageAdmin = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;

  const [users, setUsers] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => {} });
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
        role: u.role || "user",
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
    if (filterRole !== "semua") data = data.filter(u => filterRole === "user" ? (u.role === "user" || u.role === "intern") : u.role === filterRole);
    if (filterDivision !== "semua") data = data.filter(u => u.division === filterDivision);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(u => (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q) || (u.division||"").toLowerCase().includes(q));
    }
    return data;
  }, [users, filterRole, filterDivision, searchQuery]);

  const stats = useMemo(() => ({
    interns: users.filter(u => u.role === "user" || u.role === "intern").length,
    admins: users.filter(u => u.role === "admin").length,
    supers: users.filter(u => u.role === "super_admin").length,
    locked: users.filter(u => u.is_locked).length,
  }), [users]);

  const getRoleBadge = (role) => {
    if (isDeveloperTheme) {
      switch (role) {
        case "super_admin": return { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "fa-crown", label: "Super Admin" };
        case "admin":       return { cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",         icon: "fa-shield-halved", label: "Admin" };
        default:            return { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "fa-user-graduate", label: "Intern" };
      }
    }
    switch (role) {
      case "super_admin": return { cls: "bg-purple-100 text-purple-700 border-purple-200", icon: "fa-crown", label: "Super Admin" };
      case "admin":       return { cls: "bg-sky-100 text-sky-700 border-sky-200",         icon: "fa-shield-halved", label: "Admin" };
      default:            return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-user-graduate", label: "Intern" };
    }
  };

  const handleRoleChange = (id, name, currentRole, newRole) => {
    if (id === user?.id) { toast.error("Tidak bisa mengubah role akun sendiri."); return; }
    const h = { intern:1, user:1, admin:2, super_admin:3 };
    const action = h[newRole] > h[currentRole] ? "PROMOTE" : h[newRole] < h[currentRole] ? "DEMOTE" : "ubah";
    setModalState({ isOpen: true, type: "promote", title: "Ubah Role", message: `${action} ${name} → ${newRole.toUpperCase()}?`, actionText: "Ya, Ubah!",
      onConfirm: async () => { try { await api.put(`/profiles/${id}`, { role: newRole }); toast.success(`${name} → ${newRole.toUpperCase()}`); fetchData(); } catch { toast.error("Gagal mengubah role"); } }
    });
  };

  const handleToggleLock = (id, name, locked) => {
    setModalState({ isOpen: true, type: locked ? "unlock" : "lock", title: locked ? "Buka Akun" : "Kunci Akun", message: `${locked ? "Buka gembok" : "Kunci"} akun ${name}?`, actionText: locked ? "Ya, Buka" : "Ya, Kunci",
      onConfirm: async () => { try { await api.put(`/profiles/${id}`, { is_locked: !locked }); toast.success(`Akun ${name} ${locked ? "dibuka" : "dikunci"}`); fetchData(); } catch { toast.error("Gagal mengubah status gembok"); } }
    });
  };

  const handleDelete = (id, name) => {
    setModalState({ isOpen: true, type: "delete", title: "Hapus Permanen", message: `BAHAYA! Hapus permanen akun ${name}? Tidak dapat dibatalkan.`, actionText: "Ya, Hapus!",
      onConfirm: async () => { try { await api.delete(`/profiles/${id}`); toast.success(`Akun ${name} dihapus`); fetchData(); } catch { toast.error("Gagal menghapus akun"); } }
    });
  };

  const D = isDeveloperTheme;
  const inputCls = D ? "bg-[#18181b] border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-600" : "bg-[#1d1633] border-[#342459] text-white placeholder:text-purple-400/50 focus:ring-purple-400";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ── HERO ─────────────────────────────────────── */}
      <div className={`rounded-[2.5rem] border relative overflow-hidden flex flex-col shadow-2xl ${D ? "bg-[#09090b] border-zinc-800" : "bg-[#1d1633] border-[#342459] shadow-purple-900/20"}`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${D ? "bg-zinc-500/10" : "bg-purple-500/20"}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${D ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-purple-500/20 border-purple-400/30 text-purple-400"}`}>
                <i className="fa-solid fa-user-shield text-lg" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${D ? "text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800" : "text-purple-300"}`}>Access & Role Management</span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight ${D ? "text-zinc-100" : "text-white"}`}>Role Controller.</h1>
            <p className={`text-sm font-medium leading-relaxed max-w-md ${D ? "text-zinc-500" : "text-purple-200/70"}`}>
              Kelola akses, role, dan keamanan akun pengguna sistem secara terpusat.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${D ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-purple-500/20 border-purple-400/30 text-purple-200"}`}>
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                Roles Synced
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${D ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200"}`}>
                <i className="fa-solid fa-shield-halved" />{D ? "Dev Protocol" : "Superadmin Mode"}
              </div>
            </div>
          </div>

          {/* Stats mini */}
          <div className={`shrink-0 flex flex-col gap-3 p-5 rounded-3xl border ${D ? "bg-[#18181b] border-zinc-800" : "bg-white/5 border-white/10"}`}>
            {[
              { label: "Interns", val: stats.interns, icon: "fa-user-graduate", cls: D ? "text-emerald-400" : "text-emerald-300" },
              { label: "Admins",  val: stats.admins,  icon: "fa-shield-halved", cls: D ? "text-sky-400"     : "text-sky-300"     },
              { label: "Supers",  val: stats.supers,  icon: "fa-crown",         cls: D ? "text-purple-400"  : "text-purple-300"  },
              { label: "Locked",  val: stats.locked,  icon: "fa-lock",          cls: D ? "text-rose-400"    : "text-rose-300"    },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${s.icon} text-xs ${s.cls}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${D ? "text-zinc-500" : "text-white/50"}`}>{s.label}</span>
                </div>
                <span className={`text-lg font-black ${D ? "text-zinc-200" : "text-white"}`}>{loading ? "·" : s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className={`relative z-10 border-t px-5 sm:px-8 py-4 flex flex-col md:flex-row gap-3 items-center ${D ? "bg-[#09090b] border-zinc-800" : "bg-[#18112a] border-[#342459]"}`}>
          <div className="relative w-full md:w-80 group">
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm ${D ? "text-zinc-600 group-focus-within:text-zinc-400" : "text-purple-400/50 group-focus-within:text-purple-300"} transition-colors`} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama, email, atau divisi..."
              className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 border transition-all ${inputCls}`} />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {[
              { val: filterRole, onChange: setFilterRole, opts: [["semua","Semua Role"],["user","Intern/User"],["admin","Admin"],["super_admin","Super Admin"]] },
              { val: filterDivision, onChange: setFilterDivision, opts: [["semua","Semua Divisi"], ...divisionsList.map(d => [d, d])] },
            ].map((sel, i) => (
              <div key={i} className="relative flex-1 group">
                <select value={sel.val} onChange={e => sel.onChange(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 appearance-none cursor-pointer border transition-all ${inputCls}`}>
                  {sel.opts.map(([v, l]) => <option key={v} value={v} className="text-slate-800">{l}</option>)}
                </select>
                <i className={`fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${D ? "text-zinc-600" : "text-purple-400/50"}`} />
              </div>
            ))}
            {(searchQuery || filterRole !== "semua" || filterDivision !== "semua") && (
              <button onClick={() => { setSearchQuery(""); setFilterRole("semua"); setFilterDivision("semua"); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${D ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200" : "bg-white/10 border-white/20 text-white/70 hover:text-white"}`}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLE ────────────────────────────────────── */}
      <div className={`rounded-[2rem] border overflow-hidden shadow-sm ${D ? "bg-[#0f0f11] border-zinc-800" : "bg-white border-slate-200"}`}>
        {/* Table header bar */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${D ? "bg-[#18181b] border-zinc-800" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${D ? "bg-zinc-800 border border-zinc-700 text-zinc-400" : "bg-purple-600 text-white"}`}>
              <i className="fa-solid fa-users-gear text-xs" />
            </div>
            <h3 className={`font-black text-sm ${D ? "text-zinc-200" : "text-slate-800"}`}>Daftar Pengguna Sistem</h3>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${D ? "bg-zinc-900 border-zinc-800 text-zinc-600" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
            {loading ? "Memuat..." : `${filteredUsers.length} pengguna`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                  <tr key={u.id} className={`transition-colors ${D ? "hover:bg-zinc-800/30" : "hover:bg-slate-50/80"}`}>
                    {/* Identitas */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${badge.cls}`}>
                          {(u.name||"?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-black text-sm leading-tight ${D ? "text-zinc-200" : "text-slate-800"}`}>{u.name}</p>
                          <p className={`text-[10px] font-medium mt-0.5 ${D ? "text-zinc-600" : "text-slate-400"}`}>{u.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Divisi */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1.5 whitespace-nowrap ${D ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        <i className="fa-solid fa-building text-[9px]" /> {u.division}
                      </span>
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 whitespace-nowrap ${badge.cls}`}>
                        <i className={`fa-solid ${badge.icon}`} /> {badge.label}
                      </span>
                    </td>

                    {/* Status lock */}
                    <td className="px-6 py-4 text-center">
                      {u.is_locked ? (
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${D ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                          <i className="fa-solid fa-lock" /> Terkunci
                        </span>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${D ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          <i className="fa-solid fa-unlock" /> Aman
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 justify-end w-full">
                        {/* Lock/Unlock */}
                        <button onClick={() => handleToggleLock(u.id, u.name, u.is_locked)} title={u.is_locked ? "Buka Akun" : "Kunci Akun"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${u.is_locked
                            ? (D ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100")
                            : (D ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"   : "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100")}`}>
                          <i className={`fa-solid ${u.is_locked ? "fa-unlock" : "fa-lock"}`} />
                        </button>

                        {/* Role dropdown */}
                        <div className="relative shrink-0">
                          <select value={u.role} onChange={e => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                            className={`w-32 border rounded-xl pl-3 pr-7 py-2 text-[11px] font-bold outline-none appearance-none cursor-pointer transition-all ${D ? "bg-[#18181b] border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-slate-200 text-slate-700 hover:border-purple-400"}`}>
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

      <ConfirmModal {...modalState} onClose={closeModal} isDark={isDeveloperTheme} />
    </div>
  );
};

export default ManageAdmin;