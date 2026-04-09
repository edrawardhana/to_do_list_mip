import React from "react";

const InternTaskCard = ({ task, index, onOpenCameraModal, onConfirmTask, currentUserId }) => {
  // Logic Status Utama
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";
  const isRevision = task.status === "revision";
  const isTodo = task.status === "todo";
  const isWaiting = task.status === "waiting_confirmation";

  // Cek Tagging Consensus
  // Apakah user saat ini adalah salah satu yang di-tag dan BELUM konfirmasi?
  const isTargetTag = task.tagged_users?.some(u => u.id === currentUserId && !u.has_confirmed);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden group 
      ${isRevision ? 'bg-rose-50/50 border-rose-200 hover:shadow-rose-500/10 hover:border-rose-300' : 
        isCompleted ? 'bg-emerald-50/50 border-emerald-200' :
        isPending ? 'bg-amber-50/50 border-amber-200' :
        isWaiting ? 'border-amber-400 bg-amber-50/30' :
        'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'}`}>
      
      {/* Indikator Garis Warna di Kiri Card */}
      {isRevision && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>}
      {isCompleted && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
      {isPending && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}
      {isWaiting && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>}
      {isTodo && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}

      {/* ========================================================= */}
      {/* OVERLAY KONFIRMASI (Hanya muncul buat temen yang di-tag)  */}
      {/* ========================================================= */}
      {isWaiting && isTargetTag && (
        <div className="absolute inset-0 bg-[#0b1437]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
          <p className="text-white text-xs font-bold mb-3">
            <i className="fa-solid fa-user-tag text-sky-400 mr-2"></i>
            Konfirmasi tugas bareng <span className="text-sky-300">{task.inviter_name || "Rekanmu"}</span>?
          </p>
          <div className="flex gap-2 w-full max-w-xs">
            <button 
              onClick={() => onConfirmTask(task.id)}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-colors"
            >
              Ya, Setuju!
            </button>
            <button className="flex-1 py-2 bg-white/10 text-white rounded-lg text-[11px] font-bold hover:bg-white/20 transition-colors">
              Bukan Saya
            </button>
          </div>
          {/* Progress Timer Kecil (Visual Only) */}
          <div className="w-full max-w-xs h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
             <div className="h-full bg-rose-500 animate-shrink" style={{animationDuration: '600s'}}></div>
          </div>
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
              {task.title}
            </h4>
            <p className="text-[13px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <i className="fa-solid fa-location-dot text-slate-400 text-xs"></i>
              {task.location || "Lokasi MCC"}
            </p>
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
            {task.photo ? (
              <img src={task.photo} alt="bukti" className="w-full h-full object-cover" />
            ) : (
              <i className="fa-regular fa-image text-slate-400 text-xl"></i>
            )}
            {/* Titik Merah kalo Revisi */}
            {isRevision && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>
            )}
          </div>
        </div>

        {/* ACTION BUTTON KANAN (Jepret/Gembok/Warning) */}
        <div className="flex md:flex-col items-end gap-3 pl-4 md:pl-0 md:border-l md:border-slate-100/60 shrink-0">
           {isCompleted || isPending || isWaiting ? (
              // Kalo udah selesai, pending, atau nunggu temen -> Gembok (Gak bisa foto lagi)
              <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                 <i className="fa-solid fa-lock text-lg"></i>
              </div>
           ) : isRevision ? (
              // Kalo Revisi -> Ikon Warning, biar fokus ke tombol perbaiki di bawah
              <div className="w-10 h-10 flex items-center justify-center text-rose-300">
                 <i className="fa-solid fa-triangle-exclamation text-lg animate-pulse"></i>
              </div>
           ) : (
              // Kalo Todo -> Tombol Kamera nyala
              <button 
                  onClick={() => onOpenCameraModal(task)}
                  className="w-10 h-10 rounded-xl bg-[#0b1437] text-white flex items-center justify-center shadow-lg shadow-sky-900/10 hover:bg-sky-500 transition-colors"
                >
                  <i className="fa-solid fa-camera"></i>
              </button>
           )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* AREA REVISI (Catatan Admin & Tombol Perbaiki)             */}
      {/* ========================================================= */}
      {isRevision && (
        <div className="px-5 pb-5 pt-0 border-t border-rose-200/60 mt-0">
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-inner mb-4 flex gap-3 items-start">
            <i className="fa-solid fa-quote-left text-xl text-rose-300"></i>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Catatan Admin:</p>
              <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">
                "{task.admin_notes}"
              </p>
            </div>
          </div>
          {/* Tombol Kamera Utama Buat Revisi (Warna Merah) */}
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