import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import ImageModal from "../../components/ui/ImageModal";
import MIPTopLogo from "../../assets/images/MIP_toplogo.png";

const PAGE_SIZE = 6;

// ── Pagination Tetap Sama ────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onChange }) => {
  const { userTheme } = useAuth();
  if (totalPages <= 1) return null;

  const btnClass = userTheme === "super_admin" 
    ? "border-pink-200 bg-pink-500/5 text-pink-600 hover:bg-pink-500/10" 
    : userTheme === "admin"
      ? "border-blue-900/20 bg-[#162447]/5 text-blue-900 hover:bg-[#162447]/10"
      : "border-cyan-500/20 bg-cyan-500/5 text-cyan-600 hover:bg-cyan-500/10";
      
  const activeBtnClass = userTheme === "super_admin"
    ? "bg-pink-500 text-white border-pink-500 shadow-pink-500/20"
    : userTheme === "admin"
      ? "bg-[#162447] text-white border-[#162447] shadow-[#162447]/20"
      : "bg-cyan-500 text-white border-cyan-500 shadow-cyan-500/20";

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 transition-all shadow-sm ${btnClass}`}>
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isEdge = p === 1 || p === totalPages;
        const isNear = Math.abs(p - page) <= 1;
        if (!isEdge && !isNear) {
          if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
          return null;
        }
        return (
          <button key={p} onClick={() => onChange(p)} className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all shadow-sm ${p === page ? `${activeBtnClass} scale-105` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
            {p}
          </button>
        );
      })}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 transition-all shadow-sm ${btnClass}`}>
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

