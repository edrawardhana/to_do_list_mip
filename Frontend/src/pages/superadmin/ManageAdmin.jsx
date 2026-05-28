import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const ManageAdmin = () => {
  const { user, isSuperAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterDivision, setFilterDivision] = useState("semua");
  const [filterBatch, setFilterBatch] = useState("semua");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState("manual"); // 'manual' or 'csv'
  
  // Form State
  const [manualForm, setManualForm] = useState({ full_name: "", username: "", email: "", division_id: "", role: "intern", internship_batch: "" });
  const [csvFile, setCsvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credentials Result
  const [newCredentials, setNewCredentials] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Kunci Scroll Layar saat Modal Terbuka
  useEffect(() => {
    if (modalState.isOpen || isAddModalOpen || newCredentials.length > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [modalState.isOpen, isAddModalOpen, newCredentials.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, divsRes] = await Promise.all([api.get("/profiles"), api.get("/divisions")]);
      const profilesData = usersRes.data?.data || usersRes.data || [];
      const divsData = divsRes.data?.data || divsRes.data || [];
      
      const mappedUsers = profilesData.filter(u => u.role !== "developer").map(u => ({
        id: u.id,
        name: u.full_name || u.name || "Unknown",
        email: u.email || "",
        division: u.division?.name || u.division || "Unknown",
        division_id: u.division_id || u.division?.id,
        role: u.role || "intern",
        is_locked: u.is_locked || false,
        batch: u.internship_batch || "-",
      }));
      setUsers(mappedUsers);
      
      if (divsData.length > 0) {
        setDivisionsList(divsData);
        if(!manualForm.division_id) setManualForm(prev => ({...prev, division_id: divsData[0].id}));
      }

      const uniqueBatches = [...new Set(mappedUsers.map(u => u.batch).filter(b => b && b !== "-"))];
      setBatchesList(uniqueBatches.sort());

    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  const filteredUsers = useMemo(() => {
    let data = users;
    if (filterRole !== "semua") data = data.filter(u => filterRole === "intern" ? u.role === "intern" : u.role === filterRole);
    if (filterDivision !== "semua") data = data.filter(u => u.division === filterDivision);
    if (filterBatch !== "semua") data = data.filter(u => u.batch === filterBatch);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.division || "").toLowerCase().includes(q));
    }
    return data;
  }, [users, filterRole, filterDivision, filterBatch, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterDivision, filterBatch]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const stats = useMemo(() => ({
    interns: users.filter(u => u.role === "intern").length,
    admins: users.filter(u => u.role === "admin").length,
    supers: users.filter(u => u.role === "super_admin").length,
    locked: users.filter(u => u.is_locked).length,
  }), [users]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin": return { cls: "bg-pink-100 text-pink-700 border-pink-200", icon: "fa-crown", label: "Super Admin" };
      case "admin": return { cls: "bg-sky-100 text-sky-700 border-sky-200", icon: "fa-shield-halved", label: "Admin" };
      default: return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-user-graduate", label: "Intern" };
    }
  };

  // ── SELECTION LOGIC ────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(u => u.id !== user?.id);
    if (selectedIds.length === selectableUsers.length) setSelectedIds([]);
    else setSelectedIds(selectableUsers.map(u => u.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── SINGLE ACTIONS ─────────────────────────────────────────────────────────
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

  const handleResetPassword = (id, name, username, email, role) => {
    setModalState({
      isOpen: true, type: "reset", title: "Reset Password", message: `Reset password untuk ${name}? Password baru sementara akan digenerate otomatis.`, actionText: "Ya, Reset!",
      onConfirm: async () => {
        try {
          const res = await api.post(`/profiles/${id}/reset-password`);
          const tempPassword = res.data.temporary_password;
          
          setNewCredentials([{
            full_name: name,
            username: username,
            email: email,
            password: tempPassword,
            role: role
          }]);
          
          toast.success(`Password untuk ${name} berhasil direset!`);
        } catch (err) {
          toast.error(err.response?.data?.message || "Gagal mereset password.");
        }
      }
    });
  };

  const handleDelete = (id, name) => {
    setModalState({
      isOpen: true, type: "delete", title: "Hapus Permanen", message: `BAHAYA! Hapus permanen akun ${name}? Tidak dapat dibatalkan.`, actionText: "Ya, Hapus!",
      onConfirm: async () => { try { await api.delete(`/profiles/${id}`); toast.success(`Akun ${name} dihapus`); fetchData(); } catch { toast.error("Gagal menghapus akun"); } }
    });
  };

  // ── BULK ACTIONS ───────────────────────────────────────────────────────────
  const handleBulkLock = (lockStatus) => {
    setModalState({
      isOpen: true, type: lockStatus ? "lock" : "unlock", title: lockStatus ? "Kunci Massal" : "Buka Massal", 
      message: `Terapkan status ${lockStatus ? "KUNCI" : "BUKA"} pada ${selectedIds.length} akun terpilih?`, actionText: "Ya, Terapkan",
      onConfirm: async () => {
        try {
          await api.post(`/profiles/bulk-lock`, { ids: selectedIds, is_locked: lockStatus });
          toast.success(`Berhasil memperbarui ${selectedIds.length} akun.`);
          fetchData();
        } catch { toast.error("Gagal menerapkan aksi massal."); }
      }
    });
  };

  const handleBulkDelete = () => {
    setModalState({
      isOpen: true, type: "delete", title: "Hapus Massal (BAHAYA)", 
      message: `Hapus PERMANEN ${selectedIds.length} akun terpilih? Tindakan ini tidak bisa dibatalkan!`, actionText: "YA, HAPUS PERMANEN",
      onConfirm: async () => {
        try {
          await api.post(`/profiles/bulk-destroy`, { ids: selectedIds });
          toast.success(`${selectedIds.length} akun berhasil dihapus.`);
          fetchData();
        } catch { toast.error("Gagal menghapus akun massal."); }
      }
    });
  };

  const handleBulkResetPassword = () => {
    setModalState({
      isOpen: true, type: "reset", title: "Reset Massal", 
      message: `Reset password untuk ${selectedIds.length} akun terpilih? Password baru sementara akan digenerate otomatis.`, actionText: "Ya, Reset!",
      onConfirm: async () => {
        try {
          const res = await api.post(`/profiles/bulk-reset-password`, { ids: selectedIds });
          const resets = res.data.data?.resets || [];
          
          setNewCredentials(resets);
          setSelectedIds([]);
          
          toast.success(`${resets.length} password berhasil direset!`);
        } catch (err) {
          toast.error(err.response?.data?.message || "Gagal melakukan reset massal.");
        }
      }
    });
  };

  // ── CREATE / IMPORT ACTIONS ────────────────────────────────────────────────
  const submitManual = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/profiles/store-manual', manualForm);
      const createdProfile = res.data.data?.profile || {};
      const plainPassword = res.data.data?.plain_password || "";
      setNewCredentials([{ 
        full_name: createdProfile.full_name, 
        username: createdProfile.username,
        email: createdProfile.email, 
        password: plainPassword, 
        role: createdProfile.role 
      }]);
      setIsAddModalOpen(false);
      setManualForm({ full_name: "", username: "", email: "", division_id: divisionsList[0]?.id || "", role: "intern", internship_batch: "" });
      fetchData();
      toast.success("Akun berhasil dibuat!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat akun.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) return toast.error("Pilih file terlebih dahulu.");
    setIsSubmitting(true);
    
    try {
      let finalFile = csvFile;

      // Jika file adalah Excel, konversi ke CSV secara murni di frontend!
      if (csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls')) {
        const data = await csvFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Konversi sheet pertama menjadi string CSV murni
        const csvString = XLSX.utils.sheet_to_csv(worksheet);
        
        // Ubah string CSV kembali menjadi Blob File untuk dikirim ke backend
        finalFile = new File([csvString], "converted_excel.csv", { type: "text/csv" });
      }

      const formData = new FormData();
      formData.append('csv_file', finalFile);
      
      const res = await api.post('/profiles/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imported = res.data.data?.created || [];
      const mappedCreds = imported.map(u => ({
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        password: u.password,
        role: u.role
      }));
      setNewCredentials(mappedCreds);
      setIsAddModalOpen(false);
      setCsvFile(null);
      fetchData();
      
      if (res.data.data?.errors?.length > 0) {
        toast.success(`${mappedCreds.length} akun berhasil diimpor. Ada beberapa error, cek console.`);
        console.warn("Import errors:", res.data.data.errors);
      } else {
        toast.success(`${mappedCreds.length} akun berhasil diimpor!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengimpor file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadExcelTemplate = (e) => {
    e.preventDefault();
    try {
      const headers = ['full_name', 'email', 'username', 'division_name', 'role', 'internship_batch'];
      const exampleRows = [
        ['Budi Santoso', 'budi@mip.co.id', 'budisan', 'IT Support', 'intern', 'Batch 1 2026'],
        ['Siti Aminah', 'siti@mip.co.id', 'sitiamin', 'Marketing', 'admin', ''],
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
      
      // Mengatur lebar kolom agar rapi
      worksheet['!cols'] = [
        { wch: 20 }, // full_name
        { wch: 25 }, // email
        { wch: 15 }, // username
        { wch: 25 }, // division_name
        { wch: 10 }, // role
        { wch: 20 }, // internship_batch
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Users");
      
      // Generate buffer murni
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Buat Blob
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'format_import_users.xlsx'; // DIJAMIN NAMA FILE BENAR!
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Template Excel berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal mengunduh template Excel.');
      console.error('Download template error:', err);
    }
  };

  const downloadCredentialsCsv = () => {
    if (newCredentials.length === 0) return;
    const csv = Papa.unparse(newCredentials);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Generate descriptive filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `user_credentials_${timestamp}.csv`;
    
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Kredensial berhasil diunduh!");
  };

  const copyCredentials = () => {
    const text = newCredentials.map(c => `Nama: ${c.full_name}\nUsername: ${c.username}\nEmail: ${c.email}\nPassword: ${c.password}\nRole: ${c.role}\n---`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Kredensial disalin ke clipboard!");
  };

  // Proteksi Akses: Jika bukan Superadmin, tolak akses
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-rose-50 text-rose-500 font-black text-xl sm:text-2xl px-4 text-center rounded-[2rem] border border-rose-200 shadow-sm mx-4 sm:mx-8">
        <div>
          <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 animate-bounce"></i>
          <p>ACCESS DENIED. VVIP / SUPERADMIN ONLY.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ================================================================= */}
        {/* HERO SECTION - PINK PASTEL VVIP THEME                             */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-br from-pink-300 to-rose-400 rounded-[2.5rem] border border-pink-200 shadow-xl relative overflow-hidden flex flex-col text-white">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/40 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-rose-100/30 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8 border-b border-white/20">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner shrink-0 backdrop-blur-sm">
                  <i className="fa-solid fa-user-shield text-xl text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-50 bg-white/20 px-3 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm">
                  Access & Role Management
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight drop-shadow-sm">
                User Center.
              </h1>
              <p className="text-sm font-medium text-pink-50 leading-relaxed max-w-md">
                Kelola akun pengguna, batch intern, hak akses, dan lakukan impor massal.
              </p>
              
              <button onClick={() => setIsAddModalOpen(true)} className="mt-6 px-6 py-3.5 bg-white text-pink-600 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-pink-50 hover:scale-105 transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2 w-max">
                <i className="fa-solid fa-user-plus" /> Tambah Pengguna
              </button>
            </div>

            {/* Stats Widget */}
            <div className="w-full lg:w-80 shrink-0 bg-white/10 border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-center gap-4 shadow-lg">
              {[
                { label: "Interns", val: stats.interns, icon: "fa-user-graduate", cls: "text-emerald-100" },
                { label: "Admins", val: stats.admins, icon: "fa-shield-halved", cls: "text-sky-100" },
                { label: "Supers", val: stats.supers, icon: "fa-crown", cls: "text-amber-200" },
                { label: "Locked", val: stats.locked, icon: "fa-lock", cls: "text-rose-100" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-8 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 flex justify-center ${s.cls}`}><i className={`fa-solid ${s.icon} text-sm`} /></div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-pink-50 drop-shadow-sm">{s.label}</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white drop-shadow-sm">{loading ? "·" : s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar Bawah */}
          <div className="relative z-10 p-5 sm:p-8 flex flex-col md:flex-row gap-3 items-center bg-black/5 backdrop-blur-sm">
            <div className="relative w-full md:w-64 group shrink-0">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-pink-200 group-focus-within:text-white transition-colors" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari..."
                className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none border transition-all bg-white/10 border-white/20 focus:border-white focus:ring-2 focus:ring-white/30 text-white placeholder:text-pink-100"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {[
                { val: filterRole, onChange: setFilterRole, opts: [["semua", "Semua Role"], ["intern", "Intern"], ["admin", "Admin"], ["super_admin", "Super Admin"]] },
                { val: filterDivision, onChange: setFilterDivision, opts: [["semua", "Semua Divisi"], ...divisionsList.map(d => [d.name, d.name])] },
                { val: filterBatch, onChange: setFilterBatch, opts: [["semua", "Semua Batch"], ...batchesList.map(b => [b, b])] },
              ].map((sel, i) => (
                <div key={i} className="relative flex-1 group">
                  <select value={sel.val} onChange={e => sel.onChange(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none cursor-pointer border transition-all bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-white/30">
                    {sel.opts.map(([v, l]) => <option key={v} value={v} className="text-slate-800 bg-white">{l}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-pink-200" />
                </div>
              ))}
              {(searchQuery || filterRole !== "semua" || filterDivision !== "semua" || filterBatch !== "semua") && (
                <button onClick={() => { setSearchQuery(""); setFilterRole("semua"); setFilterDivision("semua"); setFilterBatch("semua"); }}
                  className="px-5 py-3 rounded-xl text-xs font-black border transition-all bg-white/20 border-white/30 text-white hover:bg-white hover:text-pink-500 shrink-0 shadow-sm">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TABLE SECTION (LIGHT MODE W/ PINK ACCENTS)                        */}
        {/* ================================================================= */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 border border-pink-200 shadow-sm">
                <i className="fa-solid fa-users-gear text-xs" />
              </div>
              <h3 className="font-black text-sm text-slate-800">Daftar Pengguna Sistem</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-400 shadow-sm">
              {loading ? "Memuat..." : `${filteredUsers.length} pengguna`}
            </span>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4 w-10 text-center">
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredUsers.filter(u => u.id !== user?.id).length && selectedIds.length > 0} 
                      className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-slate-300 cursor-pointer" />
                  </th>
                  <th className="px-6 py-4">Identitas</th>
                  <th className="px-6 py-4">Divisi & Batch</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="6" className="py-16 text-center text-slate-400 font-bold animate-pulse">Memuat data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="py-16 text-center text-slate-400 font-bold">Tidak ada pengguna ditemukan.</td></tr>
                ) : (
                  paginatedUsers.map(u => {
                    const badge = getRoleBadge(u.role);
                    const isSelected = selectedIds.includes(u.id);
                    return (
                      <tr key={u.id} className={`transition-colors group hover:bg-slate-50/80 ${isSelected ? 'bg-pink-50/50' : ''}`}>
                        <td className="px-6 py-4 text-center">
                          {u.id !== user?.id ? (
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(u.id)}
                              className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-slate-300 cursor-pointer" />
                          ) : (
                            <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-md border border-pink-200">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border shadow-sm ${badge.cls}`}>
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[13px] sm:text-sm text-slate-800 leading-tight truncate">{u.name}</p>
                              <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 truncate">{u.email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="px-3 py-1 rounded-lg text-[9px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                              <i className="fa-solid fa-building text-slate-400 mr-1" /> {u.division}
                            </span>
                            {u.batch !== "-" && (
                              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-pink-50 text-pink-600 border border-pink-100">
                                BATCH: {u.batch}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 shadow-sm ${badge.cls}`}>
                            <i className={`fa-solid ${badge.icon}`} /> {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.is_locked ? (
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
                          {u.id !== user?.id ? (
                            <div className="inline-flex items-center gap-2 justify-end w-full">
                              <button onClick={() => handleToggleLock(u.id, u.name, u.is_locked)} title={u.is_locked ? "Buka Akun" : "Kunci Akun"}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 ${u.is_locked ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-500 hover:text-white hover:border-rose-500'}`}>
                                <i className={`fa-solid ${u.is_locked ? "fa-unlock" : "fa-lock"}`} />
                              </button>
                              <div className="relative shrink-0">
                                <select value={u.role} onChange={e => handleRoleChange(u.id, u.name, u.role, e.target.value)}
                                  className="w-32 border rounded-xl pl-3 pr-6 py-1.5 text-[11px] font-bold outline-none appearance-none cursor-pointer transition-all bg-white border-slate-200 text-slate-700 hover:border-pink-400 focus:ring-2 focus:ring-pink-300">
                                  <option value="intern">USER/INTERN</option>
                                  <option value="admin">ADMIN</option>
                                  <option value="super_admin">SUPER ADMIN</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none text-slate-400" />
                              </div>
                              <button onClick={() => handleResetPassword(u.id, u.name, u.username, u.email, u.role)} title="Reset Password"
                                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 bg-slate-50 border-slate-200 text-slate-400 hover:bg-pink-500 hover:text-white hover:border-pink-500">
                                <i className="fa-solid fa-key" />
                              </button>
                              <button onClick={() => handleDelete(u.id, u.name)} title="Hapus Akun"
                                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors text-xs shrink-0 bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500">
                                <i className="fa-solid fa-trash-can" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic block text-right pr-4">
                              <i className="fa-solid fa-circle-info mr-1" /> Akun Anda
                            </span>
                          )}
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
                Menampilkan <span className="font-black text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}</span> - <span className="font-black text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-black text-slate-700">{filteredUsers.length}</span> pengguna
              </span>
              <div className="flex items-center gap-1.5 font-sans">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-xs bg-white border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${
                      currentPage === page
                        ? "bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/30"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-xs bg-white border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FLOATING ACTION PANEL (Bulk Actions) */}
      {selectedIds.length > 0 && createPortal(
        <div className="fixed bottom-6 inset-x-0 mx-auto w-max z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6 backdrop-blur-lg">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
              <div className="w-8 h-8 bg-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center font-black text-xs border border-pink-500/30">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold text-slate-200">Akun Terpilih</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleBulkLock(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors border border-transparent hover:border-emerald-500/30">
                <i className="fa-solid fa-unlock mr-2" /> Buka
              </button>
              <button onClick={() => handleBulkLock(true)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors border border-transparent hover:border-amber-500/30">
                <i className="fa-solid fa-lock mr-2" /> Kunci
              </button>
              <button onClick={handleBulkResetPassword} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-pink-500/20 hover:text-pink-400 text-slate-300 text-xs font-black uppercase tracking-widest transition-colors border border-transparent hover:border-pink-500/30">
                <i className="fa-solid fa-key mr-2" /> Reset
              </button>
              <button onClick={handleBulkDelete} className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 text-xs font-black uppercase tracking-widest transition-colors ml-2">
                <i className="fa-solid fa-trash mr-2" /> Hapus
              </button>
            </div>
            <button onClick={() => setSelectedIds([])} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 text-slate-300 rounded-full border-4 border-slate-900 flex items-center justify-center hover:bg-slate-600 transition-colors shadow-lg text-xs">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ================================================================= */}
      {/* MODAL: ADD / IMPORT USERS (DIBUNGKUS PORTAL)                        */}
      {/* ================================================================= */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0b1437]/80 backdrop-blur-sm p-4 animate-in fade-in m-0">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 border border-pink-200 flex items-center justify-center shrink-0 shadow-inner">
                  <i className="fa-solid fa-user-plus text-sm" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Tambah Akun</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual / Import CSV</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-white shrink-0">
              <button onClick={() => setAddMode("manual")} className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 ${addMode === "manual" ? "border-pink-500 text-pink-600 bg-pink-50/50" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>
                <i className="fa-solid fa-keyboard mr-1.5" /> Input Manual
              </button>
              <button onClick={() => setAddMode("csv")} className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 ${addMode === "csv" ? "border-pink-500 text-pink-600 bg-pink-50/50" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>
                <i className="fa-solid fa-file-csv mr-1.5" /> Import CSV
              </button>
            </div>

            <div className="p-6 md:p-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
              {addMode === "manual" ? (
                <form onSubmit={submitManual} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Nama Lengkap</label>
                    <input type="text" required value={manualForm.full_name} onChange={e => setManualForm({...manualForm, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" placeholder="Budi Santoso" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Username</label>
                      <input type="text" required value={manualForm.username} onChange={e => setManualForm({...manualForm, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" placeholder="budi123" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Email</label>
                      <input type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" placeholder="budi@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Divisi</label>
                      <select required value={manualForm.division_id} onChange={e => setManualForm({...manualForm, division_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none appearance-none cursor-pointer">
                        {divisionsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Role</label>
                      <select required value={manualForm.role} onChange={e => setManualForm({...manualForm, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none appearance-none cursor-pointer">
                        <option value="intern">Intern</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                  {manualForm.role === "intern" && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Internship Batch (Opsional)</label>
                      <input type="text" value={manualForm.internship_batch} onChange={e => setManualForm({...manualForm, internship_batch: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" placeholder="Contoh: Batch 1 2026" />
                    </div>
                  )}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3 items-start mt-4 shadow-sm">
                    <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">Password akan dibuat otomatis. Kamu akan melihatnya di layar setelah akun berhasil dibuat.</p>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full mt-6 py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 active:scale-95">
                    {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memproses...</> : "Buat Akun Sekarang"}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitCsv} className="space-y-4 text-center">
                  <div className="border-2 border-dashed border-pink-200 rounded-2xl p-8 bg-pink-50/50 relative group cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all">
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={e => setCsvFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-pink-100 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-file-excel text-3xl text-emerald-500" />
                    </div>
                    {csvFile ? (
                      <div>
                        <p className="font-bold text-pink-700 text-sm">{csvFile.name}</p>
                        <p className="text-xs text-pink-500 mt-1">{(csvFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-pink-700 text-sm">Klik atau Seret file Excel/CSV ke sini</p>
                        <p className="text-xs text-pink-500 mt-1">Gunakan template Excel agar format lebih rapi</p>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={isSubmitting || !csvFile} className="w-full py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 active:scale-95">
                    {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Mengimpor...</> : "Mulai Import Massal"}
                  </button>
                  <button type="button" onClick={downloadExcelTemplate} className="block w-full mt-4 text-[11px] font-bold text-slate-400 hover:text-emerald-500 underline bg-transparent border-none cursor-pointer text-center transition-colors">
                    Download Template Excel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================================================================= */}
      {/* FLOATING CREDENTIALS CARD (DIBUNGKUS PORTAL)                        */}
      {/* ================================================================= */}
      {newCredentials.length > 0 && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0b1437]/80 backdrop-blur-sm p-4 animate-in fade-in m-0">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 md:p-8 bg-emerald-500 border-b border-emerald-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-2xl mb-1 flex items-center gap-2 tracking-tight">
                  <i className="fa-solid fa-circle-check" /> Akun Berhasil Dibuat
                </h3>
                <p className="text-sm font-medium text-emerald-100">Simpan kredensial ini segera. Password tidak akan ditampilkan lagi.</p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              <div className="space-y-4">
                {newCredentials.map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 text-base">{c.full_name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {c.email} • <span className="font-bold text-pink-600">@{c.username}</span> • <span className="uppercase text-slate-400">{c.role}</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-center shrink-0 w-full sm:w-auto">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Password Sementara</p>
                      <p className="font-mono text-sm font-black text-slate-800 tracking-wider">{c.password}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-3 shrink-0">
              <button onClick={downloadCredentialsCsv} className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all border border-slate-200 flex items-center justify-center gap-2">
                <i className="fa-solid fa-file-csv" /> Download CSV
              </button>
              <button onClick={copyCredentials} className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all border border-slate-200 flex items-center justify-center gap-2">
                <i className="fa-solid fa-copy" /> Copy Text
              </button>
              <button onClick={() => setNewCredentials([])} className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-lg shadow-emerald-500/30 active:scale-95">
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 m-0">
          <ConfirmModal {...modalState} onClose={closeModal} isDark={false} />
        </div>,
        document.body
      )}
    </>
  );
};

export default ManageAdmin;