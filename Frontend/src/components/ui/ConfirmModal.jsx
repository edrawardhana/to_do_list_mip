import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDark, type = "danger", actionText = "Konfirmasi" }) => {
  if (!isOpen) return null;

  // Colors based on type and theme
  let iconClass = "fa-triangle-exclamation";
  let colorClass = "";
  let btnColor = "";

  if (type === "delete") {
    iconClass = "fa-skull-crossbones";
    colorClass = isDark ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-rose-600 bg-rose-50 border-rose-100";
    btnColor = isDark ? "bg-red-500/20 hover:bg-red-500/40 text-red-500 hover:text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "bg-rose-500 hover:bg-rose-600 text-white";
  } else if (type === "lock") {
    iconClass = "fa-lock";
    colorClass = isDark ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-600 bg-amber-50 border-amber-100";
    btnColor = isDark ? "bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 hover:text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-amber-500 hover:bg-amber-600 text-white";
  } else if (type === "unlock") {
    iconClass = "fa-unlock";
    colorClass = isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-600 bg-slate-50 border-slate-200";
    btnColor = isDark ? "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 hover:text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-slate-700 hover:bg-slate-800 text-white";
  } else if (type === "promote") {
    iconClass = "fa-arrow-up";
    colorClass = isDark ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-purple-600 bg-purple-50 border-purple-100";
    btnColor = isDark ? "bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 hover:text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-purple-600 hover:bg-purple-700 text-white";
  } else {
    // Info / default
    iconClass = "fa-circle-question";
    colorClass = isDark ? "text-sky-400 bg-sky-500/10 border-sky-500/20" : "text-blue-600 bg-blue-50 border-blue-100";
    btnColor = isDark ? "bg-sky-500/20 hover:bg-sky-500/40 text-sky-500 hover:text-sky-400 border border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]" : "bg-blue-600 hover:bg-blue-700 text-white";
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 transition-opacity ${isDark ? 'bg-black/90 backdrop-blur-sm' : 'bg-slate-900/40 backdrop-blur-sm'}`} 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={`relative w-full max-w-sm rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border ${
        isDark ? 'bg-[#09090b] border-[#27272a] shadow-[0_30px_100px_rgba(0,0,0,1)]' : 'bg-white border-slate-100'
      }`}>
        {/* Glow Effects for Dark Mode */}
        {isDark && (
          <>
            <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[90px] pointer-events-none opacity-40 ${
                type === 'delete' ? 'bg-red-500' : type === 'lock' ? 'bg-amber-500' : type === 'unlock' ? 'bg-emerald-500' : 'bg-zinc-500'
            }`}></div>
          </>
        )}

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border shadow-inner ${colorClass}`}>
            <i className={`fa-solid ${iconClass}`}></i>
          </div>
          
          <h3 className={`text-xl font-black mb-2.5 tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
            {title}
          </h3>
          <p className={`text-xs sm:text-sm mb-8 font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {message}
          </p>

          <div className="flex w-full gap-3">
            <button 
              onClick={onClose} 
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                isDark ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Batal
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }} 
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm transition-all ${btnColor}`}
            >
              {actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
