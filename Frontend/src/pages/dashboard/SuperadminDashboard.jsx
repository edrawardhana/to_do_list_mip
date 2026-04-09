import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const SuperadminDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");

  // ==========================================
  // DUMMY DATA: FILTERED AUDIT LOGS (Eagle Eye)
  // ==========================================
  // Hanya melihat role 'user' (intern) dan 'admin' (mandor)
  const [auditLogs] = useState([
    { id: 1, timestamp: "Hari ini, 09:15", actorName: "Pak Budi", actorRole: "admin", action: "Menyukai/ACC Laporan Tugas 'Kiel' (IT Support)." },
    { id: 2, timestamp: "Hari ini, 08:30", actorName: "Nabil", actorRole: "intern", action: "Berhasil Login ke sistem." },
    { id: 3, timestamp: "Kemarin, 16:45", actorName: "Mbak Rina", actorRole: "admin", action: "Menolak izin sakit 'Siti' karena tanpa bukti lampiran." },
    { id: 4, timestamp: "Kemarin, 14:20", actorName: "Edra", actorRole: "intern", action: "Mengubah foto profil akun." },
    { id: 5, timestamp: "Kemarin, 10:00", actorName: "Admin Multimedia", actorRole: "admin", action: "Membuka gembok (Unlock) akun 'Budi'." },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 19) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION (TEMA VVIP BOS - PURPLE)                             */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-br from-[#1a1437] to-[#2d1b54] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-purple-900/20 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-purple-400 shadow-inner">
                <i className="fa-solid fa-eye text-lg"></i>
              </div>
              <span className="text-purple-300 text-[10px] font-black uppercase tracking-widest">
                Eagle Eye Supervision
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-200">
              {greeting}, Super {user?.nickname || "Admin"}!
            </h1>
            <p className="text-[14px] text-purple-100/80 font-medium max-w-xl leading-relaxed border-l-[3px] border-purple-500/50 pl-4">
              Anda memiliki akses penuh untuk memantau kelakuan Admin Divisi dan Anak Magang. Pastikan seluruh standar operasional MCC berjalan tanpa kendala.
            </p>
          </div>
          
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 rounded-2xl w-full md:w-64 flex items-center gap-4 shadow-inner shrink-0">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-bold border border-purple-400/30">
               {user?.nickname?.charAt(0) || "S"}
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{user?.full_name}</p>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">
                Kasta: Super Admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* QUICK STATS CARDS                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Admin Divisi</p>
          <h3 className="text-3xl font-black text-slate-800 mb-1">8 <span className="text-xs font-bold text-emerald-500">Aktif</span></h3>
          <p className="text-[10px] font-bold text-slate-400">Pimpinan operasional lapangan</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Anak Magang</p>
          <h3 className="text-3xl font-black text-slate-800 mb-1">45 <span className="text-xs font-bold text-blue-500">User</span></h3>
          <p className="text-[10px] font-bold text-slate-400">Tersebar di 4 divisi aktif</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Antrean Global</p>
          <h3 className="text-3xl font-black text-slate-800 mb-1">15 <span className="text-xs font-bold text-amber-500">Wait</span></h3>
          <p className="text-[10px] font-bold text-slate-400">Tugas & Izin belum terproses</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
           <p className="text-[10px] font-black uppercase tracking-widest text-purple-100 mb-1">Sistem Keamanan</p>
           <h3 className="text-xl font-black mb-3">Status Gembok</h3>
           <Link to="/manage-admin" className="text-xs font-bold text-indigo-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-all shadow-sm w-max">
              Lihat Detail
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================================================================= */}
        {/* ACCESS LOG (MATA DEWA)                                              */}
        {/* ================================================================= */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <i className="fa-solid fa-fingerprint text-purple-500"></i> Audit Log: Interns & Admins
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Live Monitoring
            </span>
          </div>
          
          <div className="p-8 overflow-y-auto custom-scrollbar h-[500px]">
            <div className="space-y-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-2xl border border-slate-50 hover:border-purple-100 hover:bg-purple-50/20 transition-all group">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white shadow-sm ${log.actorRole === 'admin' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {log.actorName.charAt(0)}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm">{log.actorName}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${log.actorRole === 'admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                               {log.actorRole}
                            </span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        "{log.action}"
                      </p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* QUICK SHORTCUTS                                                     */}
        {/* ================================================================= */}
        <div className="lg:col-span-1 space-y-6">
           <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
              <i className="fa-solid fa-compass text-purple-500"></i> Navigasi Strategis
           </h3>
           
           <div className="grid grid-cols-1 gap-4">
              <Link to="/analytics" className="group bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:border-purple-400 hover:shadow-md transition-all flex flex-col gap-3">
                 <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-chart-pie"></i></div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm">Deep Analytics</h4>
                    <p className="text-[11px] font-medium text-slate-400">Bedah performa per divisi & leaderboard.</p>
                 </div>
              </Link>

              <Link to="/manage-admin" className="group bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col gap-3">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-user-shield"></i></div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm">Role Manager</h4>
                    <p className="text-[11px] font-medium text-slate-400">Promote Intern ke Admin atau sebaliknya.</p>
                 </div>
              </Link>

              <Link to="/divisions" className="group bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:border-fuchsia-400 hover:shadow-md transition-all flex flex-col gap-3">
                 <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-sitemap"></i></div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm">Manage Divisi</h4>
                    <p className="text-[11px] font-medium text-slate-400">Atur struktur organisasi pusat.</p>
                 </div>
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SuperadminDashboard;