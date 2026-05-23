import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

const S = {
  pending: {
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    icon: "fa-clock",
    label: "Menunggu ACC",
  },
  approved: {
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: "fa-check-circle",
    label: "Di-ACC ✓",
  },
  rejected: {
    cls: "bg-rose-50 text-rose-600 border-rose-200",
    icon: "fa-rotate-left",
    label: "Perlu Revisi",
  },
  revision: {
    cls: "bg-rose-50 text-rose-600 border-rose-200",
    icon: "fa-rotate-left",
    label: "Perlu Revisi",
  },
};

const fmt = (b) =>
  b < 1048576
    ? (b / 1024).toFixed(1) + " KB"
    : (b / 1048576).toFixed(1) + " MB";
const isImg = (u = "") => /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(u);

/* ── Pagination Component ─────────────────────────────────────────────────── */
const Pager = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => {
        if (p !== 1 && p !== total && Math.abs(p - page) > 1) {
          return p === 2 || p === total - 1 ? (
            <span key={p} className="text-slate-400 text-sm">
              …
            </span>
          ) : null;
        }
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
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const InternLogbook = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeModal, setActiveModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [chosenFile, setChosenFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  /* ── Fetch ALL tasks (no date filter) so intern sees full history ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/daily-tasks");
      setTasks(res.data?.data || res.data || []);
    } catch {
      toast.error("Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  /* ── Modal ── */
  const openModal = (task) => {
    setActiveModal(task);
    setDescription(task.description || "");
    setChosenFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };
  const closeModal = () => {
    setActiveModal(null);
    setChosenFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File maksimal 20 MB");
      return;
    }
    setChosenFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!activeModal) return;
    if (!description.trim()) {
      toast.error("Isi catatan laporan");
      return;
    }
    setSubmitting(true);
    const tid = toast.loading("Mengirim laporan…");
    try {
      const fd = new FormData();
      fd.append("description", description);
      if (chosenFile) fd.append("evidence_url", chosenFile);
      await api.post(`/daily-tasks/${activeModal.id}/submit`, fd);
      toast.success("✅ Laporan dikirim! Menunggu ACC Admin.", { id: tid });
      closeModal();
      fetchTasks();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})[0]?.[0] ||
        "Gagal mengirim";
      toast.error(msg, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = (t) =>
    t.taskTemplate?.title ??
    t.template?.title ??
    t.description ??
    "Tugas Harian";
  const fmtDate = (d) => {
    if (!d) return "—";
    const raw = d.includes("T") ? d : d + "T00:00:00";
    return new Date(raw).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ── Counts ── */
  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    approved: tasks.filter((t) => t.status === "approved").length,
    rejected: tasks.filter(
      (t) => t.status === "rejected" || t.status === "revision",
    ).length,
  };

  /* ── Filter + Search + Paginate ── */
  const filtered = tasks
    .filter((t) => {
      const matchTab =
        activeTab === "all"
          ? true
          : activeTab === "pending"
            ? t.status === "pending"
            : activeTab === "approved"
              ? t.status === "approved"
              : activeTab === "rejected"
                ? t.status === "rejected" || t.status === "revision"
                : true;
      const matchSearch =
        !search ||
        getTitle(t).toLowerCase().includes(search.toLowerCase()) ||
        (t.task_date || "").includes(search);
      return matchTab && matchSearch;
    })
    .sort(
      (a, b) =>
        new Date(b.task_date || b.created_at) -
        new Date(a.task_date || a.created_at),
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS = [
    {
      id: "all",
      label: "Semua",
      count: counts.all,
      color: "text-slate-600",
      badge: "bg-slate-100 text-slate-600",
    },
    {
      id: "pending",
      label: "Menunggu ACC",
      count: counts.pending,
      color: "text-amber-600",
      badge: "bg-amber-100 text-amber-600",
    },
    {
      id: "approved",
      label: "Di-ACC",
      count: counts.approved,
      color: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "rejected",
      label: "Perlu Revisi",
      count: counts.rejected,
      color: "text-rose-600",
      badge: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 pt-8 px-2 max-w-4xl mx-auto">
      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-8 rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-book-open-reader text-white" />
              </div>
              <span className="text-sky-300 text-[10px] font-black uppercase tracking-[0.2em]">
                Daily Logbook
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">
              Riwayat Tugas Saya
            </h1>
            <p className="text-sky-100/70 text-sm font-medium">
              Lihat semua tugas, status ACC, dan kirim laporan.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            {[
              {
                n: counts.approved,
                lbl: "Di-ACC",
                cls: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
              },
              {
                n: counts.pending,
                lbl: "Pending",
                cls: "bg-amber-500/10 border-amber-500/20 text-amber-300",
              },
              {
                n: counts.rejected,
                lbl: "Revisi",
                cls: "bg-rose-500/10 border-rose-500/20 text-rose-300",
              },
            ].map((c) => (
              <div
                key={c.lbl}
                className={`flex flex-col items-center border rounded-2xl px-4 py-2.5 text-center ${c.cls}`}
              >
                <span className="text-2xl font-black">{c.n}</span>
                <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">
                  {c.lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS + SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {/* Scrollable tabs on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? "bg-blue-950 text-white border-blue-900 shadow-md shadow-blue-900/20 scale-105"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-white/20 text-white" : tab.badge
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56 shrink-0">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          <input
            type="text"
            placeholder="Cari tugas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* ── INFO BAR ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-400">
            Menampilkan{" "}
            <span className="text-slate-700">
              {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} dari{" "}
              {filtered.length}
            </span>{" "}
            tugas
          </p>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {PAGE_SIZE} per halaman
          </span>
        </div>
      )}

      {/* ── TASK LIST ── */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[2rem] border border-slate-200 p-5 animate-pulse flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
              <div className="w-24 h-8 bg-slate-100 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-16 text-center">
          <i className="fa-solid fa-inbox text-5xl text-slate-200 mb-4 block" />
          <h3 className="text-slate-500 font-bold text-lg">
            {search
              ? "Tidak ada hasil pencarian"
              : "Tidak ada tugas di kategori ini"}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Coba kata kunci lain." : "Coba pilih tab lain."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paged.map((task) => {
            const st = S[task.status] || S.pending;
            const canSubmit = task.status !== "approved";
            return (
              <div
                key={task.id}
                className="bg-white rounded-[2rem] border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Status icon */}
                  <div
                    className={`w-13 h-13 rounded-2xl p-3 flex items-center justify-center text-xl shrink-0 border ${st.cls}`}
                  >
                    <i className={`fa-solid ${st.icon}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 text-base leading-tight truncate">
                      {getTitle(task)}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-[11px] font-medium text-slate-400">
                        <i className="fa-regular fa-calendar mr-1" />
                        {fmtDate(task.task_date)}
                      </span>
                      {task.evaluated_by && task.status === "approved" && (
                        <span className="text-[11px] font-bold text-emerald-600">
                          <i className="fa-solid fa-user-check mr-1" />
                          Di-ACC Admin
                        </span>
                      )}
                    </div>

                    {/* Catatan & bukti jika sudah dikerjakan */}
                    {task.description && (
                      <p className="text-[11px] text-slate-500 italic mt-1.5 line-clamp-2 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                        "{task.description}"
                      </p>
                    )}
                    {(task.status === "rejected" ||
                      task.status === "revision") &&
                      task.reject_reason && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1">
                          <i className="fa-solid fa-circle-exclamation" />
                          {task.reject_reason}
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-col sm:items-end justify-end">
                  {/* Status badge */}
                  <span
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${st.cls}`}
                  >
                    {st.label}
                  </span>

                  <div className="flex items-center gap-2">
                    {canSubmit && (
                      <button
                        onClick={() => openModal(task)}
                        className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5 whitespace-nowrap ${
                          task.status === "rejected" ||
                          task.status === "revision"
                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                            : task.evidence_url
                              ? "bg-slate-600 hover:bg-slate-700 shadow-slate-500/20"
                              : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        }`}
                      >
                        <i
                          className={`fa-solid ${task.evidence_url ? "fa-pen" : "fa-upload"}`}
                        />
                        {task.status === "rejected" ||
                        task.status === "revision"
                          ? "Revisi"
                          : task.evidence_url
                            ? "Edit"
                            : "Kerjakan"}
                      </button>
                    )}
                    {task.evidence_url && (
                      <a
                        href={task.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 flex items-center justify-center transition-colors"
                        title="Lihat bukti"
                      >
                        <i
                          className={`fa-solid ${isImg(task.evidence_url) ? "fa-image" : "fa-file"} text-xs`}
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Pager page={page} total={totalPages} onChange={setPage} />
        </div>
      )}

      {/* ── SUBMIT MODAL ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">
                  Submit Laporan
                </p>
                <h3 className="font-black text-slate-800 text-base line-clamp-1">
                  {getTitle(activeModal)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {fmtDate(activeModal.task_date)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors flex items-center justify-center shadow-sm"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Revision notice */}
              {(activeModal.status === "rejected" ||
                activeModal.status === "revision") &&
                activeModal.reject_reason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">
                        Catatan Admin
                      </p>
                      <p className="text-sm text-rose-600 font-medium">
                        {activeModal.reject_reason}
                      </p>
                    </div>
                  </div>
                )}

              {/* File Upload */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                  Upload Bukti{" "}
                  <span className="text-[9px] normal-case tracking-normal font-medium text-slate-400">
                    (Foto/PDF/Dokumen — Maks 20 MB)
                  </span>
                </label>

                {chosenFile && (
                  <div className="mb-3 rounded-2xl border-2 border-blue-400 bg-blue-50/50 p-4 flex items-center gap-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="w-16 h-16 object-cover rounded-xl border border-blue-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-file text-xl text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {chosenFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {fmt(chosenFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setChosenFile(null);
                        setPreviewUrl(null);
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center hover:bg-rose-100"
                    >
                      <i className="fa-solid fa-xmark text-xs" />
                    </button>
                  </div>
                )}

                {!chosenFile && activeModal.evidence_url && (
                  <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                    <i className="fa-solid fa-check-circle text-emerald-500 text-sm" />
                    <p className="text-xs text-emerald-700 font-bold flex-1">
                      Sudah ada bukti. Pilih file baru untuk mengganti.
                    </p>
                    <a
                      href={activeModal.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 shrink-0"
                    >
                      Lihat →
                    </a>
                  </div>
                )}

                <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-300 group-hover:text-blue-500 transition-colors mb-1.5" />
                  <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600">
                    {chosenFile ? "Ganti File" : "Klik untuk pilih file"}
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    className="sr-only"
                    onChange={handleFile}
                  />
                </label>

                <label className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer">
                  <i className="fa-solid fa-camera" /> Buka Kamera HP
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleFile}
                  />
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                  Catatan Laporan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan apa yang sudah dikerjakan…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" /> Mengirim…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" /> Kirim Laporan ke
                    Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternLogbook;
