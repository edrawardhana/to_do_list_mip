import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import InternTaskCard from "../../components/ui/InternTaskCard";
import LiveCameraModal from "../../components/ui/LiveCameraModal";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

/* ── Pagination ─────────────────────────────────────────────────────────── */
const Pager = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => {
        const show = p === 1 || p === total || Math.abs(p - page) <= 1;
        const dots = !show && (p === 2 || p === total - 1);
        if (!show && !dots) return null;
        if (dots) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold border shadow-sm transition-all ${
              p === page
                ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-blue-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────────────────── */
const InternTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient(); // Panggil mesin pembersih cache

  const currentUser = user
    ? {
        id: user.id,
        name: user.full_name || user.email?.split("@")[0] || "Anak Magang",
        division: user.division?.name || "IT Support",
      }
    : { id: "1", name: "Intern", division: "IT Support" };

  const canSubmit = user?.role === "intern";

  const [activeTab, setActiveTab] = useState("todo");
  const [historyTab, setHistoryTab] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  /* ── TANSTACK QUERY: Auto Fetch & Cache ── */
  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ["dailyTasks"],
    queryFn: async () => {
      const res = await api.get("/daily-tasks");
      const data = res.data?.data || res.data || [];
      return data.map((t) => {
        let uiStatus = "todo";
        if (t.status === "approved") {
          uiStatus = "completed";
        } else if (t.status === "rejected" || t.status === "revision") {
          uiStatus = "revision";
        } else if (t.status === "waiting_confirmation") {
          uiStatus = "waiting_confirmation";
        } else if (t.status === "pending" && t.evidence_url) {
          uiStatus = "pending";
        } else if (t.status === "pending" && !t.evidence_url) {
          uiStatus = "todo";
        }

        return {
          ...t,
          id: t.id,
          title: t.taskTemplate?.title || t.taskTemplate?.task_name || t.template?.title || t.template?.task_name || t.description || "Tugas Harian",
          location: "Kantor MCC",
          status: uiStatus,
          rawStatus: t.status,
          admin_notes: t.reject_reason || "",
          is_urgent: !t.template_id,
          photo: t.evidence_url || null,
          description: t.description || "",
          inviter_name: t.assignedBy?.full_name || t.assigner?.full_name || "",
          tagged_users: Array.isArray(t.confirmed_participants) ? t.confirmed_participants : [],
          due_date: t.due_date,
          task_date: t.task_date,
          assign_note: t.assign_note || "",
          start_time: t.start_time || t.taskTemplate?.start_time || null,
          end_time: t.end_time || t.taskTemplate?.end_time || null,
          reminder_time: t.reminder_time || t.taskTemplate?.reminder_time || null,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // Data tahan 5 menit di memori
  });

  const regularTasks = tasks.filter((t) => !t.is_urgent);
  const urgentTasks = tasks.filter((t) => t.is_urgent);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const allHistory = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchTab = historyTab === "all" ? true : historyTab === "completed" ? t.status === "completed" : historyTab === "pending" ? t.status === "pending" || t.status === "waiting_confirmation" : historyTab === "revision" ? t.status === "revision" : true;
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
      })
      .sort((a, b) => new Date(b.task_date || 0) - new Date(a.task_date || 0));
  }, [tasks, historyTab, search]);

  const totalPages = Math.max(1, Math.ceil(allHistory.length / PAGE_SIZE));
  const pagedHistory = allHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const hCounts = useMemo(() => ({
      all: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending" || t.status === "waiting_confirmation").length,
      revision: tasks.filter((t) => t.status === "revision").length,
  }), [tasks]);

  const handleOpenCamera = (task) => {
    if (!canSubmit) return toast.error("Hanya intern yang dapat mengirim laporan tugas.");
    if (task.photo && task.status !== "revision") return toast.error("Bukti tugas telah tersegel. Tidak bisa diubah.");
    setSelectedTask(task);
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setSelectedTask(null);
  };

  const handleSubmitReport = async (submittedData) => {
    const taskId = selectedTask?.id;
    if (!taskId) return toast.error("ID tugas tidak ditemukan.");
    if (!(submittedData instanceof FormData)) return toast.error("Format data tidak valid.");

    try {
      await api.post(`/daily-tasks/${taskId}/submit`, submittedData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Laporan berhasil dikirim! Menunggu persetujuan admin.");
      handleCloseCamera();
      // TANSTACK QUERY: Panggil invalidasi untuk me-refresh data tanpa reload browser!
      queryClient.invalidateQueries(["dailyTasks"]); 
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengirim laporan.";
      toast.error(msg);
    }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const STATUS_BADGE = {
    completed: { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-check-double", label: "Selesai" },
    pending: { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: "fa-hourglass-half", label: "Menunggu ACC" },
    waiting_confirmation: { cls: "bg-amber-100 text-amber-700 border-amber-300", icon: "fa-users", label: "Menunggu Rekan" },
    revision: { cls: "bg-rose-100 text-rose-700 border-rose-200", icon: "fa-rotate-left", label: "Perlu Revisi" },
    todo: { cls: "bg-slate-100 text-slate-600 border-slate-200", icon: "fa-circle", label: "Belum Dikerjakan" },
  };

  const HIST_TABS = [
    { id: "all", label: "Semua", count: hCounts.all },
    { id: "pending", label: "Menunggu ACC", count: hCounts.pending },
    { id: "completed", label: "Selesai", count: hCounts.completed },
    { id: "revision", label: "Revisi", count: hCounts.revision },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-1 max-w-5xl mx-auto">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 sm:p-8 md:p-10 rounded-[2.5rem] text-white shadow-lg border border-blue-400 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/30 shrink-0">
                <i className="fa-solid fa-clipboard-check text-lg sm:text-xl" />
              </div>
              <div><span className="text-sky-50 text-[10px] font-black uppercase tracking-widest">Logbook Harian</span></div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 sm:mb-3 text-white">Daily Tasks</h1>
            <p className="text-xs sm:text-[13px] md:text-sm text-blue-50/90 font-medium border-l-[3px] border-white/50 pl-3 sm:pl-4 max-w-lg leading-relaxed mb-6 sm:mb-8">
              Selesaikan tugas dan lampirkan bukti. Pantau progress harianmu dan cek riwayat di tab sebelah kanan.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {[{ id: "todo", label: "Tugas Aktif", icon: "fa-list-check", count: tasks.filter((t) => t.status !== "completed").length }, { id: "history", label: "Riwayat Tugas", icon: "fa-clock-rotate-left", count: tasks.length }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 border backdrop-blur-md ${
                    activeTab === tab.id ? "bg-white text-blue-600 border-white shadow-xl scale-105" : "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30"
                  }`}
                >
                  <i className={`fa-solid ${tab.icon}`} />
                  {tab.label}
                  {tab.count > 0 && <span className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-white/20 text-white"}`}>{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-7 rounded-3xl w-full lg:w-[300px] shrink-0 shadow-xl transition-all duration-300 hover:bg-white/15">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-blue-50 uppercase tracking-widest mb-0.5">Progress Hari Ini</p>
                <p className="text-xs font-medium text-white/70">{loading ? "…" : totalTasks} tugas hari ini</p>
              </div>
              <i className="fa-solid fa-chart-pie text-white/80 text-lg" />
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tighter mb-3">{loading ? 0 : progressPct}%</h3>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-white/60 mt-3 text-right"><span className="font-bold text-white">{loading ? "…" : completedCount}</span> dari {loading ? "…" : totalTasks} selesai</p>
          </div>
        </div>
      </div>

      {/* TUGAS HARI INI */}
      {activeTab === "todo" && (
        <div className="space-y-6 lg:space-y-8 max-w-5xl mx-auto mt-6">       
          {!loading && urgentTasks.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-blue-200 shadow-sm shadow-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 border-b border-blue-100 pb-3 pl-2 pt-1">
                <i className="fa-solid fa-bolt text-rose-500 animate-pulse text-lg" /><h2 className="text-sm font-black text-rose-600 uppercase tracking-widest">Tugas Tambahan (Urgent)</h2>
              </div>
              <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
                {urgentTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i} onOpenCameraModal={handleOpenCamera} currentUserId={currentUser.id} />
                ))}
              </div>
            </div>
          )}
          <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-blue-100 shadow-sm shadow-blue-100/50">
            <div className="flex items-center gap-3 mb-4 border-b border-blue-50 pb-3 pl-2 pt-1"><h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Semua Tugas Rutin</h2></div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {loading ? (
                <p className="text-center text-sm font-bold text-slate-400 py-8"><i className="fa-solid fa-spinner fa-spin mr-2" /> Memuat tugas…</p>
              ) : regularTasks.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fa-solid fa-mug-hot text-4xl text-slate-200 mb-3 block" />
                  <p className="text-sm font-bold text-slate-400">Tidak ada tugas rutinitas hari ini.</p>
                </div>
              ) : (
                regularTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i} onOpenCameraModal={handleOpenCamera} currentUserId={currentUser.id} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RIWAYAT TUGAS */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex gap-2 flex-wrap">
              {HIST_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setHistoryTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-bold transition-all border whitespace-nowrap ${historyTab === tab.id ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-blue-400 shadow-lg scale-105" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-500"}`}>
                  {tab.label}
                  {tab.count > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${historyTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
             <p className="text-center text-sm font-bold text-slate-400 py-8"><i className="fa-solid fa-spinner fa-spin mr-2" /> Memuat riwayat…</p>
          ) : allHistory.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-inbox text-5xl text-slate-200 mb-4 block" />
              <h3 className="text-slate-500 font-bold text-lg">Belum ada riwayat</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {pagedHistory.map((task) => {
                const badge = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
                return (
                  <div key={task.id} className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden border-slate-200`}>
                    <div className="flex items-start gap-4 flex-1 min-w-0 pl-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.cls}`}><i className={`fa-solid ${badge.icon} text-sm`} /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 mt-0.5"><span className="text-[11px] text-slate-400 font-medium">{fmtDate(task.task_date)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CAMERA MODAL */}
      {isCameraOpen && selectedTask && (
        <LiveCameraModal task={selectedTask} currentUser={currentUser} onClose={handleCloseCamera} onSubmit={handleSubmitReport} />
      )}
    </div>
  );
};

export default InternTasks;