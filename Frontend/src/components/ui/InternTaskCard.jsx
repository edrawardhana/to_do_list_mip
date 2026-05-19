import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

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

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden group 
      ${isRevision ? 'bg-rose-50/50 border-rose-200 hover:shadow-rose-500/10 hover:border-rose-300' : 
        isCompleted ? 'bg-emerald-50/50 border-emerald-200' :
        isPending   ? 'bg-amber-50/50 border-amber-200' :
        isWaiting   ? 'border-amber-400 bg-amber-50/30' :
        'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'}`}>
      
      {/* Indikator Garis Warna di Kiri Card */}
      {isRevision  && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>}
      {isCompleted && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
      {isPending   && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}
      {isWaiting   && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>}
      {isTodo      && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}

      {/* ================================================================== */}
      {/* BANNER KONFIRMASI TUGAS BERSAMA (Untuk rekan yang di-tag)           */}
      {/* ================================================================== */}
      {needsMentionAcc && (
        <div className="bg-amber-500 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-user-tag text-lg" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight">Rekanmu men-tag kamu di tugas ini!</p>
              <p className="text-amber-100 text-xs mt-0.5">Konfirmasi dalam waktu 10 menit atau tugas akan direset.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Countdown */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border ${
              countdown !== null && countdown < 60 
                ? 'bg-rose-600 border-rose-700 text-white animate-pulse' 
                : 'bg-white/20 border-white/30 text-white'
            }`}>
              <i className="fa-solid fa-stopwatch text-xs" />
              {formatCountdown(countdown)}
            </div>
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-rose-600 border border-white/30 text-white text-xs font-black uppercase tracking-widest transition-all"
            >
              Tolak
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-white text-amber-600 hover:bg-emerald-50 hover:text-emerald-700 border border-white/60 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <i className="fa-solid fa-check mr-1" /> ACC
            </button>
          </div>
        </div>
      )}

      {/* Countdown bar visual for non-child waiting tasks */}
      {isWaiting && !needsMentionAcc && countdown !== null && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <i className="fa-solid fa-users text-amber-500 text-xs" />
          <span className="text-amber-700 text-[11px] font-bold">Menunggu konfirmasi rekan</span>
          <span className={`ml-auto font-black text-xs px-2 py-0.5 rounded-lg border ${
            countdown < 60 ? 'bg-rose-100 text-rose-600 border-rose-200 animate-pulse' : 'bg-white text-amber-600 border-amber-200'
          }`}>
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      {/* KONTEN UTAMA CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
        
        {/* INFO UTAMA (Nomor & Judul) */}
        <div className="flex items-center gap-4 flex-1">
          {/* NOMOR URUT */}
          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transition-colors 
            ${isRevision ? 'bg-rose-100 text-rose-600' : 
              isCompleted ? 'bg-emerald-100 text-emerald-600' : 
              isPending || isWaiting ? 'bg-amber-100 text-amber-600' :
              'bg-blue-50 text-blue-500'}`}>
            {index + 1}.
          </div>
          <div>
            {/* JUDUL TUGAS */}
            <h4 className={`text-[15px] font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors ${isCompleted ? 'line-through text-slate-500' : ''}`}>
              {task.title || task.taskTemplate?.title || "Tugas Harian"}
            </h4>
            <p className="text-[13px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <i className="fa-solid fa-location-dot text-slate-400 text-xs"></i>
              {task.location || task.taskTemplate?.description || "Lihat instruksi template"}
            </p>
            {/* Tampilkan Jam Kerja */}
            {(task.start_time || task.end_time || task.reminder_time) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {task.start_time && task.end_time && (
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {task.start_time} – {task.end_time} WIB
                  </span>
                )}
                {task.reminder_time && (
                  <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <i className="fa-solid fa-bell"></i>
                    Reminder {task.reminder_time} WIB
                  </span>
                )}
              </div>
            )}
            {/* Tampilkan submitted_at jika ada */}
            {task.submitted_at && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                <i className="fa-solid fa-clock-rotate-left text-[9px]" />
                Terkirim: {new Date(task.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
              </p>
            )}
            {/* Rekan Kerja / Dikerjakan Bersama */}
            {task.participants_detail?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-users text-slate-400"></i> Rekan Kerja:
                </span>
                {task.participants_detail.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0">
                      {p.full_name?.charAt(0) || "?"}
                    </span>
                    {p.full_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STATUS BADGE & THUMBNAIL (Kanan) */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 shrink-0">
          
          {/* STATUS BADGE */}
          <div className="flex flex-col items-end gap-1.5 order-2 md:order-1">
            {isRevision && (
              <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-200 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div> REVISI
              </span>
            )}
            {isPending && (
              <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 flex items-center gap-1.5 shadow-sm">
                <i className="fa-solid fa-hourglass-half animate-pulse text-[11px]"></i> MENUNGGU ACC
              </span>
            )}
            {isWaiting && (
              <span className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-300 flex items-center gap-1.5 shadow-sm">
                <i className="fa-solid fa-users animate-pulse text-[11px]"></i> MENUNGGU REKAN
              </span>
            )}
            {isCompleted && (
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                 <i className="fa-solid fa-check-double text-[11px]"></i> SELESAI
              </span>
            )}
            {isTodo && (
              <span className="bg-white text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5 shadow-sm">
                 <i className="fa-solid fa-desktop text-[11px] text-slate-400"></i> BELUM DIKERJAKAN
              </span>
            )}
          </div>

          {/* THUMBNAIL GAMBAR BUKTI */}
          <div className="relative w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner shrink-0 order-1 md:order-2">
            {task.evidence_url || task.photo ? (
              <img src={task.evidence_url || task.photo} alt="bukti" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <i className="fa-regular fa-image text-slate-400 text-xl"></i>
            )}
            {isRevision && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>
            )}
          </div>
        </div>

        {/* ACTION BUTTON KANAN */}
        <div className="flex md:flex-col items-center justify-center gap-3 pl-4 md:pl-0 md:border-l md:border-slate-100/60 shrink-0">
           {needsMentionAcc ? (
              <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200 animate-pulse shadow-sm">
                 <i className="fa-solid fa-user-check"></i> Butuh Konfirmasi
              </span>
           ) : isCompleted || isPending || isWaiting ? (
              <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                 <i className="fa-solid fa-lock text-lg"></i>
              </div>
           ) : isRevision ? (
              <div className="w-10 h-10 flex items-center justify-center text-rose-300">
                 <i className="fa-solid fa-triangle-exclamation text-lg animate-pulse"></i>
              </div>
           ) : (
              <button 
                  onClick={() => onOpenCameraModal(task)}
                  className="w-10 h-10 rounded-xl bg-[#0b1437] text-white flex items-center justify-center shadow-lg shadow-sky-900/10 hover:bg-sky-500 transition-colors"
                >
                  <i className="fa-solid fa-camera"></i>
              </button>
           )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* AREA KONFIRMASI TUGAS BERSAMA (MENTION ACC)                       */}
      {/* ================================================================== */}
      {needsMentionAcc && (
        <div className="px-5 pb-5 pt-0 border-t border-amber-200/60 mt-0 bg-amber-50/10">
          <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 shadow-inner mb-4 mt-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5 items-center">
                <i className="fa-solid fa-users text-lg text-amber-500"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                  Konfirmasi Tugas Bersama
                  {countdown !== null && (
                    <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] font-mono tracking-normal animate-pulse">
                      ⏳ {formatCountdown(countdown)}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">
                Rekan Anda men-tag Anda dalam tugas bersama ini. Harap tinjau deskripsi dan foto laporan rekan Anda di bawah ini untuk melakukan konfirmasi:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
                {/* Deskripsi Laporan */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Deskripsi Pekerjaan:</p>
                    <p className="text-[13px] font-medium text-slate-700 mt-1 leading-relaxed">
                      "{task.description || "Tidak ada deskripsi tambahan."}"
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-4 flex items-center gap-1">
                    <i className="fa-solid fa-user-pen"></i> Ditulis oleh Rekan Shift
                  </div>
                </div>

                {/* Bukti Foto Laporan */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Bukti Foto Rekan:</p>
                  {task.evidence_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-40 group/photo shadow-sm">
                      <img 
                        src={task.evidence_url} 
                        alt="bukti tugas rekan" 
                        className="w-full h-auto max-h-40 object-cover cursor-zoom-in group-hover/photo:scale-105 transition-transform duration-300"
                        onClick={() => window.open(task.evidence_url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity cursor-zoom-in" onClick={() => window.open(task.evidence_url, '_blank')}>
                        <span className="bg-white/95 text-slate-800 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-magnifying-glass-plus"></i> Perbesar Gambar
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5">
                      <i className="fa-regular fa-image text-2xl"></i>
                      <span className="text-[11px] font-bold">Foto belum diupload rekan</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-black uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check"></i> Setuju & Konfirmasi Tugas
            </button>
            <button 
              onClick={handleReject}
              className="py-3 px-6 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all border border-slate-200 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-xmark"></i> Tolak
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* AREA REVISI (Catatan Admin & Tombol Perbaiki)                       */}
      {/* ================================================================== */}
      {isRevision && (
        <div className="px-5 pb-5 pt-0 border-t border-rose-200/60 mt-0">
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-inner mb-4 flex gap-3 items-start">
            <i className="fa-solid fa-quote-left text-xl text-rose-300"></i>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Catatan Admin:</p>
              <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">
                "{task.reject_reason || task.admin_notes || 'Tolong perbaiki laporan Anda.'}"
              </p>
            </div>
          </div>
          <button 
            onClick={() => onOpenCameraModal(task)}
            className="w-full py-3 bg-rose-600 text-white rounded-xl text-[13px] font-bold hover:bg-rose-700 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-wrench"></i> Perbaiki Laporan
          </button>
        </div>
      )}

    </div>
  );
};

export default InternTaskCard;