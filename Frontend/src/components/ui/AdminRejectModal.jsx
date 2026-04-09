import React, { useState } from "react";

const AdminRejectModal = ({ task, onClose, onSubmitRevision }) => {
  const [note, setNote] = useState("");
  const isButtonDisabled = note.trim().length === 0;

  const handleSubmit = () => {
    if (!isButtonDisabled) {
      onSubmitRevision(task.id, note);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Merah Tanda Bahaya */}
        <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-sm"></i>
            </div>
            <h3 className="font-bold text-rose-900 tracking-tight">Minta Revisi Laporan</h3>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-600 transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Form Catatan */}
        <div className="p-6">
          <p className="text-xs font-semibold text-slate-500 mb-4 leading-relaxed">
            Berikan alasan kenapa laporan <span className="text-slate-900 font-bold">{task.title}</span> ini ditolak. Anak magang akan melihat catatan ini.
          </p>

          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
            Catatan Revisi Admin <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Foto ngeblur dek, tolong foto ulang bagian kabelnya..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none h-32 custom-scrollbar"
            autoFocus
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all">
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-paper-plane"></i> Kirim Revisi
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminRejectModal;