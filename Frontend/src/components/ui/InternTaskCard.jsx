import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import MIPTopLogo from "../../assets/images/MIP_toplogo.png";

const InternTaskCard = ({ task, index, onOpenCameraModal, currentUserId, onRefresh }) => {
  // Logic Status Utama
  const isCompleted = task.status === "completed";
  const isPending   = task.status === "pending";   // sudah submit, menunggu ACC
  const isRevision  = task.status === "revision";
  const isTodo      = task.status === "todo"; // belum sama sekali
  const isWaiting   = task.status === "waiting_confirmation";

  // Apakah kartu ini adalah child task (menunggu ACC dari rekan)?
  const isChildTask    = !!task.parent_task_id;
  const needsMentionAcc = isWaiting && isChildTask && task.uploader_id === currentUserId;

  // ── LIVE COUNTDOWN TIMER (10 menit dari mention_submitted_at) ──────────
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!isWaiting || !task.mention_submitted_at) {
      setCountdown(null);
      return;
    }

    const calcRemaining = () => {
      const deadline = new Date(task.mention_submitted_at).getTime() + 10 * 60 * 1000;
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0 && onRefresh) onRefresh(); // auto-refresh saat habis
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 1000);
    return () => clearInterval(timer);
  }, [isWaiting, task.mention_submitted_at, onRefresh]);

  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined) return "—";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    try {
      await api.put(`/daily-tasks/${task.id}/confirm`);
      toast.success("✅ Tugas bersama dikonfirmasi!");
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengkonfirmasi tugas.";
      toast.error(msg);
      if (onRefresh) onRefresh();
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/daily-tasks/${task.id}/reject`);
      toast.success("Tugas bersama ditolak. Tugas direset.");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Gagal menolak tugas.");
    }
  };

  // Helper hapus detik pada jam
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  return (
    <div className={`bg-white rounded-2xl md:rounded-[1.5rem] border transition-all duration-300 shadow-sm relative overflow-hidden group flex flex-col
      ${isRevision ? 'bg-rose-50/30 border-rose-200 hover:shadow-rose-500/10' : 
        isCompleted ? 'bg-emerald-50/30 border-emerald-200' :
        isPending   ? 'bg-amber-50/30 border-amber-200' :
        isWaiting   ? 'border-amber-400 bg-amber-50/30' :
        'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
      
      {/* Indikator Garis Warna di Kiri Card */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 transition-colors
        ${isRevision ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
          isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
          isPending ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
          isWaiting ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 
          'bg-blue-500'}`} 
      />

      {/* ================================================================== */}
      {/* BANNER KONFIRMASI TUGAS BERSAMA (Untuk rekan yang di-tag)           */}
      {/* ================================================================== */}
      {needsMentionAcc && (
        <div className="bg-amber-500 text-white px-4 md:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-user-tag text-lg" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight">Konfirmasi Tugas!</p>
              <p className="text-amber-100 text-[11px] mt-0.5">Waktu lu cuma 10 menit sebelum reset.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs border ${
              countdown !== null && countdown < 60 ? 'bg-rose-600 border-rose-700 animate-pulse' : 'bg-white/20 border-white/30'
            }`}>
              <i className="fa-solid fa-stopwatch text-[10px]" /> {formatCountdown(countdown)}
            </div>
            <button onClick={handleReject} className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-rose-600 text-white text-[11px] font-black uppercase transition-all">
              Tolak
            </button>
            <button onClick={handleConfirm} className="px-3 py-1.5 rounded-lg bg-white text-amber-600 hover:bg-emerald-50 text-[11px] font-black uppercase shadow-sm transition-all flex items-center gap-1">
              <i className="fa-solid fa-check" /> ACC
            </button>
          </div>
        </div>
      )}

      {isWaiting && !needsMentionAcc && countdown !== null && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-users text-amber-500 text-[10px]" />
            <span className="text-amber-700 text-[11px] font-bold">Menunggu ACC rekan...</span>
          </div>
          <span className={`font-black text-[11px] px-2 py-0.5 rounded-md border ${
            countdown < 60 ? 'bg-rose-100 text-rose-600 border-rose-200 animate-pulse' : 'bg-white text-amber-600 border-amber-200'
          }`}>
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      {/* KONTEN UTAMA CARD (Dirombak Total Responsifnya) */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        
        {/* INFO UTAMA (Nomor & Judul) */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 pl-1.5">
          {/* NOMOR URUT */}
          <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-sm sm:text-base shadow-sm transition-colors 
            ${isRevision ? 'bg-rose-100 text-rose-600' : isCompleted ? 'bg-emerald-100 text-emerald-600' : isPending || isWaiting ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            {index + 1}.
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className={`text-sm sm:text-[15px] font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors truncate ${isCompleted ? 'line-through text-slate-400' : ''}`}>
              {task.title || task.taskTemplate?.title || "Tugas Harian"}
            </h4>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 truncate">
              <i className="fa-solid fa-location-dot text-slate-400 text-[10px]"></i>
              {task.location || task.taskTemplate?.description || "Lihat instruksi template"}
            </p>
            
            {/* BADGES (Jam Kerja & Rekan) - Wrap Rapi di HP */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {task.start_time && task.end_time && (
                <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <i className="fa-regular fa-clock text-[10px]"></i>
                  {formatTime(task.start_time)} – {formatTime(task.end_time)}
                </span>
              )}
              {task.reminder_time && (
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <i className="fa-solid fa-bell animate-pulse text-[10px]"></i>
                  {formatTime(task.reminder_time)}
                </span>
              )}
              {task.submitted_at && (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <i className="fa-solid fa-check text-[10px]" />
                  Terkirim {formatTime(new Date(task.submitted_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }))}
                </span>
              )}
            </div>

            {/* Tags Rekan Kerja */}
            {task.participants_detail?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <i className="fa-solid fa-users text-slate-300 text-[10px] mr-0.5"></i>
                {task.participants_detail.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-[9px] font-bold">
                    {p.full_name?.split(" ")[0]}
                  </span>
                ))}
              </div>
            )}

            {task.ai_summary && (
              <div className="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                
                <div className="flex items-center justify-between mb-1.5 relative z-10">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fa-solid fa-microchip text-indigo-500 animate-pulse"></i> 
                    Diulas oleh Qwen 3
                  </span>
                  {task.ai_category && (
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                      {task.ai_category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 font-medium italic relative z-10">
                  "{task.ai_summary}"
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── ACTION BAR (Status, Thumbnail, Kamera) ── */}
        {/* Di HP: Garis pembatas atas dan melebar sejajar. Di Laptop: Sejajar di kanan */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0 pl-1.5 sm:pl-0 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          
          {/* Status Badge Custom */}
          <div className="flex items-center gap-2">
            {isRevision && <span className="bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-200">Revisi</span>}
            {isPending && <span className="bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200">Pending</span>}
            {isWaiting && <span className="bg-amber-100 text-amber-600 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-300">Menunggu</span>}
            {isCompleted && <span className="bg-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200">Selesai</span>}
            {isTodo && <span className="bg-slate-50 text-slate-500 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Belum Ada</span>}
          </div>

          {/* Thumbnail / Action Button */}
          <div className="flex items-center gap-2">
            {/* Tampilkan Foto Bukti jika ada */}
            {(task.evidence_url || task.photo) && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-200 shadow-inner overflow-hidden shrink-0 relative">
                <img src={task.evidence_url || task.photo} alt="bukti" onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }} className="w-full h-full object-cover" />
                {isRevision && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white animate-pulse"></div>}
              </div>
            )}

            {/* Tombol Kamera / Gembok */}
            {needsMentionAcc ? (
              <span className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 text-amber-500 border border-amber-200 rounded-lg flex items-center justify-center animate-pulse">
                 <i className="fa-solid fa-user-check text-xs"></i>
              </span>
            ) : isCompleted || isPending || isWaiting ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                 <i className="fa-solid fa-lock text-xs"></i>
              </div>
            ) : isRevision ? (
              <button onClick={() => onOpenCameraModal(task)} className="h-9 px-3 sm:h-10 sm:px-4 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs font-bold">
                 <i className="fa-solid fa-wrench"></i> <span className="hidden sm:inline">Perbaiki</span>
              </button>
            ) : (
              <button onClick={() => onOpenCameraModal(task)} className="h-9 px-3 sm:h-10 sm:px-4 rounded-lg bg-[#0f172a] hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 shadow-md shadow-slate-800/10 transition-colors text-xs font-bold active:scale-95">
                 <i className="fa-solid fa-camera"></i> <span className="hidden sm:inline">Kerjakan</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================================================================== */}
      {/* AREA REVISI & MENTION TETAP DIPERTAHANKAN (Logic Bawah)             */}
      {/* ================================================================== */}
      {needsMentionAcc && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 bg-amber-50/10">
          <div className="bg-amber-50/50 p-3 sm:p-4 rounded-xl border border-amber-100 shadow-inner mt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
              <i className="fa-solid fa-users mr-1"></i> Detail Laporan Rekan:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-100">
                 <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Catatan:</p>
                 <p className="text-xs font-medium text-slate-700">"{task.description || "Tidak ada."}"</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-100">
                 <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Bukti Foto:</p>
                 {task.evidence_url ? (
                   <img src={task.evidence_url} alt="bukti" onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }} className="w-full h-24 object-cover rounded shadow-sm border border-slate-200" onClick={() => window.open(task.evidence_url, '_blank')} />
                 ) : (
                   <p className="text-xs text-slate-400 italic">Belum ada foto.</p>
                 )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleConfirm} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-sm"><i className="fa-solid fa-check mr-1"></i> Setuju</button>
              <button onClick={handleReject} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold shadow-sm"><i className="fa-solid fa-xmark mr-1"></i> Tolak</button>
            </div>
          </div>
        </div>
      )}

      {isRevision && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-rose-100 shadow-inner flex gap-3 items-start mt-2">
            <i className="fa-solid fa-quote-left text-rose-300 mt-0.5"></i>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-0.5">Catatan Admin:</p>
              <p className="text-xs sm:text-[13px] font-semibold text-slate-700">"{task.reject_reason || task.admin_notes || 'Tolong perbaiki laporan Anda.'}"</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InternTaskCard;