import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
        const isEdge = p === 1 || p === totalPages;
        const isNear = Math.abs(p - page) <= 1;
        if (!isEdge && !isNear) {
          if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-400 text-sm px-1">…</span>;
          return null;
        }
        return (
          <button
            key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all shadow-sm ${
              p === page
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20 scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >{p}</button>
        );
      })}

      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

const Approval = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const [loading, setLoading]     = useState(true);
  const [pendingTasks, setPendingTasks]   = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [rejectState, setRejectState]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [taskPage, setTaskPage]   = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [searchTask, setSearchTask]   = useState("");
  const [searchLeave, setSearchLeave] = useState("");

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.all([
        api.get('/daily-tasks'),
        api.get('/exceptions'),
      ]);
      const tData = tRes.data?.data || tRes.data || [];
      const lData = lRes.data?.data || lRes.data || [];

      setPendingTasks(
        tData
          .filter(t => t.status === 'pending' && t.submitted_at)
          .sort((a, b) => {
            // Urutkan dari yang mengumpulkan paling awal (tertua ke terbaru)
            const aTime = a.submitted_at ? new Date(a.submitted_at) : new Date(a.created_at);
            const bTime = b.submitted_at ? new Date(b.submitted_at) : new Date(b.created_at);
            return aTime - bTime;
          })
          .map(t => ({
            ...t,
            internName:          t.uploader?.full_name || "Intern",
            division:            t.uploader?.division?.name || t.division?.name || "—",
            taskTitle:           t.taskTemplate?.title || t.template?.title || "Tugas Harian",
            notes:               t.description,
            photo:               t.evidence_url,
            submittedAt:         t.submitted_at || t.created_at, // ← gunakan submitted_at jika ada
            participants_detail: t.participants_detail || [],
          }))
      );
      setPendingLeaves(
        lData.filter(l => l.status === 'pending').map(l => ({
          ...l,
          internName: l.user?.full_name || "Intern",
          division:   l.user?.division?.name || "—",
          reason:     l.description,
          dateReq:    l.permission_date,
          proof:      l.evidence_url,
        }))
      );
    } catch {
      toast.error("Gagal memuat data approval");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  // reset page on tab/search change
  useEffect(() => { setTaskPage(1); }, [activeTab, searchTask]);
  useEffect(() => { setLeavePage(1); }, [activeTab, searchLeave]);

  // ── filtered + paginated ────────────────────────────────────────────────
  const filteredTasks = pendingTasks.filter(t =>
    !searchTask || t.internName.toLowerCase().includes(searchTask.toLowerCase()) ||
    t.taskTitle.toLowerCase().includes(searchTask.toLowerCase())
  );
  const filteredLeaves = pendingLeaves.filter(l =>
    !searchLeave || l.internName.toLowerCase().includes(searchLeave.toLowerCase()) ||
    l.type?.includes(searchLeave.toLowerCase())
  );
  const taskTotalPages  = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const leaveTotalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const pagedTasks  = filteredTasks.slice((taskPage - 1) * PAGE_SIZE, taskPage * PAGE_SIZE);
  const pagedLeaves = filteredLeaves.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE);

  // ── handlers ──────────────────────────────────────────────────────────
  const handleActionTask = async (id, action) => {
    if (action === 'reject') { setRejectState({ id, type: 'task' }); setRejectReason(""); return; }
    try {
      await api.put(`/daily-tasks/${id}`, { status: 'approved' });
      toast.success("✅ Tugas berhasil di-ACC");
      fetchApprovals();
    } catch { toast.error("Gagal memproses tugas"); }
  };

  const handleActionLeave = async (id, action) => {
    if (action === 'reject') { setRejectState({ id, type: 'leave' }); setRejectReason(""); return; }
    try {
      await api.put(`/exceptions/${id}`, { status: 'approved' });
      toast.success("✅ Izin berhasil di-ACC");
      fetchApprovals();
    } catch { toast.error("Gagal memproses izin"); }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) { toast.error("Masukkan alasan penolakan"); return; }
    try {
      if (rejectState.type === 'task')
        await api.put(`/daily-tasks/${rejectState.id}`, { status: 'rejected', reject_reason: rejectReason });
      else
        await api.put(`/exceptions/${rejectState.id}`, { status: 'rejected', description: rejectReason });
      toast.success("Berhasil diproses");
      setRejectState(null);
      fetchApprovals();
    } catch { toast.error("Gagal memproses penolakan"); }
  };

  // Format tanggal saja
  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";

  // Format waktu submit: "HH:mm WIB" untuk sorting transparency
  const fmtTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }) + " WIB";
  };

  const exStyle = (type) => ({
    swap_shift:  { icon: "fa-code-compare",      color: "text-blue-500",    bg: "bg-blue-50",    bar: "bg-blue-500",    label: "Swap Shift" },
    sakit:       { icon: "fa-house-medical",      color: "text-rose-500",    bg: "bg-rose-50",    bar: "bg-rose-500",    label: "Sakit" },
    izin:        { icon: "fa-envelope-open-text", color: "text-amber-500",   bg: "bg-amber-50",   bar: "bg-amber-500",   label: "Izin" },
    tugas_luar:  { icon: "fa-briefcase",          color: "text-emerald-500", bg: "bg-emerald-50", bar: "bg-emerald-500", label: "Tugas Luar" },
  }[type] || { icon: "fa-envelope", color: "text-slate-500", bg: "bg-slate-50", bar: "bg-slate-500", label: "Pengajuan" });

  const tabs = [
    { id: "tasks",  label: "Laporan Tugas",  icon: "fa-list-check",         count: filteredTasks.length },
    { id: "leaves", label: "Pengajuan Izin", icon: "fa-envelope-open-text", count: filteredLeaves.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="bg-blue-950 rounded-[2rem] p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Approval Center</span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mt-1">Validasi &amp; ACC</h1>
            <p className="text-blue-200/70 text-sm font-medium mt-1">Kelola antrean tugas dan pengajuan izin anak divisi.</p>
          </div>
          <button onClick={fetchApprovals} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all shrink-0">
            <i className="fa-solid fa-arrows-rotate" /> Refresh
          </button>
        </div>
      </div>

      {/* ── TABS + SEARCH ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-950 text-white shadow-xl shadow-blue-900/20 scale-105 border border-blue-900"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <i className={`fa-solid ${tab.icon}`} /> {tab.label}
              {tab.count > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full border border-rose-600">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === "tasks" ? "Cari intern atau tugas…" : "Cari intern…"}
            value={activeTab === "tasks" ? searchTask : searchLeave}
            onChange={e => activeTab === "tasks" ? setSearchTask(e.target.value) : setSearchLeave(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
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
                : `${Math.min((leavePage - 1) * PAGE_SIZE + 1, filteredLeaves.length)}–${Math.min(leavePage * PAGE_SIZE, filteredLeaves.length)} dari ${filteredLeaves.length}`}
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
              {rejectState.type === 'task' ? 'Kembalikan untuk Revisi' : 'Tolak Pengajuan Izin'}
            </h3>
            <p className="text-slate-500 text-sm mb-5">Tulis alasan yang akan dilihat intern.</p>
            <textarea
              rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Contoh: Foto bukti tidak terlihat jelas, harap upload ulang..."
              className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-400 resize-none bg-slate-50"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRejectState(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleConfirmReject} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all">
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
                <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-200" /><div className="flex-1 space-y-1.5"><div className="h-3 w-28 bg-slate-200 rounded" /><div className="h-2 w-20 bg-slate-100 rounded" /></div></div>
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="grid grid-cols-2 gap-3"><div className="h-10 bg-slate-100 rounded-xl" /><div className="h-10 bg-emerald-50 rounded-xl" /></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-mug-hot text-4xl text-slate-300 mb-3 block" />
              <h3 className="text-slate-500 font-bold">{searchTask ? "Tidak ditemukan hasil pencarian." : "Semua tugas sudah diperiksa. Aman!"}</h3>
              <p className="text-slate-400 text-sm mt-1">{searchTask ? "Coba kata kunci lain." : "Tidak ada tugas pending saat ini."}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pagedTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                    {/* Card Header */}
                    <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                          {task.internName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{task.internName}</h4>
                          <p className="text-[10px] font-medium text-slate-400">{task.division}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 shadow-sm shrink-0 block">{fmtTime(task.submittedAt)}</span>
                        {task.submitted_at && (
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 flex items-center gap-1 justify-end">
                            <i className="fa-solid fa-clock-rotate-left" /> Waktu Kirim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1">
                      <h5 className="font-black text-slate-800 mb-3 text-sm">{task.taskTitle}</h5>
                      <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-inner">
                        {task.photo ? (
                          task.photo.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
                            ? <img src={task.photo} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <a href={task.photo} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-blue-500 hover:text-blue-600">
                                <i className="fa-solid fa-file text-3xl" />
                                <span className="text-[10px] font-bold uppercase">Lihat File</span>
                              </a>
                        ) : (
                          <div className="text-center text-slate-300">
                            <i className="fa-solid fa-image-slash text-3xl mb-1 block" />
                            <p className="text-[10px] font-bold uppercase">Tanpa Bukti</p>
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium italic leading-relaxed line-clamp-3">
                        "{task.notes || 'Tidak ada catatan laporan.'}"
                      </p>

                      {/* Peserta / Rekan Kerja */}
                      {task.participants_detail?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-users text-blue-400"></i> Dikerjakan Bersama
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
                      <button onClick={() => handleActionTask(task.id, 'reject')} className="py-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold shadow-sm transition-all">
                        <i className="fa-solid fa-xmark mr-1" /> Revisi
                      </button>
                      <button onClick={() => handleActionTask(task.id, 'acc')} className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                        <i className="fa-solid fa-check mr-1" /> ACC
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination page={taskPage} totalPages={taskTotalPages} onChange={setTaskPage} />
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
                <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-slate-200" /><div className="flex-1 space-y-1.5"><div className="h-3 w-32 bg-slate-200 rounded" /><div className="h-2 w-20 bg-slate-100 rounded" /></div></div>
                  <div className="h-20 bg-slate-100 rounded-xl" />
                  <div className="grid grid-cols-2 gap-3"><div className="h-10 bg-emerald-50 rounded-xl" /><div className="h-10 bg-slate-100 rounded-xl" /></div>
                </div>
              ))}
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
              <i className="fa-solid fa-envelope-circle-check text-4xl text-slate-300 mb-3 block" />
              <h3 className="text-slate-500 font-bold">{searchLeave ? "Tidak ditemukan." : "Tidak ada pengajuan izin pending."}</h3>
              <p className="text-slate-400 text-sm mt-1">Semua pengajuan sudah diproses.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pagedLeaves.map(leave => {
                  const st = exStyle(leave.type);
                  return (
                    <div key={leave.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row group hover:border-blue-200 hover:shadow-lg transition-all duration-300 relative">
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-[2rem] ${st.bar}`} />
                      <div className="p-6 pl-8 flex-1 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${st.bg} ${st.color}`}>
                              <i className={`fa-solid ${st.icon}`} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-sm leading-none mb-1">{leave.internName}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.division}</p>
                            </div>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${st.bg} ${st.color}`}>{st.label}</span>
                          <p className="text-[13px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic line-clamp-3">
                            "{leave.reason || 'Tidak ada keterangan.'}"
                          </p>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Pengajuan</p>
                          <p className="text-xs font-black text-slate-700">{fmt(leave.dateReq)}</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-44 bg-slate-50/50 p-5 flex flex-col shrink-0 justify-between">
                        <div className="flex-1 flex flex-col items-center justify-center mb-4">
                          {leave.proof ? (
                            <a href={leave.proof} target="_blank" rel="noreferrer" className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden block relative group/img shadow-inner">
                              <img src={leave.proof} alt="Bukti" className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <i className="fa-solid fa-magnifying-glass-plus text-white text-xl" />
                              </div>
                            </a>
                          ) : (
                            <div className="text-center text-slate-300">
                              <i className="fa-solid fa-file-circle-xmark text-3xl mb-1 block" />
                              <p className="text-[10px] font-bold uppercase">Tanpa Bukti</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleActionLeave(leave.id, 'acc')} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                            <i className="fa-solid fa-check mr-1" /> ACC
                          </button>
                          <button onClick={() => handleActionLeave(leave.id, 'reject')} className="w-full py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all">
                            Tolak
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination page={leavePage} totalPages={leaveTotalPages} onChange={setLeavePage} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Approval;