import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Approval = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");

  // Tarik nama divisi Admin yang lagi login
  const myDivision = user?.division_name || "IT Support";

  // ==========================================
  // DUMMY DATA: TUGAS MENUNGGU ACC
  // ==========================================
  const [pendingTasks, setPendingTasks] = useState([
    {
      id: 101, internName: "Edra Maulana", division: "Multimedia",
      taskTitle: "Edit Video Profil MCC", timeSubmitted: "15:45 WIB",
      photo: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300",
      notes: "Rendering selesai boss, file udah di Google Drive."
    },
    {
      id: 102, internName: "Kiel", division: "IT Support",
      taskTitle: "Cek Jaringan Lantai 3", timeSubmitted: "16:10 WIB",
      photo: null, 
      notes: "Sudah aman, ping stabil."
    },
    {
      id: 103, internName: "Nabil", division: "IT Support",
      taskTitle: "Setup Router Mikrotik", timeSubmitted: "16:30 WIB",
      photo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300", 
      notes: "Kabel LAN udah ditarik semua."
    }
  ]);

  // ==========================================
  // DUMMY DATA: IZIN / EXCEPTIONS MENUNGGU ACC
  // ==========================================
  const [pendingLeaves, setPendingLeaves] = useState([
    {
      id: 201, internName: "Nabil Pratama", division: "IT Support",
      type: "unlock", dateReq: "Hari Ini", 
      reason: "Shift libur tapi ditelpon pak koor disuruh masuk benerin server.",
      proof: null, swapDate: null
    },
    {
      id: 202, internName: "Siti", division: "Public Relation",
      type: "swap_shift", dateReq: "15 Apr 2026", 
      reason: "Ada bimbingan skripsi mendadak jam 1 siang.",
      proof: null, swapDate: "18 Apr 2026"
    },
    {
      id: 203, internName: "Budi", division: "Creative Design",
      type: "sakit", dateReq: "Hari Ini - Besok", 
      reason: "Gejala tifus, butuh istirahat.",
      proof: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300", 
      swapDate: null
    }
  ]);

  // ==========================================
  // LOGIC FILTER SAKTI (PEMISAH KASTA & DIVISI)
  // ==========================================
  const filteredTasks = useMemo(() => {
    // Kalo bos besar (Superadmin/Dev), tampilkan semua
    if (isSuperAdmin || isDeveloper) return pendingTasks;
    // Kalo Admin biasa, HANYA tampilkan anak divisinya
    return pendingTasks.filter(task => task.division === myDivision);
  }, [pendingTasks, isSuperAdmin, isDeveloper, myDivision]);

  const filteredLeaves = useMemo(() => {
    // Kalo bos besar (Superadmin/Dev), tampilkan semua
    if (isSuperAdmin || isDeveloper) return pendingLeaves;
    // Kalo Admin biasa, HANYA tampilkan anak divisinya
    return pendingLeaves.filter(leave => leave.division === myDivision);
  }, [pendingLeaves, isSuperAdmin, isDeveloper, myDivision]);

  // ==========================================
  // ACTION HANDLERS (Simulasi)
  // ==========================================
  const handleActionTask = (id, action) => {
    if (action === 'reject') {
      const reason = prompt("Kasih alasan revisi ke anak magangnya:");
      if (!reason) return;
    }
    setPendingTasks(prev => prev.filter(task => task.id !== id));
    alert(`Tugas berhasil di-${action}!`);
  };

  const handleActionLeave = (id, action, type) => {
    if (action === 'acc') {
      let msg = "Izin berhasil di-ACC.";
      if (type === 'unlock') msg = "Unlock di-ACC! Akun anak ini otomatis terbuka.";
      if (type === 'swap_shift') msg = "Swap Shift di-ACC! Jadwal ditukar.";
      alert(msg);
    } else {
      const reason = prompt("Alasan menolak pengajuan ini:");
      if (!reason) return;
    }
    setPendingLeaves(prev => prev.filter(leave => leave.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 px-1">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 ${
            activeTab === "tasks" 
              ? "bg-blue-950 text-white shadow-xl shadow-blue-900/20 scale-105 border border-blue-900" 
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <i className="fa-solid fa-list-check"></i> Laporan Tugas 
          {filteredTasks.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 border border-rose-600 shadow-sm">{filteredTasks.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("leaves")}
          className={`px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 ${
            activeTab === "leaves" 
              ? "bg-blue-950 text-white shadow-xl shadow-blue-900/20 scale-105 border border-blue-900" 
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <i className="fa-solid fa-envelope-open-text"></i> Pengajuan Izin
          {filteredLeaves.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 border border-rose-600 shadow-sm">{filteredLeaves.length}</span>}
        </button>
      </div>

      {/* ================================================================= */}
      {/* KONTEN TAB: TUGAS */}
      {/* ================================================================= */}
      {activeTab === "tasks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-slate-200 rounded-[2rem] p-12 text-center">
              <i className="fa-solid fa-mug-hot text-4xl text-slate-300 mb-3"></i>
              <h3 className="text-slate-500 font-bold">Semua tugas divisimu sudah diperiksa. Aman brok!</h3>
            </div>
          )}

          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 transition-colors">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                    {task.internName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{task.internName}</h4>
                    <p className="text-[10px] font-medium text-slate-400">{task.division}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-400 shadow-sm">
                  {task.timeSubmitted}
                </span>
              </div>
              
              <div className="p-5 flex-1">
                <h5 className="font-black text-slate-800 mb-3">{task.taskTitle}</h5>
                <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-inner">
                  {task.photo ? (
                    <img src={task.photo} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-center text-rose-400">
                      <i className="fa-solid fa-image-slash text-3xl mb-1"></i>
                      <p className="text-[10px] font-bold uppercase">Tanpa Foto</p>
                    </div>
                  )}
                </div>
                <p className="text-[12px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium italic">
                  "{task.notes}"
                </p>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/50">
                <button onClick={() => handleActionTask(task.id, 'reject')} className="py-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold shadow-sm transition-all">
                  <i className="fa-solid fa-xmark mr-1"></i> Revisi
                </button>
                <button onClick={() => handleActionTask(task.id, 'acc')} className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                  <i className="fa-solid fa-check mr-1"></i> ACC
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* KONTEN TAB: LEAVES / EXCEPTIONS */}
      {/* ================================================================= */}
      {activeTab === "leaves" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeaves.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-slate-200 rounded-[2rem] p-12 text-center">
              <i className="fa-solid fa-envelope-circle-check text-4xl text-slate-300 mb-3"></i>
              <h3 className="text-slate-500 font-bold">Tidak ada pengajuan izin di divisimu.</h3>
            </div>
          )}

          {filteredLeaves.map((leave) => {
            const getExceptionStyle = (type) => {
              switch(type) {
                case 'unlock': return { icon: "fa-unlock", color: "text-amber-500", bg: "bg-amber-50", label: "Unlock" };
                case 'swap_shift': return { icon: "fa-code-compare", color: "text-blue-500", bg: "bg-blue-50", label: "Swap Shift" };
                case 'sakit': return { icon: "fa-house-medical", color: "text-rose-500", bg: "bg-rose-50", label: "Sakit" };
                default: return { icon: "fa-envelope", color: "text-slate-500", bg: "bg-slate-50", label: "Izin Biasa" };
              }
            };
            const style = getExceptionStyle(leave.type);

            return (
              <div key={leave.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row group relative hover:border-blue-200 transition-colors">
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${style.bg.replace('50', '500')}`}></div>

                <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-between pl-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-slate-200/50 ${style.bg} ${style.color}`}>
                        <i className={`fa-solid ${style.icon}`}></i>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm leading-none mb-1">{leave.internName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.division}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border mb-2 shadow-sm ${style.bg} ${style.color} ${style.color.replace('text', 'border')}`}>
                        {style.label}
                      </span>
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        "{leave.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                      <p className="text-xs font-black text-slate-700">{leave.dateReq}</p>
                    </div>
                    {leave.type === 'swap_shift' && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1"><i className="fa-solid fa-arrow-right"></i> Pindah Ke</p>
                        <p className="text-xs font-black text-blue-700">{leave.swapDate}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-48 bg-slate-50/50 p-5 flex flex-col shrink-0 justify-between">
                  <div className="flex-1 flex flex-col items-center justify-center mb-4">
                    {leave.proof ? (
                      <div className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden relative group/img cursor-pointer shadow-inner">
                        <img src={leave.proof} alt="Bukti" className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                           <i className="fa-solid fa-magnifying-glass-plus text-white text-xl"></i>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400">
                        <i className="fa-solid fa-file-circle-xmark text-3xl mb-2 opacity-50"></i>
                        <p className="text-[10px] font-bold uppercase tracking-widest">Tanpa Bukti</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleActionLeave(leave.id, 'acc', leave.type)} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                      <i className="fa-solid fa-check mr-1"></i> ACC
                    </button>
                    <button onClick={() => handleActionLeave(leave.id, 'reject', leave.type)} className="w-full py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold shadow-sm transition-all">
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Approval;