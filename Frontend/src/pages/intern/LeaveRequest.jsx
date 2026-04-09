import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const LeaveRequest = () => {
  const { user } = useAuth();
  
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.user_metadata?.division || "IT Support"
  } : { id: "1", name: "Kiel", division: "IT Support" };

  // State Form
  const [leaveType, setLeaveType] = useState("sakit");
  const [isLoading, setIsLoading] = useState(false);

  // Dummy History (Sekarang pake status dari alur lu)
  const [history] = useState([
    { id: 1, type: "Swap Shift", status: "pending", date: "Hari ini, 10:00 WIB", note: "Tukar ke tgl 15 Apr", info: "Pindah Shift" },
    { id: 2, type: "Sakit", status: "approved", date: "08 Apr 2026", note: "Demam tinggi", info: "Surat Dokter" },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulasi Payload ke Backend sesuai alur lu
    // [ID_User, Tipe_Izin, Alasan, Foto, Tgl_Pengganti (jika swap)]
    console.log("Mengirim data ke tabel EXCEPTIONS...");
    
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    setIsLoading(false);
    alert("Request berhasil dikirim! Status sekarang: Pending di Dashboard Admin.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-6xl mx-auto">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-sky-900/10 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/50">
                <i className="fa-solid fa-envelope-open-text text-lg"></i>
              </div>
              <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest">Request System</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-sky-200">
              Leave & Exception
            </h1>
            <p className="text-[14px] text-sky-100/80 font-medium max-w-xl leading-relaxed border-l-[3px] border-sky-500/50 pl-4">
              Ajukan izin, tukar shift, atau permintaan buka akses (Unlock) jika Anda mendadak harus masuk di hari libur.
            </p>
          </div>

          {/* TAMBAHAN WIDGET KANAN LEAVE REQUEST */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <i className="fa-regular fa-calendar-check"></i>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-white leading-none">3</span>
                <span className="text-xs font-bold text-slate-400">Hari</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Sisa Kuota Izin</span>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-w-[130px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-white leading-none">0</span>
                <span className="text-xs font-bold text-slate-400">Kali</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Pending Request</span>
            </div>
          </div>

        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: FORM PENGAJUAN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <i className="fa-solid fa-file-pen text-blue-500"></i> Form Pengajuan
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* TIPE IZIN - Ini Core Alur Lu */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Kategori Request</label>
                <div className="relative">
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="sakit">🏥 Sakit (Wajib Bukti)</option>
                    <option value="izin">📝 Izin Biasa</option>
                    <option value="swap_shift">🔄 Swap Shift (Tukar Hari)</option>
                    <option value="unlock">🔓 Unlock (Masuk Darurat)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              {/* TANGGAL PENGGANTI - Muncul cuma kalo Swap Shift */}
              {leaveType === "swap_shift" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-rose-500 block mb-1.5 ml-1">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Tanggal Pengganti
                  </label>
                  <input type="date" className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none" required />
                  <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">*Jadwal lama akan otomatis terhapus jika di-ACC.</p>
                </div>
              )}

              {/* INFO UNLOCK - Muncul cuma kalo Unlock */}
              {leaveType === "unlock" && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in">
                  <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                    <i className="fa-solid fa-circle-info mr-1"></i> 
                    Gunakan ini jika Anda disuruh masuk mendadak di hari libur. Dashboard akan otomatis terbuka setelah Admin melakukan <b>ACC Unlock</b>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Mulai Tgl</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none" required />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Sampai Tgl</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none" required />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Alasan</label>
                <textarea rows="3" placeholder="Jelaskan secara singkat..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none resize-none" required></textarea>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Bukti Foto</label>
                <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors group">
                  <i className="fa-solid fa-camera text-2xl text-slate-300 group-hover:text-blue-500 mb-2"></i>
                  <p className="text-[10px] font-bold text-slate-500">Ambil Foto / Upload Bukti</p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-[#0b1437] text-white rounded-xl text-sm font-black shadow-lg shadow-sky-900/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isLoading ? "Memproses..." : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: HISTORY */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-blue-500"></i> My Exceptions
            </h3>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                      <i className={`fa-solid ${item.type === 'Sakit' ? 'fa-house-medical' : 'fa-code-compare'}`}></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{item.type}</h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.date}</p>
                      <p className="text-xs font-bold text-slate-600 mt-2 italic">"{item.note}"</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveRequest;