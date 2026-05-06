import React, { useState, useEffect, useMemo } from "react";
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
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => {
        const show = p === 1 || p === total || Math.abs(p - page) <= 1;
        const dots = !show && (p === 2 || p === total - 1);
        if (!show && !dots) return null;
        if (dots) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold border shadow-sm transition-all ${p === page
              ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-blue-500/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {p}
          </button>
        );
      })}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all">
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────────────────── */
const InternTasks = () => {
  const { user } = useAuth();
  const currentUser = user ? {
    id:       user.id,
    name:     user.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.division?.name || "IT Support",
  } : { id: "1", name: "Kiel", division: "IT Support" };

  // Only intern/user role can submit tasks — guards UI action buttons
  const canSubmit = user?.role === 'intern' || user?.role === 'user';

  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("todo");   // "todo" | "history"
  const [historyTab,   setHistoryTab]   = useState("all");    // "all" | "completed" | "pending" | "revision"
  const [historyPage,  setHistoryPage]  = useState(1);
  const [search,       setSearch]       = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  /* ── Fetch ── */
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res  = await api.get('/daily-tasks');
      const data = res.data?.data || res.data || [];
      setTasks(data.map(t => {
        // Status mapping yang benar:
        // - "approved"  → selesai (completed)
        // - "rejected" / "revision" → perlu revisi
        // - "pending" + ada evidence_url → sudah dikirim, menunggu ACC
        // - "pending" + TIDAK ada evidence_url → belum dikerjakan (todo)
        let uiStatus = "todo";
        if (t.status === "approved") {
          uiStatus = "completed";
        } else if (t.status === "rejected" || t.status === "revision") {
          uiStatus = "revision";
        } else if (t.status === "pending" && t.evidence_url) {
          // Sudah submit bukti, menunggu persetujuan admin
          uiStatus = "pending";
        } else if (t.status === "pending" && !t.evidence_url) {
          // Belum dikerjakan sama sekali
          uiStatus = "todo";
        }

        return {
          id:            t.id,
          title:         t.taskTemplate?.title || t.taskTemplate?.task_name
                         || t.template?.title  || t.template?.task_name
                         || t.description      || "Tugas Harian",
          location:      "Kantor MCC",
          status:        uiStatus,
          rawStatus:     t.status,
          admin_notes:   t.reject_reason || "",
          // Tugas urgent = tidak punya template (di-assign manual oleh admin)
          is_urgent:     !t.template_id,
          photo:         t.evidence_url || null,
          description:   t.description || "",
          inviter_name:  t.assignedBy?.full_name || t.assigner?.full_name || "",
          tagged_users:  Array.isArray(t.confirmed_participants) ? t.confirmed_participants : [],
          due_date:      t.due_date,
          task_date:     t.task_date,
          assign_note:   t.assign_note || "",
        };
      }));
    } catch {
      toast.error("Gagal memuat logbook tugas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { setHistoryPage(1); }, [historyTab, search, activeTab]);

  /* ── All tasks split by type ── */
  const regularTasks   = tasks.filter(t => !t.is_urgent);
  const urgentTasks    = tasks.filter(t => t.is_urgent);

  /* ── Progress stats (all tasks) ── */
  const totalTasks     = tasks.length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const progressPct    = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  /* ── History ── */
  const allHistory = useMemo(() => {
    return tasks
      .filter(t => {
        const matchTab =
          historyTab === "all"      ? true :
          historyTab === "completed"? t.status === "completed" :
          historyTab === "pending"  ? (t.status === "pending" || t.status === "waiting_confirmation") :
          historyTab === "revision" ? t.status === "revision" : true;
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
      })
      .sort((a, b) => new Date(b.task_date || 0) - new Date(a.task_date || 0));
  }, [tasks, historyTab, search]);

  const totalPages   = Math.max(1, Math.ceil(allHistory.length / PAGE_SIZE));
  const pagedHistory = allHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  /* ── Counts for history tabs ── */
  const hCounts = useMemo(() => ({
    all:       tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending:   tasks.filter(t => t.status === "pending" || t.status === "waiting_confirmation").length,
    revision:  tasks.filter(t => t.status === "revision").length,
  }), [tasks]);

  /* ── Camera handlers ── */
  const handleOpenCamera = (task) => {
    if (!canSubmit) {
      toast.error("Hanya intern yang dapat mengirim laporan tugas.");
      return;
    }
    if (task.photo && task.status !== "revision") {
      toast.error("Bukti tugas telah tersegel. Tidak bisa diubah.");
      return;
    }
    setSelectedTask(task);
    setIsCameraOpen(true);
  };
  const handleCloseCamera = () => { setIsCameraOpen(false); setSelectedTask(null); };

  const handleSubmitReport = async (submittedData) => {
    const taskId = selectedTask?.id;
    if (!taskId) {
      toast.error("ID tugas tidak ditemukan.");
      return;
    }

    // submittedData sudah FormData dari LiveCameraModal
    if (!(submittedData instanceof FormData)) {
      toast.error("Format data tidak valid.");
      return;
    }

    try {
      // POST dengan FormData — axios otomatis set Content-Type: multipart/form-data
      await api.post(`/daily-tasks/${taskId}/submit`, submittedData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Laporan berhasil dikirim! Menunggu persetujuan admin.");
      handleCloseCamera();
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengirim laporan.";
      toast.error(msg);
      console.error("Submit error:", err);
    }
  };

  const handleConfirmTask = async (taskId) => {
    try {
      await api.put(`/daily-tasks/${taskId}/confirm`);
      toast.success("Berhasil konfirmasi tugas rekan!");
      fetchTasks();
    } catch { toast.error("Gagal mengkonfirmasi."); }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d.includes('T') ? d : d + 'T00:00:00')
      .toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const STATUS_BADGE = {
    completed:             { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-check-double",   label: "Selesai" },
    pending:               { cls: "bg-amber-100 text-amber-700 border-amber-200",       icon: "fa-hourglass-half", label: "Menunggu ACC" },
    waiting_confirmation:  { cls: "bg-amber-100 text-amber-700 border-amber-300",       icon: "fa-users",          label: "Menunggu Rekan" },
    revision:              { cls: "bg-rose-100 text-rose-700 border-rose-200",          icon: "fa-rotate-left",    label: "Perlu Revisi" },
    todo:                  { cls: "bg-slate-100 text-slate-600 border-slate-200",       icon: "fa-circle",         label: "Belum Dikerjakan" },
  };

  const HIST_TABS = [
    { id: "all",       label: "Semua",         count: hCounts.all },
    { id: "pending",   label: "Menunggu ACC",  count: hCounts.pending },
    { id: "completed", label: "Selesai",       count: hCounts.completed },
    { id: "revision",  label: "Revisi",        count: hCounts.revision },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-1 max-w-5xl mx-auto">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/50">
                <i className="fa-solid fa-clipboard-check text-xl" />
              </div>
              <div>
                <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest">Logbook Harian</span>
                <p className="text-white text-sm font-medium mt-0.5">Halo, {(currentUser.name).split(" ")[0]}! 👋</p>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-sky-200">
              Daily Tasks
            </h1>
            <p className="text-[13px] text-sky-100/70 font-medium border-l-[3px] border-sky-500/50 pl-4 max-w-lg">
              Selesaikan tugas dan lampirkan bukti. Cek riwayat di tab Riwayat Tugas.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-7 rounded-3xl w-full md:w-[300px] shrink-0 shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest mb-0.5">Progress Hari Ini</p>
                <p className="text-xs font-medium text-slate-400">{loading ? "…" : totalTasks} tugas hari ini</p>
              </div>
              <i className="fa-solid fa-chart-pie text-sky-400 text-lg" />
            </div>
            <h3 className="text-5xl font-black text-sky-400 leading-none tracking-tighter mb-3">{loading ? 0 : progressPct}%</h3>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-sky-500 to-sky-300 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[11px] font-medium text-white/60 mt-3 text-right">
              <span className="font-bold text-white">{loading ? "…" : completedCount}</span> dari {loading ? "…" : totalTasks} selesai
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN TABS ── */}
      <div className="flex items-center gap-2 px-1">
        {[
          { id: "todo",    label: "Tugas Aktif",   icon: "fa-list-check",       count: tasks.filter(t=>t.status!=='completed').length },
          { id: "history", label: "Riwayat Tugas", icon: "fa-clock-rotate-left", count: tasks.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
              activeTab === tab.id
                ? "bg-[#0b1437] text-white border-blue-900 shadow-lg shadow-blue-900/20 scale-105"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}>
            <i className={`fa-solid ${tab.icon}`} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: TUGAS HARI INI
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "todo" && (
        <div className="space-y-6">
          {/* Rutinitas */}
          <div className="bg-slate-50/50 p-3 sm:p-4 rounded-[2rem] border border-slate-100 shadow-inner">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200/60 pb-3 pl-2 pt-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-blue-500">
                <i className="fa-solid fa-desktop text-sm" />
              </div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Semua Tugas Rutin</h2>
            </div>
            <div className="flex flex-col gap-3">
              {loading ? (
                <p className="text-center text-sm font-bold text-slate-400 py-8">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />Memuat tugas…
                </p>
              ) : regularTasks.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fa-solid fa-mug-hot text-4xl text-slate-200 mb-3 block" />
                  <p className="text-sm font-bold text-slate-400">Tidak ada tugas rutinitas hari ini.</p>
                  <p className="text-xs text-slate-300 mt-1">Cek tab Riwayat Tugas untuk melihat tugas sebelumnya.</p>
                </div>
              ) : (
                regularTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i}
                    onOpenCameraModal={handleOpenCamera}
                    onConfirmTask={handleConfirmTask}
                    currentUserId={currentUser.id} />
                ))
              )}
            </div>
          </div>

          {/* Urgent */}
          {!loading && urgentTasks.length > 0 && (
            <div className="bg-rose-50/30 p-3 sm:p-4 rounded-[2rem] border border-rose-100 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 border-b border-rose-200/60 pb-3 pl-2 pt-1">
                <i className="fa-solid fa-bolt text-rose-500 animate-pulse text-lg" />
                <h2 className="text-sm font-black text-rose-600 uppercase tracking-widest">Tugas Tambahan (Urgent)</h2>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                {urgentTasks.map((task, i) => (
                  <InternTaskCard key={task.id} task={task} index={i}
                    onOpenCameraModal={handleOpenCamera}
                    onConfirmTask={handleConfirmTask}
                    currentUserId={currentUser.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: RIWAYAT TUGAS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">

          {/* Sub-tabs + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex gap-2 flex-wrap">
              {HIST_TABS.map(tab => (
                <button key={tab.id} onClick={() => setHistoryTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-bold transition-all border whitespace-nowrap ${
                    historyTab === tab.id
                      ? "bg-[#0b1437] text-white border-blue-900 shadow-md scale-105"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      historyTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-52 shrink-0">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <input type="text" placeholder="Cari tugas…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            </div>
          </div>

          {/* Info bar */}
          {!loading && allHistory.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-slate-400">
                Menampilkan <span className="text-slate-700">
                  {Math.min((historyPage - 1) * PAGE_SIZE + 1, allHistory.length)}–{Math.min(historyPage * PAGE_SIZE, allHistory.length)} dari {allHistory.length}
                </span> riwayat
              </p>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {PAGE_SIZE} per halaman
              </span>
            </div>
          )}

          {/* History cards */}
          {loading ? (
            <div className="space-y-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-4 w-48 bg-slate-200 rounded" /><div className="h-3 w-32 bg-slate-100 rounded" /></div>
                  <div className="w-24 h-7 bg-slate-100 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : allHistory.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-inbox text-5xl text-slate-200 mb-4 block" />
              <h3 className="text-slate-500 font-bold text-lg">{search ? "Tidak ditemukan" : "Belum ada riwayat"}</h3>
              <p className="text-slate-400 text-sm mt-1">{search ? "Coba kata kunci lain." : "Riwayat tugas akan muncul di sini."}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedHistory.map(task => {
                  const badge = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
                  return (
                    <div key={task.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden ${
                        task.status === 'revision'   ? 'border-rose-200 bg-rose-50/30' :
                        task.status === 'completed'  ? 'border-emerald-200 bg-emerald-50/20' :
                        task.status === 'pending' || task.status === 'waiting_confirmation' ? 'border-amber-200 bg-amber-50/20' :
                        'border-slate-200'
                      }`}>
                      {/* Color bar left */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl ${
                        task.status==='completed'?'bg-emerald-400':task.status==='revision'?'bg-rose-400':
                        task.status==='pending'||task.status==='waiting_confirmation'?'bg-amber-400':'bg-slate-300'}`} />

                      <div className="flex items-start gap-4 flex-1 min-w-0 pl-3">
                        {/* Status icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.cls}`}>
                          <i className={`fa-solid ${badge.icon} text-sm`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-bold text-slate-800 text-sm leading-tight truncate ${task.status==='completed'?'line-through text-slate-500':''}`}>
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-medium">
                              <i className="fa-regular fa-calendar mr-1" />{fmtDate(task.task_date)}
                            </span>
                            {task.due_date && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                <i className="fa-solid fa-flag mr-1" />Deadline {fmtDate(task.due_date)}
                              </span>
                            )}
                          </div>
                          {task.description && task.status !== 'todo' && (
                            <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">"{task.description}"</p>
                          )}
                          {task.status === 'revision' && task.admin_notes && (
                            <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                              <i className="fa-solid fa-circle-exclamation" />{task.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-3 sm:pl-0 flex-wrap justify-end">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {task.status === 'revision' && (
                          <button onClick={() => handleOpenCamera(task)}
                            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
                            <i className="fa-solid fa-wrench" /> Revisi
                          </button>
                        )}
                        {task.photo && (
                          <a href={task.photo} target="_blank" rel="noreferrer"
                            className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 flex items-center justify-center transition-colors"
                            title="Lihat bukti">
                            <i className="fa-solid fa-image text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pager page={historyPage} total={totalPages} onChange={setHistoryPage} />
            </>
          )}
        </div>
      )}

      {/* ── CAMERA MODAL ── */}
      {isCameraOpen && selectedTask && (
        <LiveCameraModal task={selectedTask} currentUser={currentUser}
          onClose={handleCloseCamera} onSubmit={handleSubmitReport} />
      )}
    </div>
  );
};

export default InternTasks;