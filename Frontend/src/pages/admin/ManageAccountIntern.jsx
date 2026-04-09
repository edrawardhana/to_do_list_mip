import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const ManageAccountIntern = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  
  // Tentukan kasta & batasan wilayah
  const canViewAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division_name || "IT Support";

  // ==========================================
  // DUMMY DATA ANAK MAGANG
  // ==========================================
  const [interns, setInterns] = useState([
    { id: "usr-001", name: "Kiel", email: "kiel@mcc.com", division: "IT Support", is_verified: true, is_locked: false, joinDate: "10 Jan 2026" },
    { id: "usr-002", name: "Nabil", email: "nabil@mcc.com", division: "IT Support", is_verified: false, is_locked: false, joinDate: "05 Apr 2026" },
    { id: "usr-003", name: "Edra", email: "edra@mcc.com", division: "Multimedia", is_verified: true, is_locked: false, joinDate: "15 Feb 2026" },
    { id: "usr-004", name: "Siti", email: "siti@mcc.com", division: "Public Relation", is_verified: true, is_locked: true, joinDate: "20 Mar 2026" },
    { id: "usr-005", name: "Budi", email: "budi@mcc.com", division: "Creative Design", is_verified: false, is_locked: false, joinDate: "04 Apr 2026" },
  ]);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState(canViewAll ? "Semua" : myDivision);

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
    if (window.confirm(`Yakin ingin memverifikasi akun ${name}?`)) {
      setInterns(prev => prev.map(intern => intern.id === id ? { ...intern, is_verified: true } : intern));
    }
  };

  const handleToggleLock = (id, name, currentStatus) => {
    const action = currentStatus ? "Membuka Gembok" : "Menggembok";
    if (window.confirm(`Yakin ingin ${action} akun ${name} secara individual?`)) {
      setInterns(prev => prev.map(intern => intern.id === id ? { ...intern, is_locked: !currentStatus } : intern));
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`BAHAYA! Yakin ingin menghapus permanen akun ${name}?`)) {
      setInterns(prev => prev.filter(intern => intern.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      {/* FILTER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama atau email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {canViewAll ? (
          <div className="relative w-full sm:w-auto">
            <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
              <option value="Semua">Semua Divisi</option>
              <option value="IT Support">IT Support</option>
              <option value="Multimedia">Multimedia</option>
              <option value="Public Relation">Public Relation</option>
              <option value="Creative Design">Creative Design</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          </div>
        ) : (
          <div className="w-full sm:w-auto bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-black text-blue-700 flex items-center gap-2 justify-center">
            <i className="fa-solid fa-building text-blue-400"></i> {myDivision}
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-5">Nama & Info</th>
                <th className="px-6 py-5">Status Verifikasi</th>
                <th className="px-6 py-5">Status Gembok</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                        {intern.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm mb-0.5">{intern.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 mb-0.5">{intern.email}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">{intern.division}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {intern.is_verified ? (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 w-max">
                        <i className="fa-solid fa-check-circle"></i> Terverifikasi
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 w-max animate-pulse">
                        <i className="fa-solid fa-clock"></i> Pending ACC
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {intern.is_locked ? (
                      <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1.5 w-max">
                        <i className="fa-solid fa-lock"></i> Terkunci
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5 w-max">
                        <i className="fa-solid fa-unlock"></i> Aman
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      
                      {!intern.is_verified && (
                        <button onClick={() => handleVerify(intern.id, intern.name)} className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20" title="ACC Akun Ini">
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}

                      {/* KHUSUS ADMIN DIVISI: Tombol Lock/Unlock individual */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleToggleLock(intern.id, intern.name, intern.is_locked)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border transition-colors ${
                            intern.is_locked ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                          }`}
                          title={intern.is_locked ? "Buka Gembok Individual" : "Kunci Akun Individual"}
                        >
                          <i className={`fa-solid ${intern.is_locked ? "fa-unlock" : "fa-lock"}`}></i>
                        </button>
                      )}

                      <button onClick={() => handleDelete(intern.id, intern.name)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Hapus Akun">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAccountIntern;