import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const ManageAccountIntern = () => {
  const { user, isSuperAdmin } = useAuth();

  // Tentukan kasta & batasan wilayah
  const canViewAll = isSuperAdmin;
  const myDivision =
    user?.division?.name || user?.division_name || "IT Support";

  const [interns, setInterns] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState(
    canViewAll ? "Semua" : myDivision,
  );
  const [filterBatch, setFilterBatch] = useState("semua");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // New Credentials Popup State
  const [newCredentials, setNewCredentials] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    actionText: "Ya",
    onConfirm: () => {},
  });
  const closeModal = () => setModalState((s) => ({ ...s, isOpen: false }));

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const [res, divRes] = await Promise.all([
        api.get("/profiles"),
        canViewAll ? api.get("/divisions") : Promise.resolve({ data: [] }),
      ]);

      const data = res.data?.data || res.data || [];
      const internsData = data.filter((u) => u.role === "intern");

      const normalized = internsData.map((i) => ({
        ...i,
        name: i.name || i.full_name || "Unknown",
        division:
          i.division?.name ||
          i.division_name ||
          (typeof i.division === "string" ? i.division : "Unknown"),
        batch: i.internship_batch || "-",
      }));
      setInterns(normalized);

      if (canViewAll) {
        const divsData = divRes.data?.data || divRes.data || [];
        setDivisions(divsData.map((d) => d.name));
      }

      const uniqueBatches = [
        ...new Set(
          normalized.map((u) => u.batch).filter((b) => b && b !== "-"),
        ),
      ];
      setBatchesList(uniqueBatches.sort());
    } catch (error) {
      toast.error("Gagal memuat data akun.");
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  // ── FILTER LOGIC ──────────────────────────────────────────────────────────
  const filteredInterns = useMemo(() => {
    let data = interns;

    if (!canViewAll) data = data.filter((i) => i.division === myDivision);
    else if (filterDivision !== "Semua")
      data = data.filter((i) => i.division === filterDivision);

    if (filterBatch !== "semua")
      data = data.filter((i) => i.batch === filterBatch);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (i) =>
          i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q),
      );
    }

    return data;
  }, [
    interns,
    canViewAll,
    myDivision,
    filterDivision,
    filterBatch,
    searchQuery,
  ]);

  const stats = useMemo(() => {
    const pending = filteredInterns.filter((i) => !i.is_verified).length;
    const locked = filteredInterns.filter((i) => i.is_locked).length;
    return { total: filteredInterns.length, pending, locked };
  }, [filteredInterns]);

  const pendingInterns = useMemo(
    () => filteredInterns.filter((i) => !i.is_verified),
    [filteredInterns],
  );
  const verifiedInterns = useMemo(
    () => filteredInterns.filter((i) => i.is_verified),
    [filteredInterns],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDivision, filterBatch]);

  const paginatedInterns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return verifiedInterns.slice(startIndex, startIndex + itemsPerPage);
  }, [verifiedInterns, currentPage]);

  const totalPages = Math.ceil(verifiedInterns.length / itemsPerPage);

  // ── SELECTION ─────────────────────────────────────────────────────────────
  const handleToggleSelectAll = (list) => {
    const listIds = list.map((u) => u.id);
    const allSelected = listIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !listIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...listIds]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const handleVerify = (id, name) => {
    setModalState({
      isOpen: true,
      type: "promote",
      title: "Verifikasi Akun",
      message: `Yakin ingin memverifikasi akun ${name}?`,
      actionText: "Ya, Verifikasi",
      onConfirm: async () => {
        try {
          await api.put(`/profiles/${id}`, { is_verified: true });
          toast.success(`Akun ${name} telah terverifikasi`);
          fetchInterns();
        } catch {
          toast.error("Gagal memverifikasi akun");
        }
      },
    });
  };

  const handleToggleLock = (id, name, currentStatus) => {
    const action = currentStatus ? "Membuka Gembok" : "Menggembok";
    setModalState({
      isOpen: true,
      type: currentStatus ? "unlock" : "lock",
      title: `${action} Akun`,
      message: `Yakin ingin ${action} akun ${name}?`,
      actionText: currentStatus ? "Ya, Buka" : "Ya, Kunci",
      onConfirm: async () => {
        try {
          await api.put(`/profiles/${id}`, { is_locked: !currentStatus });
          toast.success(`Berhasil ${action} akun ${name}`);
          fetchInterns();
        } catch {
          toast.error("Gagal mengubah status gembok");
        }
      },
    });
  };

  const handleResetPassword = (id, name, username, email, role) => {
    setModalState({
      isOpen: true,
      type: "reset",
      title: "Reset Password",
      message: `Reset password untuk ${name}? Password baru sementara akan digenerate otomatis.`,
      actionText: "Ya, Reset!",
      onConfirm: async () => {
        try {
          const res = await api.post(`/profiles/${id}/reset-password`);
          const tempPassword = res.data.temporary_password;

          setNewCredentials([
            {
              full_name: name,
              username: username,
              email: email,
              password: tempPassword,
              role: role,
            },
          ]);

          toast.success(`Password untuk ${name} berhasil direset!`);
        } catch (err) {
          toast.error(err.response?.data?.message || "Gagal mereset password.");
        }
      },
    });
  };

  const handleDelete = (id, name, isVerified = true) => {
    const isReject = !isVerified;
    setModalState({
      isOpen: true,
      type: "delete",
      title: isReject ? "Tolak Pendaftaran" : "Hapus Permanen",
      message: isReject
        ? `Tolak pendaftaran ${name}?`
        : `Hapus permanen akun ${name}?`,
      actionText: isReject ? "Ya, Tolak" : "Ya, Hapus!",
      onConfirm: async () => {
        try {
          await api.delete(`/profiles/${id}`);
          toast.success(
            isReject ? `Pendaftaran ${name} ditolak` : `Akun ${name} dihapus`,
          );
          fetchInterns();
        } catch (error) {
          toast.error(error.response?.data?.message || "Gagal menghapus akun");
        }
      },
    });
  };

  const handleBulkResetPassword = () => {
    setModalState({
      isOpen: true,
      type: "reset",
      title: "Reset Massal",
      message: `Reset password untuk ${selectedIds.length} akun terpilih? Password baru sementara akan digenerate otomatis.`,
      actionText: "Ya, Reset!",
      onConfirm: async () => {
        try {
          const res = await api.post(`/profiles/bulk-reset-password`, {
            ids: selectedIds,
          });
          const resets = res.data.data?.resets || [];

          setNewCredentials(resets);
          setSelectedIds([]);

          toast.success(`${resets.length} password berhasil direset!`);
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Gagal melakukan reset massal.",
          );
        }
      },
    });
  };

  // BULK ACTIONS
  const handleBulkLock = (lockStatus) => {
    setModalState({
      isOpen: true,
      type: lockStatus ? "lock" : "unlock",
      title: lockStatus ? "Kunci Massal" : "Buka Massal",
      message: `Terapkan status ${lockStatus ? "KUNCI" : "BUKA"} pada ${selectedIds.length} akun terpilih?`,
      actionText: "Ya, Terapkan",
      onConfirm: async () => {
        try {
          await api.post(`/profiles/bulk-lock`, {
            ids: selectedIds,
            is_locked: lockStatus,
          });
          toast.success(`Berhasil memperbarui ${selectedIds.length} akun.`);
          fetchInterns();
        } catch {
          toast.error("Gagal menerapkan aksi massal.");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Hapus Massal (BAHAYA)",
      message: `Hapus PERMANEN ${selectedIds.length} akun terpilih? Tindakan ini tidak bisa dibatalkan!`,
      actionText: "YA, HAPUS PERMANEN",
      onConfirm: async () => {
        try {
          await api.post(`/profiles/bulk-destroy`, { ids: selectedIds });
          toast.success(`${selectedIds.length} akun berhasil dihapus.`);
          fetchInterns();
        } catch {
          toast.error("Gagal menghapus akun massal.");
        }
      },
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION & FILTER (TEMA DINAMIS: PINK & DEEP BLUE)            */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 ${
        isSuperAdmin 
          ? "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-300 shadow-pink-200/50" 
          : "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20 shadow-2xl"
      }`}>
        
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isSuperAdmin ? "bg-white/40" : "bg-blue-500/20"}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${isSuperAdmin ? "bg-rose-100/30" : "bg-sky-500/10"}`} />

        {/* Content Top */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-white/10">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm ${
                isSuperAdmin ? "bg-white/20 border-white/40 text-white" : "bg-white/10 border-white/20 text-white"
              }`}>
                <i className="fa-solid fa-users-gear text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border ${
                isSuperAdmin ? "text-pink-50 bg-white/20 border-pink-200" : "text-blue-200 bg-white/10 border-white/10"
              }`}>
                Manage Intern
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              Kelola Akun Intern.
            </h1>
            <p className={`text-sm font-medium leading-relaxed ${isSuperAdmin ? "text-pink-50" : "text-blue-100/70"}`}>
              Verifikasi dan kelola batch intern divisi {canViewAll ? "seluruh perusahaan" : myDivision}.
            </p>
          </div>

          {/* Widget Kanan (Stats) */}
          <div className="flex gap-3 sm:gap-4 shrink-0 mt-4 lg:mt-0">
            <div className={`border rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-center items-center gap-1 shadow-lg min-w-[120px] ${
              isSuperAdmin ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"
            }`}>
              <p className="text-3xl font-black text-white leading-none">{stats.pending}</p>
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-2">
                Pending ACC
              </p>
            </div>
            <div className={`border rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-center items-center gap-1 shadow-lg min-w-[120px] ${
              isSuperAdmin ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"
            }`}>
              <p className="text-3xl font-black text-white leading-none">{verifiedInterns.length}</p>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-2">
                Aktif
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar (Menyatu dengan Hero) */}
        <div className="p-6 sm:p-8 relative z-10 bg-black/10">
          <div className="flex flex-col md:flex-row gap-4 items-center w-full">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0 group">
              <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${
                isSuperAdmin ? "text-pink-200 group-focus-within:text-white" : "text-blue-300/50 group-focus-within:text-blue-200"
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama intern..."
                className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none border transition-all backdrop-blur-sm text-white focus:ring-2 ${
                  isSuperAdmin 
                    ? "bg-white/10 border-white/30 placeholder:text-pink-200/70 focus:border-white focus:ring-pink-400/50" 
                    : "bg-white/5 border-white/10 placeholder:text-blue-300/50 focus:border-white/30 focus:ring-blue-400/50"
                }`}
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {canViewAll && (
                <div className="relative flex-1 group">
                  <select
                    value={filterDivision}
                    onChange={(e) => setFilterDivision(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none cursor-pointer border transition-all backdrop-blur-sm text-white ${
                      isSuperAdmin 
                        ? "bg-white/10 border-white/30 hover:bg-white/20 focus:ring-2 focus:ring-pink-400/50" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-blue-400/50"
                    }`}
                  >
                    <option value="Semua" className="text-slate-800">Semua Divisi</option>
                    {divisions.map((d) => (
                      <option key={d} value={d} className="text-slate-800 bg-white">
                        {d}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-white/50" />
                </div>
              )}
              
              <div className="relative flex-1 group">
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none cursor-pointer border transition-all backdrop-blur-sm text-white ${
                    isSuperAdmin 
                      ? "bg-white/10 border-white/30 hover:bg-white/20 focus:ring-2 focus:ring-pink-400/50" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-blue-400/50"
                  }`}
                >
                  <option value="semua" className="text-slate-800 bg-white">Semua Batch</option>
                  {batchesList.map((b) => (
                    <option key={b} value={b} className="text-slate-800 bg-white">
                      {b}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-white/50" />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* VERIFIKASI PENDING */}
      {pendingInterns.length > 0 && (
        <div className="bg-amber-50/50 rounded-[2rem] border border-amber-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-amber-200 bg-amber-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-amber-800 flex items-center gap-2">
              <i className="fa-solid fa-user-clock" /> Butuh Verifikasi
            </h3>
            <span className="text-xs font-bold text-amber-600 bg-white px-2 py-1 rounded-md shadow-sm">
              {pendingInterns.length} Akun
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingInterns.map((intern) => (
              <div
                key={intern.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-black text-sm flex items-center justify-center border border-amber-200 shrink-0">
                      {(intern.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-tight truncate w-32">
                        {intern.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate w-32">
                        {intern.email}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(intern.id)}
                    onChange={() => handleToggleSelect(intern.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 truncate">
                    <i className="fa-solid fa-building mr-1" />{" "}
                    {intern.division}
                  </span>
                  {intern.batch !== "-" && (
                    <span className="px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-bold text-blue-600 truncate">
                      BATCH {intern.batch}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(intern.id, intern.name)}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex justify-center items-center gap-1.5"
                  >
                    <i className="fa-solid fa-check" /> ACC
                  </button>
                  <button
                    onClick={() => handleDelete(intern.id, intern.name, false)}
                    className="w-10 h-10 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl flex justify-center items-center transition-colors shrink-0"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE DAFTAR INTERN AKTIF */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-users-viewfinder text-xs" />
            </div>
            <h3 className="font-black text-sm text-slate-800">
              Daftar Intern Aktif
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-400">
            {verifiedInterns.length} Total
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={() => handleToggleSelectAll(verifiedInterns)}
                    checked={
                      verifiedInterns.length > 0 &&
                      verifiedInterns.every((i) => selectedIds.includes(i.id))
                    }
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Identitas</th>
                <th className="px-6 py-4">Divisi & Batch</th>
                <th className="px-6 py-4 text-center">Status Keamanan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-16 text-center text-slate-400 font-bold animate-pulse"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : verifiedInterns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <i className="fa-solid fa-ghost text-4xl mb-3 block text-slate-200" />
                    <p className="font-bold text-sm">
                      Belum ada anak intern aktif.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedInterns.map((i) => {
                  const isSelected = selectedIds.includes(i.id);
                  return (
                    <tr
                      key={i.id}
                      className={`transition-colors hover:bg-slate-50/80 ${isSelected ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(i.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-black text-xs shrink-0">
                            {(i.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-[13px] text-slate-800">
                              {i.name}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                              {i.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="px-3 py-1 rounded-lg text-[9px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                            <i className="fa-solid fa-building mr-1" />{" "}
                            {i.division}
                          </span>
                          {i.batch !== "-" && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                              BATCH: {i.batch}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {i.is_locked ? (
                          <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border-rose-100">
                            <i className="fa-solid fa-lock" /> Terkunci
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-100">
                            <i className="fa-solid fa-shield-check" /> Aman
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleToggleLock(i.id, i.name, i.is_locked)
                            }
                            title={i.is_locked ? "Buka Gembok" : "Gembok Akun"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${i.is_locked ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"}`}
                          >
                            <i
                              className={`fa-solid ${i.is_locked ? "fa-unlock" : "fa-lock"}`}
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleResetPassword(
                                i.id,
                                i.name,
                                i.username,
                                i.email,
                                i.role,
                              )
                            }
                            title="Reset Password"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-500 border-slate-200 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-colors text-xs shrink-0"
                          >
                            <i className="fa-solid fa-key" />
                          </button>
                          <button
                            onClick={() => handleDelete(i.id, i.name, true)}
                            title="Pecat / Hapus Permanen"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors text-xs shrink-0"
                          >
                            <i className="fa-solid fa-user-xmark" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-slate-500">
              Menampilkan{" "}
              <span className="font-black text-slate-700">
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  verifiedInterns.length,
                )}
              </span>{" "}
              -{" "}
              <span className="font-black text-slate-700">
                {Math.min(currentPage * itemsPerPage, verifiedInterns.length)}
              </span>{" "}
              dari{" "}
              <span className="font-black text-slate-700">
                {verifiedInterns.length}
              </span>{" "}
              intern
            </span>
            <div className="flex items-center gap-1.5 font-sans">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-xs bg-white border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${
                      currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-xs bg-white border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION PANEL (Bulk Actions) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-max z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6 backdrop-blur-lg">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-black text-xs">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold text-slate-200">
                Akun Terpilih
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleBulkLock(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors"
              >
                <i className="fa-solid fa-unlock mr-2" /> Buka
              </button>
              <button
                onClick={() => handleBulkLock(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors"
              >
                <i className="fa-solid fa-lock mr-2" /> Kunci
              </button>
              <button
                onClick={handleBulkResetPassword}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-purple-500/20 hover:text-purple-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors"
              >
                <i className="fa-solid fa-key mr-2" /> Reset
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 text-xs font-black uppercase tracking-widest transition-colors ml-2"
              >
                <i className="fa-solid fa-trash mr-2" /> Hapus
              </button>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 text-slate-300 rounded-full border-4 border-slate-900 flex items-center justify-center hover:bg-slate-600 transition-colors shadow-lg text-xs"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CREDENTIALS CARD */}
      {newCredentials.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 md:p-8 bg-emerald-500 border-b border-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-circle-check" /> Password Berhasil
                  Direset
                </h3>
                <p className="text-sm font-medium text-emerald-100">
                  Simpan kredensial ini segera. Password tidak akan ditampilkan
                  lagi.
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              <div className="space-y-4">
                {newCredentials.map((c, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800">{c.full_name}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {c.email} •{" "}
                        <span className="font-bold text-purple-600">
                          @{c.username}
                        </span>{" "}
                        •{" "}
                        <span className="uppercase text-slate-400">
                          {c.role}
                        </span>
                      </p>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-center shrink-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Password Sementara
                      </p>
                      <p className="font-mono text-sm font-bold text-slate-800">
                        {c.password}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const text = newCredentials
                    .map(
                      (c) =>
                        `Nama: ${c.full_name}\nUsername: ${c.username}\nEmail: ${c.email}\nPassword: ${c.password}\nRole: ${c.role}\n---`,
                    )
                    .join("\n");
                  navigator.clipboard.writeText(text);
                  toast.success("Kredensial disalin ke clipboard!");
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors border border-slate-200"
              >
                <i className="fa-solid fa-copy mr-1" /> Copy Text
              </button>
              <button
                onClick={() => setNewCredentials([])}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...modalState} onClose={closeModal} />
    </div>
  );
};

export default ManageAccountIntern;
