import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const DivisionAnalytics = () => {
  const { user, isSuperAdmin, userTheme } = useAuth();

  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State UI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🔥 FIX 6: Loading State
  
  const [formData, setFormData] = useState({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  // 🔥 FIX 1: Pilihan Ikon biar tinggal klik
  const ICON_CHOICES = [
    "fa-building", "fa-laptop-code", "fa-palette", "fa-bullhorn", 
    "fa-camera", "fa-headset", "fa-chart-pie", "fa-network-wired", 
    "fa-users-gear", "fa-shield-halved"
  ];

  // 🔥 FIX 4: Ambil daftar Admin aktif dari semua divisi
  const availableAdmins = useMemo(() => {
    const admins = [];
    divisions.forEach(div => {
      if (div.members) {
        div.members.forEach(member => {
          if (member.role.toLowerCase().includes("admin")) {
            admins.push({ id: member.id, name: member.name, divName: div.name });
          }
        });
      }
    });
    // Hapus duplikat nama
    return Array.from(new Set(admins.map(a => a.name)))
      .map(name => admins.find(a => a.name === name));
  }, [divisions]);

  // Kunci Scroll Layar
  useEffect(() => {
    if (isFormOpen || selectedDivision || modalState.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isFormOpen, selectedDivision, modalState.isOpen]);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/divisions/analytics');
      } catch {
        res = await api.get('/divisions');
      }
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setDivisions(raw.map(d => ({
        id: d.id,
        name: d.name,
        icon: d.icon || 'fa-building',
        color: d.color || 'blue',
        head: d.head || '',
        internCount: d.intern_count || d.internCount || 0,
        description: d.description || '',
        performance: d.performance || 0,
        jobDescriptions: d.job_descriptions || d.jobDescriptions || [],
        members: d.members || [],
        leaderboard: d.leaderboard || []
      })));
    } catch (error) {
      toast.error("Gagal memuat data analitik divisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchDivisions();
  }, [isSuperAdmin]);

  const filteredDivisions = useMemo(() => {
    if (!searchQuery) return divisions;
    const q = searchQuery.toLowerCase();
    return divisions.filter(div =>
      (div.name || "").toLowerCase().includes(q) ||
      (div.head || "").toLowerCase().includes(q) ||
      (div.description || "").toLowerCase().includes(q)
    );
  }, [divisions, searchQuery]);

  const handleOpenAddForm = () => {
    setFormData({ id: null, name: "", icon: "fa-building", color: "blue", head: "", description: "" });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (div) => {
    setFormData({ ...div });
    setIsFormOpen(true);
  };

  const handleDelete = (id, name, internCount) => {
    // 🔥 FIX 3: Cegah Hapus kalau ada Intern
    if (internCount > 0) {
      toast.error(`Tidak bisa dihapus! Masih ada ${internCount} anggota di divisi ${name}.`);
      return;
    }
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Hapus Divisi",
      message: `Yakin ingin menghapus divisi "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      actionText: "Ya, Hapus!",
      onConfirm: async () => {
        try {
          await api.delete(`/divisions/${id}`);
          toast.success(`Divisi ${name} berhasil dihapus.`);
          fetchDivisions();
        } catch (error) {
          toast.error("Gagal menghapus divisi");
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.head) return toast.error("Penanggung Jawab wajib dipilih!");

    setIsSubmitting(true);
    try {
      if (formData.id) {
        await api.put(`/divisions/${formData.id}`, formData);
        toast.success("Data divisi berhasil diperbarui");
      } else {
        await api.post('/divisions', formData);
        toast.success("Divisi baru berhasil ditambahkan");
      }
      fetchDivisions();
      setIsFormOpen(false);
    } catch (error) {
      // 🔥 FIX 2: Tangkap error dari backend (misal: nama sama)
      toast.error(error.response?.data?.message || "Gagal menyimpan data divisi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeColors = (color) => {
    const lightMap = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      purple: "text-purple-600 bg-purple-50 border-purple-100",
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
      rose: "text-rose-600 bg-rose-50 border-rose-100",
      amber: "text-amber-600 bg-amber-50 border-amber-100",
    };
    return lightMap[color] || "text-slate-600 bg-slate-50 border-slate-100";
  };

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

  const tClass = {
    super_admin: {
      bgMain: "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-200 shadow-pink-200/50",
      bgSub1: "bg-white/40",
      bgSub2: "bg-rose-100/30",
      iconBg: "bg-white/20 border-white/40 text-white",
      badgeText: "text-pink-50 bg-white/20 border-white/30",
      descText: "text-pink-50",
      searchWrap: "bg-black/10",
      searchIcon: "text-pink-300 group-focus-within:text-pink-500",
      searchInput: "border-pink-100 focus:border-pink-300 focus:ring-pink-300/30 placeholder:text-pink-300 text-slate-700",
      addBtn: "bg-pink-500 hover:bg-pink-600 shadow-pink-500/30",
      cardHover: "hover:border-pink-300 hover:shadow-pink-500/10",
      cardIcon: "text-pink-500",
      cardActionHover: "hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50",
      cardTitleHover: "group-hover:text-pink-600",
      cardArrow: "bg-pink-50 border-pink-200 text-pink-500 group-hover:bg-pink-600 group-hover:text-white group-hover:shadow-md",
      modalBorder: "border-pink-200",
      modalHeaderBg: "bg-gradient-to-r from-pink-500 to-rose-500",
      modalSubText: "text-pink-100",
      inputFocus: "focus:ring-pink-400 focus:border-pink-300",
      iconBox: "bg-pink-50 border-pink-200 text-pink-500",
      iconActive: "bg-pink-500 text-white border-pink-600 shadow-sm",
      detailHeaderIconBg: "bg-pink-500 shadow-pink-500/30",
      detailSubText: "text-pink-400",
      detailCloseBtn: "bg-pink-50 text-pink-600 hover:bg-rose-500 hover:border-rose-500 border-pink-200",
      detailBoxBorder: "border-pink-100",
      detailIcon: "text-pink-500",
      detailJobBox: "bg-pink-50/50 border-pink-100 hover:border-pink-300",
      detailCountBadge: "text-pink-600 bg-pink-50 border-pink-200",
      detailMemberHover: "hover:border-pink-200",
      detailMemberAvatar: "bg-gradient-to-br from-pink-400 to-pink-500"
    },
    admin: {
      bgMain: "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20 shadow-blue-900/30",
      bgSub1: "bg-blue-500/20",
      bgSub2: "bg-sky-500/10",
      iconBg: "bg-white/10 border-white/20 text-white",
      badgeText: "text-blue-200 bg-white/10 border-white/10",
      descText: "text-blue-100/70",
      searchWrap: "bg-black/10",
      searchIcon: "text-blue-400 group-focus-within:text-blue-600",
      searchInput: "border-blue-100 focus:border-blue-300 focus:ring-blue-300/30 placeholder:text-blue-300 text-slate-700",
      addBtn: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30",
      cardHover: "hover:border-blue-300 hover:shadow-blue-500/10",
      cardIcon: "text-blue-500",
      cardActionHover: "hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50",
      cardTitleHover: "group-hover:text-blue-600",
      cardArrow: "bg-blue-50 border-blue-200 text-blue-500 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md",
      modalBorder: "border-blue-200",
      modalHeaderBg: "bg-gradient-to-r from-blue-600 to-[#1a3a6c]",
      modalSubText: "text-blue-100",
      inputFocus: "focus:ring-blue-400 focus:border-blue-300",
      iconBox: "bg-blue-50 border-blue-200 text-blue-500",
      iconActive: "bg-blue-600 text-white border-blue-700 shadow-sm",
      detailHeaderIconBg: "bg-blue-600 shadow-blue-500/30",
      detailSubText: "text-blue-400",
      detailCloseBtn: "bg-blue-50 text-blue-600 hover:bg-rose-500 hover:border-rose-500 border-blue-200",
      detailBoxBorder: "border-blue-100",
      detailIcon: "text-blue-500",
      detailJobBox: "bg-blue-50/50 border-blue-100 hover:border-blue-300",
      detailCountBadge: "text-blue-600 bg-blue-50 border-blue-200",
      detailMemberHover: "hover:border-blue-200",
      detailMemberAvatar: "bg-gradient-to-br from-blue-400 to-blue-500"
    },
    intern: {
      bgMain: "bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-400/20 shadow-cyan-500/30",
      bgSub1: "bg-white/20",
      bgSub2: "bg-cyan-200/20",
      iconBg: "bg-white/10 border-white/20 text-white",
      badgeText: "text-cyan-50 bg-white/10 border-white/10",
      descText: "text-cyan-50/80",
      searchWrap: "bg-black/10",
      searchIcon: "text-cyan-400 group-focus-within:text-cyan-600",
      searchInput: "border-cyan-100 focus:border-cyan-300 focus:ring-cyan-300/30 placeholder:text-cyan-300 text-slate-700",
      addBtn: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/30",
      cardHover: "hover:border-cyan-300 hover:shadow-cyan-500/10",
      cardIcon: "text-cyan-500",
      cardActionHover: "hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50",
      cardTitleHover: "group-hover:text-cyan-600",
      cardArrow: "bg-cyan-50 border-cyan-200 text-cyan-500 group-hover:bg-cyan-600 group-hover:text-white group-hover:shadow-md",
      modalBorder: "border-cyan-200",
      modalHeaderBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
      modalSubText: "text-cyan-100",
      inputFocus: "focus:ring-cyan-400 focus:border-cyan-300",
      iconBox: "bg-cyan-50 border-cyan-200 text-cyan-500",
      iconActive: "bg-cyan-500 text-white border-cyan-600 shadow-sm",
      detailHeaderIconBg: "bg-cyan-500 shadow-cyan-500/30",
      detailSubText: "text-cyan-400",
      detailCloseBtn: "bg-cyan-50 text-cyan-600 hover:bg-rose-500 hover:border-rose-500 border-cyan-200",
      detailBoxBorder: "border-cyan-100",
      detailIcon: "text-cyan-500",
      detailJobBox: "bg-cyan-50/50 border-cyan-100 hover:border-cyan-300",
      detailCountBadge: "text-cyan-600 bg-cyan-50 border-cyan-200",
      detailMemberHover: "hover:border-cyan-200",
      detailMemberAvatar: "bg-gradient-to-br from-cyan-400 to-cyan-500"
    }
  }[userTheme] || {
      bgMain: "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-200 shadow-pink-200/50",
      bgSub1: "bg-white/40",
      bgSub2: "bg-rose-100/30",
      iconBg: "bg-white/20 border-white/40 text-white",
      badgeText: "text-pink-50 bg-white/20 border-white/30",
      descText: "text-pink-50",
      searchWrap: "bg-black/10",
      searchIcon: "text-pink-300 group-focus-within:text-pink-500",
      searchInput: "border-pink-100 focus:border-pink-300 focus:ring-pink-300/30 placeholder:text-pink-300 text-slate-700",
      addBtn: "bg-pink-500 hover:bg-pink-600 shadow-pink-500/30",
      cardHover: "hover:border-pink-300 hover:shadow-pink-500/10",
      cardIcon: "text-pink-500",
      cardActionHover: "hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50",
      cardTitleHover: "group-hover:text-pink-600",
      cardArrow: "bg-pink-50 border-pink-200 text-pink-500 group-hover:bg-pink-600 group-hover:text-white group-hover:shadow-md",
      modalBorder: "border-pink-200",
      modalHeaderBg: "bg-gradient-to-r from-pink-500 to-rose-500",
      modalSubText: "text-pink-100",
      inputFocus: "focus:ring-pink-400 focus:border-pink-300",
      iconBox: "bg-pink-50 border-pink-200 text-pink-500",
      iconActive: "bg-pink-500 text-white border-pink-600 shadow-sm",
      detailHeaderIconBg: "bg-pink-500 shadow-pink-500/30",
      detailSubText: "text-pink-400",
      detailCloseBtn: "bg-pink-50 text-pink-600 hover:bg-rose-500 hover:border-rose-500 border-pink-200",
      detailBoxBorder: "border-pink-100",
      detailIcon: "text-pink-500",
      detailJobBox: "bg-pink-50/50 border-pink-100 hover:border-pink-300",
      detailCountBadge: "text-pink-600 bg-pink-50 border-pink-200",
      detailMemberHover: "hover:border-pink-200",
      detailMemberAvatar: "bg-gradient-to-br from-pink-400 to-pink-500"
  };

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* HERO SECTION */}
        <div className={`${tClass.bgMain} rounded-[2.5rem] border shadow-xl relative overflow-hidden flex flex-col text-white`}>
          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-white/20 overflow-hidden">
            <div className={`absolute -top-32 -right-32 w-96 h-96 ${tClass.bgSub1} rounded-full blur-[80px] pointer-events-none`} />
            <div className={`absolute -bottom-32 -left-32 w-72 h-72 ${tClass.bgSub2} rounded-full blur-[80px] pointer-events-none`} />

            <div className="lg:max-w-xl relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl ${tClass.iconBg} flex items-center justify-center shadow-inner shrink-0 backdrop-blur-sm`}>
                  <i className="fa-solid fa-chart-line text-xl" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${tClass.badgeText} px-3 py-1.5 rounded-lg border backdrop-blur-sm`}>
                  Global Performance Monitoring
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight drop-shadow-sm">
                Global Analytics.
              </h1>
              <p className={`text-sm font-medium ${tClass.descText} leading-relaxed`}>
                Pantau performa operasional, persebaran pengguna, dan leaderboard tiap divisi secara komprehensif.
              </p>
            </div>

            <div className="w-full lg:w-72 shrink-0 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5 shadow-lg relative z-10">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
                  <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <path strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white animate-[spin_3s_linear_infinite]" />
                </svg>
                <i className="fa-solid fa-arrows-rotate absolute animate-pulse text-[10px] text-pink-100" />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-center gap-2.5 bg-black/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-sm">Live Sync</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/5 backdrop-blur-sm">
            <div className="relative w-full sm:w-80 group">
              <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 ${tClass.searchIcon} transition-colors`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari divisi atau admin..."
                className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none border transition-all bg-white/10 ${tClass.searchInput} text-white`}
              />
            </div>
            <button onClick={handleOpenAddForm} className={`w-full sm:w-auto px-6 py-3 ${tClass.addBtn} text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95`}>
              <i className="fa-solid fa-plus" /> Tambah Divisi
            </button>
          </div>
        </div>

        {/* GRID CARDS DIVISI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border p-6 sm:p-8 animate-pulse bg-white border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100" />
                <div className="text-right space-y-2">
                  <div className="h-2 w-16 rounded bg-slate-100" />
                  <div className="h-6 w-12 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-5 w-2/3 rounded mb-3 bg-slate-100" />
              <div className="h-3 w-full rounded mb-2 bg-slate-50" />
              <div className="h-3 w-4/5 rounded mb-6 bg-slate-50" />
              <div className="h-12 sm:h-14 w-full rounded-2xl bg-slate-50" />
            </div>
          ))}

          {!loading && filteredDivisions.length === 0 && (
            <div className="col-span-1 lg:col-span-2 py-16 sm:py-20 rounded-[2rem] border flex flex-col items-center justify-center gap-4 bg-white border-pink-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border bg-pink-50 border-pink-100 text-pink-300">
                <i className="fa-solid fa-building text-xl sm:text-2xl" />
              </div>
              <div className="text-center px-4">
                <p className="font-black text-sm sm:text-base text-slate-700">{searchQuery ? "Divisi tidak ditemukan" : "Belum ada divisi"}</p>
                <p className="text-[11px] sm:text-xs font-medium mt-1 text-slate-400">{searchQuery ? "Coba kata kunci lain." : "Tambahkan divisi pertama Anda."}</p>
              </div>
            </div>
          )}

          {!loading && filteredDivisions.map((div) => {
            const badgeClass = getBadgeColors(div.color);
            return (
              <div key={div.id} onClick={() => setSelectedDivision(div)} className={`rounded-[2rem] border p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col cursor-pointer bg-white border-slate-200 ${tClass.cardHover}`}>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none hidden sm:block">
                  <i className={`fa-solid ${div.icon} text-[10rem] sm:text-[12rem] ${tClass.cardIcon}`} />
                </div>

                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditForm(div); }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 ${tClass.cardActionHover}`}>
                    <i className="fa-solid fa-pen-to-square text-xs sm:text-sm" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(div.id, div.name, div.internCount); }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors bg-white/90 backdrop-blur-md text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50">
                    <i className="fa-solid fa-trash text-xs sm:text-sm" />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-5 sm:mb-6 relative z-10">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl shadow-inner border shrink-0 ${badgeClass}`}>
                    <i className={`fa-solid ${div.icon}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Performance</p>
                    <h4 className={`text-2xl sm:text-3xl font-black ${div.performance > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>{div.performance}%</h4>
                  </div>
                </div>

                <h3 className={`text-xl sm:text-2xl font-black mb-1.5 sm:mb-2 transition-colors relative z-10 text-slate-800 ${tClass.cardTitleHover}`}>{div.name}</h3>

                <p className="text-xs sm:text-[14px] font-medium leading-relaxed mb-5 sm:mb-6 line-clamp-2 relative z-10 text-slate-500">
                  {div.description}
                </p>

                <div className="mb-5 sm:mb-6 relative z-10">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5 sm:mb-2 text-slate-400">Penanggung Jawab</p>
                  {div.head ? (
                    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border bg-slate-50 border-slate-100">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm border shrink-0 bg-white text-slate-600 border-slate-200">
                        {div.head.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-[14px] font-bold leading-tight truncate text-slate-700">{div.head}</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase mt-0.5">Admin Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] sm:text-[11px] font-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 w-max bg-rose-50 text-rose-600 border-rose-100">
                      <i className="fa-solid fa-triangle-exclamation animate-pulse" /> Belum Ada
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4 sm:pt-6 border-t flex items-center justify-between z-10 border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-100">
                    <i className="fa-solid fa-users text-[10px] sm:text-xs text-slate-400" />
                    <span className="text-[10px] sm:text-xs font-black text-slate-600">{div.internCount} Anggota</span>
                  </div>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors border ${tClass.cardArrow}`}>
                    <i className="fa-solid fa-arrow-right text-xs sm:text-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <ConfirmModal {...modalState} onClose={closeModal} isDark={false} />
        </div>,
        document.body
      )}

      {/* ================================================================= */}
      {/* MODAL FORM TAMBAH / EDIT DIVISI (UPDATE FIX TNC & LAYOUT)         */}
      {/* ================================================================= */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in p-4 sm:p-6">
          <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 border bg-white ${tClass.modalBorder}`}>
            
            <div className={`p-5 sm:p-6 md:p-8 flex justify-between items-center shrink-0 text-white ${tClass.modalHeaderBg}`}>
              <div>
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                    <i className="fa-solid fa-layer-group text-sm" />
                  </div>
                  {formData.id ? "Edit Divisi" : "Tambah Divisi Baru"}
                </h2>
                <p className={`text-[10px] sm:text-xs font-medium mt-2 ${tClass.modalSubText}`}>
                  Lengkapi informasi divisi operasional di bawah ini.
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors flex items-center justify-center shrink-0 bg-white/10 text-white/90 hover:bg-white hover:text-rose-500 disabled:opacity-50">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-slate-50">
              
              {/* Area Scrollable Input */}
              <div className="p-4 sm:p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="p-4 sm:p-6 rounded-2xl border shadow-sm space-y-5 bg-white border-slate-200">
                  
                  {/* INPUT NAMA */}
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Nama Divisi <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <i className={`fa-solid fa-signature absolute left-4 top-1/2 -translate-y-1/2 ${tClass.detailIcon}`} />
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Misal: IT Support" className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white ${tClass.inputFocus}`} />
                    </div>
                  </div>

                  {/* DROP PENANGGUNG JAWAB (WAJIB) */}
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Penanggung Jawab <span className="text-rose-500">*</span></label>
                    <select required value={formData.head} onChange={e => setFormData({ ...formData, head: e.target.value })} className={`w-full rounded-xl px-4 py-3 h-12 text-sm font-bold outline-none focus:ring-2 transition-all cursor-pointer border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white ${tClass.inputFocus}`}>
                      <option value="" disabled>-- Pilih Admin Terdaftar --</option>
                      {availableAdmins.map((admin, idx) => (
                        <option key={idx} value={admin.name}>{admin.name} (Dari {admin.divName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {/* WARNA TEMA */}
                    <div>
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Warna Tema</label>
                      <select value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className={`w-full rounded-xl px-4 py-3 h-12 text-sm font-bold outline-none focus:ring-2 transition-all cursor-pointer border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white ${tClass.inputFocus}`}>
                        <option value="blue">Biru (Blue)</option>
                        <option value="purple">Ungu (Purple)</option>
                        <option value="emerald">Hijau (Emerald)</option>
                        <option value="rose">Merah (Rose)</option>
                        <option value="amber">Kuning (Amber)</option>
                      </select>
                    </div>

                    {/* IKON PICKER BIAR GA BINGUNG */}
                    <div>
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Pilih Ikon</label>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-lg border shadow-sm ${tClass.iconBox}`}>
                          <i className={`fa-solid ${formData.icon}`} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                          {ICON_CHOICES.map(icon => (
                            <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })} className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-sm border transition-all ${formData.icon === icon ? tClass.iconActive : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                              <i className={`fa-solid ${icon}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DESKRIPSI */}
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 block text-slate-500">Deskripsi Tugas</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Jelaskan peran divisi ini..." className={`w-full rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 resize-none transition-all border bg-slate-50 border-slate-200 text-slate-700 focus:bg-white ${tClass.inputFocus}`} />
                  </div>
                </div>
              </div>

              {/* FOOTER LENGKET DI BAWAH */}
              <div className="p-4 sm:p-6 md:px-8 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row gap-3 shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="w-full sm:w-1/3 py-3.5 sm:py-4 font-bold rounded-xl transition-colors border text-sm bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className={`w-full sm:w-2/3 py-3.5 sm:py-4 text-white font-black tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all text-sm disabled:opacity-50 disabled:cursor-wait ${tClass.addBtn}`}>
                  {isSubmitting ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Memproses...</>
                  ) : (
                    <><i className="fa-solid fa-floppy-disk" /> {formData.id ? "Simpan Perubahan" : "Simpan Divisi Baru"}</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: FULL-SCREEN PROFILE DETAIL DIVISI */}
      {selectedDivision && createPortal(
        <div className="fixed inset-0 z-[999999] flex flex-col animate-in fade-in zoom-in-95 duration-300 bg-slate-50 overflow-hidden m-0">
          <div className={`px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b shadow-sm flex flex-row justify-between items-center gap-4 shrink-0 bg-white ${tClass.detailBoxBorder}`}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl text-white shadow-lg shrink-0 ${tClass.detailHeaderIconBg}`}>
                <i className={`fa-solid ${selectedDivision.icon}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black leading-tight truncate text-slate-800">{selectedDivision.name}</h2>
                <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1 truncate ${tClass.detailSubText}`}>Profil Lengkap Divisi</p>
              </div>
            </div>
            <button onClick={() => setSelectedDivision(null)} className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all shrink-0 border ${tClass.detailCloseBtn}`}>
              <i className="fa-solid fa-arrow-left" /> <span className="hidden sm:inline">Tutup Panel</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-12">
              <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                <div className={`rounded-[2.5rem] p-6 sm:p-8 md:p-10 border shadow-sm bg-white ${tClass.detailBoxBorder}`}>
                  <h3 className="text-base sm:text-lg font-black mb-4 text-slate-800">Tentang Divisi</h3>
                  <p className="text-sm sm:text-[15px] font-medium leading-relaxed text-slate-600">{selectedDivision.description}</p>
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t flex items-center gap-3 sm:gap-4 border-slate-100">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black border shadow-sm shrink-0 ${tClass.iconBox}`}>
                      {selectedDivision.head ? selectedDivision.head.charAt(0) : <i className="fa-solid fa-user-slash" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Penanggung Jawab (Lead)</p>
                      <p className="text-sm sm:text-base font-bold truncate text-slate-800">{selectedDivision.head || "Belum Ada Admin"}</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-[2.5rem] p-6 sm:p-8 md:p-10 border shadow-sm bg-white ${tClass.detailBoxBorder}`}>
                  <h3 className="text-base sm:text-lg font-black mb-5 sm:mb-6 flex items-center gap-3 text-slate-800">
                    <i className={`fa-solid fa-clipboard-check text-lg sm:text-xl ${tClass.detailIcon}`} /> Tanggung Jawab Utama
                  </h3>
                  {selectedDivision.jobDescriptions?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {selectedDivision.jobDescriptions.map((job, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-4 sm:p-5 rounded-2xl border transition-colors ${tClass.detailJobBox}`}>
                          <i className={`fa-solid fa-circle-check mt-1 shrink-0 ${tClass.detailIcon}`} />
                          <span className="text-xs sm:text-[13px] font-bold leading-relaxed text-slate-700">{job.task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 rounded-2xl border bg-slate-50 border-slate-100">
                      <p className="text-xs sm:text-sm font-medium text-slate-400">Belum ada rincian tanggung jawab.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                <div className={`rounded-[2.5rem] p-5 sm:p-6 md:p-8 border shadow-sm bg-white ${tClass.detailBoxBorder}`}>
                  <div className="flex justify-between items-center mb-5 sm:mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 sm:gap-3 text-slate-800">
                      <i className={`fa-solid fa-users text-base sm:text-lg ${tClass.detailIcon}`} /> Anggota Tim
                    </h3>
                    <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg border ${tClass.detailCountBadge}`}>
                      {selectedDivision.internCount} User
                    </span>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    {selectedDivision.members?.length > 0 ? (
                      selectedDivision.members.map((member, idx) => (
                        <div key={idx} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl transition-colors border bg-slate-50 border-slate-100 ${tClass.detailMemberHover}`}>
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black text-white shadow-sm shrink-0 ${tClass.detailMemberAvatar}`}>
                            {member.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-black leading-tight truncate text-slate-800">{member.name}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5 text-slate-400">{member.role}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-5 sm:py-6 text-center rounded-xl border bg-slate-50 border-slate-100 text-slate-400">
                        <p className="text-[11px] sm:text-xs font-medium">Belum ada anggota.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-[2.5rem] p-5 sm:p-6 md:p-8 border shadow-sm bg-white ${tClass.detailBoxBorder}`}>
                  <h3 className="text-xs sm:text-sm font-black mb-5 sm:mb-6 border-b border-slate-100 pb-4 flex items-center gap-2 sm:gap-3 text-slate-800">
                    <i className="fa-solid fa-fire text-orange-500 text-base sm:text-lg" /> Top Interns
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    {selectedDivision.leaderboard?.length > 0 ? selectedDivision.leaderboard.map((intern, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-colors ${
                        idx === 0 ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm" : `bg-white border-slate-100 ${tClass.detailMemberHover}`
                        }`}>
                        <div className="flex items-center gap-3.5 min-w-0 w-full">
                          <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm shrink-0 ${
                            idx === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30" : idx === 1 ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-600"
                            }`}>
                            {idx === 0 ? <i className="fa-solid fa-trophy text-[10px] sm:text-[11px]" /> : idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black leading-tight truncate text-slate-800">{intern.name}</p>
                            <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate ${intern.status === 'Warning' ? 'text-rose-500' : 'text-slate-400'}`}>{intern.status}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="border rounded-2xl p-5 sm:p-6 text-center bg-slate-50 border-slate-100">
                        <p className="text-[11px] sm:text-xs font-medium text-slate-500">Leaderboard kosong.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};

export default DivisionAnalytics;