const Approval = () => {
  const { user, isSuperAdmin, userTheme } = useAuth();
  const queryClient = useQueryClient(); // ✅ Alat tempur auto-refresh data

  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "leaves" : "tasks");
  const [rejectState, setRejectState] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchTask, setSearchTask] = useState("");
  const [searchLeave, setSearchLeave] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  
  // State Fitur Baru Lu
  const [confirmAccLeave, setConfirmAccLeave] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  
  const [modalImage, setModalImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openImageModal = (e, url) => {
    e.preventDefault();
    setModalImage(url);
    setIsModalOpen(true);
  };

  // ── 1. MESIN BARU: TanStack Query (Bakar useEffect lu!) ──
  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ["approvalsData"],
    queryFn: async () => {
      const [tRes, lRes] = await Promise.all([
        api.get("/daily-tasks"),
        api.get("/exceptions"),
      ]);
      return {
        tasks: tRes.data?.data || tRes.data || [],
        leaves: lRes.data?.data || lRes.data || [],
      };
    },
    staleTime: 60 * 1000, // Tahan data 1 menit biar gak spam API
  });

  // ── 2. OLAH DATA LANGSUNG (Derived State) ──
  const pendingTasks = (data?.tasks || [])
    .filter((t) => t.status === "pending" && t.submitted_at)
    .sort((a, b) => new Date(a.submitted_at || a.created_at) - new Date(b.submitted_at || b.created_at))
    .map((t) => ({
      ...t,
      internName: t.uploader?.full_name || "Intern",
      division: t.uploader?.division?.name || t.division?.name || "—",
      taskTitle: t.taskTemplate?.title || t.template?.title || "Tugas Harian",
      notes: t.description,
      photo: t.evidence_url,
      submittedAt: t.submitted_at || t.created_at,
      participants_detail: t.participants_detail || [],
    }));

  const pendingLeaves = (data?.leaves || [])
    .filter((l) => l.status === "pending")
    .map((l) => ({
      ...l,
      internName: l.user?.full_name || "Intern",
      division: l.user?.division?.name || "—",
      reason: l.description,
      dateReq: l.permission_date,
      proof: l.evidence_url,
    }));

  const approvedLeaves = (data?.leaves || [])
    .filter((l) => l.status === "approved")
    .map((l) => ({
      ...l,
      internName: l.user?.full_name || "Intern",
      division: l.user?.division?.name || "—",
      reason: l.description,
      dateReq: l.permission_date,
      proof: l.evidence_url,
    }));

  // reset page on tab/search change
  useEffect(() => { setTaskPage(1); }, [activeTab, searchTask]);
  useEffect(() => { setLeavePage(1); }, [activeTab, searchLeave]);
  useEffect(() => { setHistoryPage(1); }, [activeTab, searchHistory]);

  // Filters & Pagination
  const filteredTasks = pendingTasks.filter((t) => !searchTask || t.internName.toLowerCase().includes(searchTask.toLowerCase()) || t.taskTitle.toLowerCase().includes(searchTask.toLowerCase()));
  const filteredLeaves = pendingLeaves.filter((l) => !searchLeave || l.internName.toLowerCase().includes(searchLeave.toLowerCase()) || l.type?.includes(searchLeave.toLowerCase()));
  const filteredHistory = approvedLeaves.filter((l) => !searchHistory || l.internName.toLowerCase().includes(searchHistory.toLowerCase()) || l.type?.includes(searchHistory.toLowerCase()));

  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const leaveTotalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const pagedTasks = filteredTasks.slice((taskPage - 1) * PAGE_SIZE, taskPage * PAGE_SIZE);
  const pagedLeaves = filteredLeaves.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE);
  const pagedHistory = filteredHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  // ── 3. HANDLERS (Pake InvalidateQueries biar UI ga kedip) ──
  const handleActionTask = async (id, action) => {
    if (action === "reject") {
      setRejectState({ id, type: "task" });
      setRejectReason("");
      return;
    }
    try {
      await api.put(`/daily-tasks/${id}`, { status: "approved" });
      toast.success("✅ Tugas berhasil di-ACC");
      queryClient.invalidateQueries(["approvalsData"]); // 🔥 Refresh otomatis di background
    } catch {
      toast.error("Gagal memproses tugas");
    }
  };

  useEffect(() => {
    if (confirmAccLeave) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [confirmAccLeave]);

  const handleActionLeave = async (leave, action) => {
    if (action === "reject") {
      setRejectState({ id: leave.id, type: "leave" });
      setRejectReason("");
      return;
    }
    setConfirmAccLeave(leave);
    setConfirmPassword("");
  };

  const handleConfirmAccLeave = async () => {
    if (!confirmPassword) {
      toast.error("Masukkan password Anda untuk konfirmasi");
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await api.put(`/exceptions/${confirmAccLeave.id}`, {
        status: "approved",
        password: confirmPassword,
      });
      toast.success(res.data?.message || "✅ Izin berhasil diproses!");
      setConfirmAccLeave(null);
      setConfirmPassword("");
      queryClient.invalidateQueries(["approvalsData"]); // 🔥 Refresh otomatis
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses izin");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Masukkan alasan penolakan");
      return;
    }
    try {
      if (rejectState.type === "task") {
        await api.put(`/daily-tasks/${rejectState.id}`, { status: "rejected", reject_reason: rejectReason });
      } else {
        await api.put(`/exceptions/${rejectState.id}`, { status: "rejected", description: rejectReason });
      }
      toast.success("Berhasil diproses");
      setRejectState(null);
      queryClient.invalidateQueries(["approvalsData"]); // 🔥 Refresh otomatis
    } catch {
      toast.error("Gagal memproses penolakan");
    }
  };

  const handleResendEmail = async (leaveId) => {
    setResendingId(leaveId);
    const toastId = toast.loading("Mengirim ulang email...");
    try {
      const res = await api.post(`/exceptions/${leaveId}/resend-email`);
      if (res.data?.status === "success") {
        toast.success("✅ Email Surat Izin berhasil dikirim ulang!", { id: toastId });
      } else {
        toast.error(res.data?.message || "Gagal mengirim ulang email.", { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim ulang email.", { id: toastId });
    } finally {
      setResendingId(null);
    }
  };

  // ── UTILS Tetap Sama ──
  const fmt = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) + " WIB";
  };

  const exStyle = (type) => ({
    swap_shift: { icon: "fa-code-compare", color: "text-blue-500", bg: "bg-blue-50", bar: "bg-blue-500", label: "Ganti Shift" },
    sakit: { icon: "fa-house-medical", color: "text-rose-500", bg: "bg-rose-50", bar: "bg-rose-500", label: "Sakit" },
    izin: { icon: "fa-envelope-open-text", color: "text-amber-500", bg: "bg-amber-50", bar: "bg-amber-500", label: "Sebab Lain (Izin)" },
    tugas_luar: { icon: "fa-briefcase", color: "text-emerald-500", bg: "bg-emerald-50", bar: "bg-emerald-500", label: "Tugas Luar" },
    terlambat: { icon: "fa-clock", color: "text-indigo-500", bg: "bg-indigo-50", bar: "bg-indigo-500", label: "Terlambat Masuk" },
    pulang_awal: { icon: "fa-person-walking-arrow-right", color: "text-purple-500", bg: "bg-purple-50", bar: "bg-purple-500", label: "Pulang Awal" },
  })[type] || { icon: "fa-envelope", color: "text-slate-500", bg: "bg-slate-50", bar: "bg-slate-500", label: "Pengajuan" };

  const tabs = [
    ...(!isSuperAdmin ? [{ id: "tasks", label: "Laporan Tugas", icon: "fa-list-check", count: filteredTasks.length }] : []),
    { id: "leaves", label: "Pengajuan Izin", icon: "fa-envelope-open-text", count: filteredLeaves.length },
    { id: "history", label: "Riwayat Izin", icon: "fa-clock-rotate-left", count: approvedLeaves.length },
  ];

  const tClass = {
    super_admin: {
      bgMain: "bg-gradient-to-br from-pink-400 to-rose-500 border-pink-300/30 shadow-pink-500/20",
      bgSub1: "bg-white/30",
      bgSub2: "bg-rose-200/20",
      badgeText: "text-pink-100 bg-white/10 border-white/10",
      descText: "text-pink-50/80",
      searchIcon: "text-pink-100/50 group-focus-within:text-white",
      spinner: "text-pink-500",
      icon: "text-pink-500",
      resendBtn: "bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/20 border-pink-500 active:scale-95"
    },
    admin: {
      bgMain: "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20 shadow-blue-900/30",
      bgSub1: "bg-blue-500/20",
      bgSub2: "bg-sky-500/10",
      badgeText: "text-blue-200 bg-white/10 border-white/10",
      descText: "text-blue-100/70",
      searchIcon: "text-blue-300/50 group-focus-within:text-blue-200",
      spinner: "text-blue-500",
      icon: "text-blue-500",
      resendBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 border-blue-600 active:scale-95"
    },
    intern: {
      bgMain: "bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-400/20 shadow-cyan-500/30",
      bgSub1: "bg-white/20",
      bgSub2: "bg-cyan-200/20",
      badgeText: "text-cyan-50 bg-white/10 border-white/10",
      descText: "text-cyan-50/80",
      searchIcon: "text-cyan-100/50 group-focus-within:text-white",
      spinner: "text-cyan-500",
      icon: "text-cyan-500",
      resendBtn: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20 border-cyan-600 active:scale-95"
    }
  }[userTheme] || {
      bgMain: "bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-400/20 shadow-cyan-500/30",
      bgSub1: "bg-white/20",
      bgSub2: "bg-cyan-200/20",
      badgeText: "text-cyan-50 bg-white/10 border-white/10",
      descText: "text-cyan-50/80",
      searchIcon: "text-cyan-100/50 group-focus-within:text-white",
      spinner: "text-cyan-500",
      icon: "text-cyan-500",
      resendBtn: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20 border-cyan-600 active:scale-95"
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 ${tClass.bgMain}`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${tClass.bgSub1}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${tClass.bgSub2}`} />
          {/* Content Top */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm bg-white/10 border-white/20 text-white">
                <i className="fa-solid fa-clipboard-check text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border ${tClass.badgeText}`}>
                Approval Center
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              Validasi & ACC.
            </h1>
            <p className={`text-sm font-medium leading-relaxed ${tClass.descText}`}>
              Kelola antrean tugas dan pengajuan izin anak divisi dengan cepat.
            </p>
          </div>

          <button
            onClick={() => queryClient.invalidateQueries(["approvalsData"])}
            disabled={isFetching}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all shadow-lg shrink-0 mt-4 sm:mt-0 ${
              isFetching ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50" : "bg-white/10 hover:bg-white/20 border-white/20 text-white active:scale-95"
            }`}
          >
            <i className={`fa-solid fa-arrows-rotate ${isFetching ? "animate-spin" : ""}`} /> 
            {isFetching ? "Memuat..." : "Refresh Data"}
          </button>
        </div>

        <div className="p-6 sm:p-8 relative z-10 bg-black/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">

            {/* Tabs */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 shrink-0 border ${
                      isActive
                        ? userTheme === "super_admin"
                          ? "bg-white text-pink-600 border-white shadow-lg"
                          : userTheme === "admin"
                            ? "bg-white text-[#162447] border-white shadow-lg"
                            : "bg-white text-cyan-600 border-white shadow-lg"
                        : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon}`} /> {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                        isActive
                          ? userTheme === "super_admin"
                            ? "bg-pink-100 text-pink-600"
                            : userTheme === "admin"
                              ? "bg-blue-100 text-[#162447]"
                              : "bg-cyan-100 text-cyan-600"
                          : "bg-rose-500 text-white"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0 group">
              <i className={`fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${tClass.searchIcon}`} />
              <input
                type="text"
                placeholder={activeTab === "tasks" ? "Cari intern atau tugas…" : (activeTab === "leaves" ? "Cari intern…" : "Cari riwayat izin…")}
                value={activeTab === "tasks" ? searchTask : (activeTab === "leaves" ? searchLeave : searchHistory)}
                onChange={(e) => {
                  if (activeTab === "tasks") setSearchTask(e.target.value);
                  else if (activeTab === "leaves") setSearchLeave(e.target.value);
                  else setSearchHistory(e.target.value);
                }}
                className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none border transition-all backdrop-blur-sm text-white focus:ring-2 bg-white/5 border-white/10 focus:border-white/30 ${
                  isSuperAdmin
                    ? "placeholder:text-pink-100/50 focus:ring-pink-300/50"
                    : "placeholder:text-blue-300/50 focus:ring-blue-400/50"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO BAR ──────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-400">
            Menampilkan{" "}
            <span className="text-slate-700">
              {activeTab === "tasks"
                ? `${Math.min((taskPage - 1) * PAGE_SIZE + 1, filteredTasks.length)}–${Math.min(taskPage * PAGE_SIZE, filteredTasks.length)} dari ${filteredTasks.length}`
                : (activeTab === "leaves"
                  ? `${Math.min((leavePage - 1) * PAGE_SIZE + 1, filteredLeaves.length)}–${Math.min(leavePage * PAGE_SIZE, filteredLeaves.length)} dari ${filteredLeaves.length}`
                  : `${Math.min((historyPage - 1) * PAGE_SIZE + 1, filteredHistory.length)}–${Math.min(historyPage * PAGE_SIZE, filteredHistory.length)} dari ${filteredHistory.length}`)}
            </span>{" "}
            data
          </p>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {PAGE_SIZE} per halaman
          </span>
        </div>
      )}

      {/* ── REJECT MODAL ─────────────────────────────────────────────────── */}
      {rejectState && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-md p-8 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-rose-500" />
              {rejectState.type === "task"
                ? "Kembalikan untuk Revisi"
                : "Tolak Pengajuan Izin"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Tulis alasan yang akan dilihat intern.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Foto bukti tidak terlihat jelas, harap upload ulang..."
              className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-400 resize-none bg-slate-50"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setRejectState(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all"
              >
                <i className="fa-solid fa-xmark mr-1" /> Tolak / Revisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TUGAS ───────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-28 bg-slate-200 rounded" />
                      <div className="h-2 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-slate-100 rounded-xl" />
                    <div className="h-10 bg-emerald-50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-mug-hot text-4xl text-slate-300 mb-3 block" />
              <h3 className="text-slate-500 font-bold">
                {searchTask
                  ? "Tidak ditemukan hasil pencarian."
                  : "Semua tugas sudah diperiksa. Aman!"}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {searchTask
                  ? "Coba kata kunci lain."
                  : "Tidak ada tugas pending saat ini."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pagedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                          {task.internName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {task.internName}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400">
                            {task.division}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 shadow-sm shrink-0 block">
                          {fmtTime(task.submittedAt)}
                        </span>
                        {task.submitted_at && (
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 flex items-center gap-1 justify-end">
                            <i className="fa-solid fa-clock-rotate-left" />{" "}
                            Waktu Kirim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1">
                      <h5 className="font-black text-slate-800 mb-3 text-sm">
                        {task.taskTitle}
                      </h5>
                      <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-inner">
                        {task.photo ? (
                          task.photo.match(
                            /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
                          ) ? (
                            <img
                              src={task.photo}
                              alt="Bukti"
                              onClick={(e) => openImageModal(e, task.photo)}
                              onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                            />
                          ) : (
                            <a
                              href={task.photo}
                              target="_blank"
                              rel="noreferrer"
                              className="flex flex-col items-center gap-2 text-blue-500 hover:text-blue-600"
                            >
                              <i className="fa-solid fa-file text-3xl" />
                              <span className="text-[10px] font-bold uppercase">
                                Lihat File
                              </span>
                            </a>
                          )
                        ) : (
                          <div className="text-center text-slate-300">
                            <i className="fa-solid fa-image-slash text-3xl mb-1 block" />
                            <p className="text-[10px] font-bold uppercase">
                              Tanpa Bukti
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium italic leading-relaxed line-clamp-3">
                        "{task.notes || "Tidak ada catatan laporan."}"
                      </p>

                      {/* Peserta / Rekan Kerja */}
                      {task.participants_detail?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-users text-blue-400"></i>{" "}
                            Dikerjakan Bersama
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {task.participants_detail.map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold"
                              >
                                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0">
                                  {p.full_name?.charAt(0) || "?"}
                                </span>
                                {p.full_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => handleActionTask(task.id, "reject")}
                        className="py-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold shadow-sm transition-all"
                      >
                        <i className="fa-solid fa-xmark mr-1" /> Revisi
                      </button>
                      <button
                        onClick={() => handleActionTask(task.id, "acc")}
                        className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                      >
                        <i className="fa-solid fa-check mr-1" /> ACC
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={taskPage}
                totalPages={taskTotalPages}
                onChange={setTaskPage}
              />
            </>
          )}
        </div>
      )}

      {/* ── TAB: LEAVES ──────────────────────────────────────────────────── */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-slate-200 rounded" />
                      <div className="h-2 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-20 bg-slate-100 rounded-xl" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-emerald-50 rounded-xl" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-envelope-circle-check text-4xl text-slate-300 mb-3 block" />
              <h3 className="text-slate-500 font-bold">
                {searchLeave
                  ? "Tidak ditemukan."
                  : "Tidak ada pengajuan izin pending."}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Semua pengajuan sudah diproses.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pagedLeaves.map((leave) => {
                  const st = exStyle(leave.type);
                  return (
                    <div
                      key={leave.id}
                      className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row group hover:border-blue-200 hover:shadow-lg transition-all duration-300 relative"
                    >
                      <div
                        className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-[2rem] ${st.bar}`}
                      />
                      <div className="p-6 pl-8 flex-1 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${st.bg} ${st.color}`}
                            >
                              <i className={`fa-solid ${st.icon}`} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-sm leading-none mb-1">
                                {leave.internName}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {leave.division}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${st.bg} ${st.color}`}
                          >
                            {st.label}
                          </span>
                          <p className="text-[13px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic line-clamp-3">
                            "{leave.reason || "Tidak ada keterangan."}"
                          </p>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Tanggal Pengajuan
                          </p>
                          <p className="text-xs font-black text-slate-700">
                            {fmt(leave.dateReq)}
                          </p>
                        </div>

                        {/* DOUBLE APPROVAL BADGES */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Manager (Admin Divisi)</span>
                            {leave.manager_approved_by ? (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">APPROVED</span>
                            ) : (
                              <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">PENDING</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>SPV (Superadmin)</span>
                            {leave.spv_approved_by ? (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">APPROVED</span>
                            ) : (
                              <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">PENDING</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-44 bg-slate-50/50 p-5 flex flex-col shrink-0 justify-between">
                        <div className="flex-1 flex flex-col items-center justify-center mb-4">
                          {leave.proof ? (
                            <button
                              type="button"
                              onClick={(e) => openImageModal(e, leave.proof)}
                              className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden block relative group/img shadow-inner cursor-pointer"
                            >
                              <img
                                src={leave.proof}
                                alt="Bukti"
                                onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }}
                                className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity bg-white"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <i className="fa-solid fa-magnifying-glass-plus text-white text-xl" />
                              </div>
                            </button>
                          ) : (
                            <div className="text-center text-slate-300">
                              <i className="fa-solid fa-file-circle-xmark text-3xl mb-1 block" />
                              <p className="text-[10px] font-bold uppercase">
                                Tanpa Bukti
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const hasApproved = user?.role === "admin" ? !!leave.manager_approved_by : (user?.role === "super_admin" ? !!leave.spv_approved_by : false);
                            return (
                              <>
                                <button
                                  onClick={() => handleActionLeave(leave, "acc")}
                                  disabled={hasApproved}
                                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    hasApproved
                                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:-translate-y-0.5"
                                  }`}
                                >
                                  <i className="fa-solid fa-check mr-1" /> {hasApproved ? "Sudah ACC" : "ACC"}
                                </button>
                                <button
                                  onClick={() => handleActionLeave(leave, "reject")}
                                  disabled={hasApproved}
                                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    hasApproved
                                      ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                                      : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:-translate-y-0.5"
                                  }`}
                                >
                                  Tolak
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={leavePage}
                totalPages={leaveTotalPages}
                onChange={setLeavePage}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-[#1b254b] font-black text-lg mb-6 flex items-center gap-2">
            <i className={`fa-solid fa-clock-rotate-left ${tClass.icon}`} />
            Riwayat Surat Izin (Disetujui)
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <i className={`fa-solid fa-spinner fa-spin text-3xl ${tClass.spinner}`} />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Memuat riwayat...</p>
            </div>
          ) : pagedHistory.length === 0 ? (
            <div className="text-center py-16">
              <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3 block" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tidak ada riwayat pengajuan</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {pagedHistory.map((leave) => {
                  const details = exStyle(leave.type);
                  return (
                    <div
                      key={leave.id}
                      className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/30 flex flex-col sm:flex-row hover:shadow-md transition-all duration-300"
                    >
                      <div className={`w-3.5 sm:w-4 ${details.bar} shrink-0`} />
                      
                      <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-slate-800 font-black text-base">{leave.internName}</span>
                            <span className="text-slate-300 text-xs">•</span>
                            <span className="text-slate-500 font-bold text-xs">{leave.division}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${details.bg} ${details.color} border-current/20`}>
                              <i className={`fa-solid ${details.icon} mr-1`} />
                              {details.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              {fmt(leave.dateReq)}
                            </span>
                          </div>

                          <p className="text-slate-600 text-sm leading-relaxed font-medium">
                            {leave.reason || <span className="italic text-slate-400">Tidak ada keterangan tambahan.</span>}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Manager (Admin Divisi)</span>
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">APPROVED</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>SPV (Superadmin)</span>
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">APPROVED</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-44 bg-slate-50/50 p-5 flex flex-col shrink-0 justify-between">
                        <div className="flex-1 flex flex-col items-center justify-center mb-4">
                          {leave.proof ? (
                            <button
                              type="button"
                              onClick={(e) => openImageModal(e, leave.proof)}
                              className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden block relative group/img shadow-inner cursor-pointer"
                            >
                              <img
                                src={leave.proof}
                                alt="Bukti"
                                onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }}
                                className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity bg-white"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <i className="fa-solid fa-magnifying-glass-plus text-white text-xl" />
                              </div>
                            </button>
                          ) : (
                            <div className="text-center text-slate-300">
                              <i className="fa-solid fa-file-circle-xmark text-3xl mb-1 block" />
                              <p className="text-[10px] font-bold uppercase">Tanpa Bukti</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleResendEmail(leave.id)}
                            disabled={resendingId === leave.id}
                            className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                              resendingId === leave.id
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : tClass.resendBtn
                            }`}
                          >
                            {resendingId === leave.id ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin animate-spin" />
                                Mengirim...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-paper-plane" />
                                Kirim Ulang
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={historyPage}
                totalPages={historyTotalPages}
                onChange={setHistoryPage}
              />
            </>
          )}
        </div>
      )}
      {/* ── LEAVE ACC CONFIRMATION MODAL ───────────────────────────────────── */}
      {confirmAccLeave && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 animate-in zoom-in-95 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
            
            {/* ISINYA SAMA PERSIS KAYA KODINGAN LU SEBELUMNYA */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-signature text-emerald-500" />
                Konfirmasi ACC Izin
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                Verifikasi password & Tinjau Data Pengaju
              </p>
            </div>

            {/* Warning Alert */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800 text-xs leading-relaxed">
              <i className="fa-solid fa-triangle-exclamation text-base shrink-0 mt-0.5" />
              <div>
                <strong className="font-black uppercase tracking-wider block mb-1">Peringatan Keamanan!</strong>
                Menyetujui izin ini akan meneruskan untuk tanda tangan digital pada dokumen Surat Izin MCC. Jika disetujui penuh oleh kedua pihak (Manager & SPV), dokumen PDF otomatis akan dikirim ke email intern bersangkutan.
              </div>
            </div>

            {/* Review Data */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold uppercase">Nama Karyawan</span>
                <span className="text-slate-800 font-black text-right">{confirmAccLeave.internName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold uppercase">Divisi</span>
                <span className="text-slate-800 font-black text-right">{confirmAccLeave.division}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold uppercase">Jenis Izin</span>
                <span className="text-slate-800 font-black uppercase text-right">{confirmAccLeave.type?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold uppercase">Tanggal Pengajuan</span>
                <span className="text-slate-800 font-black text-right">{fmt(confirmAccLeave.dateReq)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-bold uppercase">Alasan</span>
                <p className="text-slate-700 font-medium bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm italic">
                  "{confirmAccLeave.reason || 'Tidak ada keterangan.'}"
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Password Anda untuk ACC</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan password akun Anda..."
                className="w-full p-4 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 transition-all font-bold"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmAccLeave(null)}
                disabled={confirmLoading}
                className="flex-1 py-4 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 shrink-0"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAccLeave}
                disabled={confirmLoading}
                className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                {confirmLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" /> ACC
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body // Ini yang bikin modal lu nembus full layar!
      )}

      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageUrl={modalImage} />
    </div>
  );
};

export default Approval;
