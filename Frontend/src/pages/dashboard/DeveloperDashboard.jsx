import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [isLockingMassive, setIsLockingMassive] = useState(false);

  // ==========================================
  // DUMMY DATA: GLOBAL AUDIT LOGS (All-Seeing Eye)
  // ==========================================
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: "5 Apr 2026, 23:05 WIB", actorName: "Root Boss", actorRole: "superadmin", action: "Mempromosikan 'Mas Anton' menjadi Admin Divisi Multimedia." },
    { id: 2, timestamp: "5 Apr 2026, 22:30 WIB", actorName: "Pak Budi", actorRole: "admin", action: "Mengunci individual akun 'Kiel' (IT Support)." },
    { id: 3, timestamp: "5 Apr 2026, 20:15 WIB", actorName: "Nabil", actorRole: "intern", action: "Mengirimkan laporan logbook harian." },
    { id: 4, timestamp: "5 Apr 2026, 18:00 WIB", actorName: "System Cron", actorRole: "system", action: "Menembakkan 15 FCM Push Notification (Reminder Lapor Shift Middle)." },
    { id: 5, timestamp: "5 Apr 2026, 15:45 WIB", actorName: "Siti", actorRole: "intern", action: "Mengajukan izin tukar shift (Swap Shift)." },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 19) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  // ==========================================
  // ACTION: EMERGENCY MASS LOCK
  // ==========================================
  const handleEmergencyLock = async () => {
    const confirmText = window.prompt(
      "🚨 PERINGATAN DARURAT 🚨\n\nTindakan ini akan mengunci (Force Logout) SELURUH akun anak magang di MCC saat ini juga.\n\nKetik 'CONFIRM' (huruf besar) untuk mengeksekusi:"
    );

    if (confirmText === "CONFIRM") {
      setIsLockingMassive(true);
      
      // Simulasi nembak API /emergency-lock
      console.log("Menembak API: POST /api/v1/emergency-lock");
      
      setTimeout(() => {
        setIsLockingMassive(false);
        
        // Nambahin jejak ke Audit Log lokal
        const newLog = {
          id: Date.now(),
          timestamp: "Barusan",
          actorName: user?.nickname || "Developer",
          actorRole: "developer",
          action: "🚨 MENGEKSEKUSI EMERGENCY MASS LOCK. Seluruh akun user dibekukan."
        };
        setAuditLogs([newLog, ...auditLogs]);
        
        alert("EKSEKUSI BERHASIL: Seluruh akun anak magang telah dibekukan. Mereka langsung ditendang ke halaman /locked-page.");
      }, 1500);

    } else if (confirmText !== null) {
      alert("Eksekusi dibatalkan: Teks konfirmasi tidak cocok.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION (TEMA HITAM/MERAH - SYSTEM ROOT)                       */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-br from-[#09090b] to-[#18181b] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-rose-900/20 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-zinc-600/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-rose-500/20 text-rose-400 shadow-inner">
                <i className="fa-solid fa-terminal text-lg"></i>
              </div>
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest">
                System Root Access
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-zinc-500">
              {greeting}, {user?.nickname || "Dev"}
            </h1>
            <p className="text-[14px] text-zinc-400 font-medium max-w-xl leading-relaxed border-l-[3px] border-rose-500/50 pl-4">
              Akses level dewa. Pantau seluruh arus data (Audit Log) dan pegang kendali penuh atas keamanan sistem lintas divisi.
            </p>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-5 rounded-2xl w-full md:w-64 flex items-center gap-4 shadow-inner shrink-0">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 font-bold border border-zinc-700">
               <i className="fa-solid fa-code"></i>
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{user?.full_name || "God Mode"}</p>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">
                {user?.role || "Developer"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* NUCLEAR BUTTON (EMERGENCY LOCK)                                     */}
      {/* ================================================================= */}
      <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
             <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-800 mb-1">Emergency Mass Lock</h3>
            <p className="text-sm text-rose-600 font-medium max-w-xl leading-relaxed">
              Tombol ini akan mengeksekusi Bulk Update <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 text-xs">is_locked = TRUE</code> ke seluruh akun anak magang se-MCC. Gunakan HANYA jika terjadi peretasan atau instruksi darurat dari Direktur.
            </p>
          </div>
        </div>
        <button 
          onClick={handleEmergencyLock}
          disabled={isLockingMassive}
          className="w-full md:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3 shrink-0 disabled:opacity-70 disabled:cursor-wait"
        >
          {isLockingMassive ? (
            <><i className="fa-solid fa-circle-notch fa-spin"></i> Mengeksekusi...</>
          ) : (
            <><i className="fa-solid fa-lock"></i> Kunci Semua Akun</>
          )}
        </button>
      </div>

      {/* ================================================================= */}
      {/* QUICK SHORTCUTS                                                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/manage-admin" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:border-zinc-400 hover:shadow-md transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-chess-king"></i>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Access Control</p>
            <h3 className="text-lg font-black text-slate-800">Manage Admins</h3>
          </div>
        </Link>
        <Link to="/divisions" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:border-zinc-400 hover:shadow-md transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-sitemap"></i>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Organization</p>
            <h3 className="text-lg font-black text-slate-800">Manage Divisi</h3>
          </div>
        </Link>
        <Link to="/reports" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:border-zinc-400 hover:shadow-md transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-database"></i>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Data Center</p>
            <h3 className="text-lg font-black text-slate-800">Analytics & Reports</h3>
          </div>
        </Link>
      </div>

      {/* ================================================================= */}
      {/* GLOBAL AUDIT LOG (ALL-SEEING EYE)                                   */}
      {/* ================================================================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-eye text-indigo-500"></i> Global Audit Logs
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Live Feed
          </span>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="space-y-4">
            {auditLogs.map((log) => {
              // Styling badge actor
              const getActorStyle = (role) => {
                switch(role) {
                  case 'developer': return "bg-zinc-800 text-zinc-100";
                  case 'superadmin': return "bg-purple-100 text-purple-700";
                  case 'admin': return "bg-emerald-100 text-emerald-700";
                  case 'system': return "bg-blue-100 text-blue-700";
                  default: return "bg-slate-200 text-slate-600"; // intern
                }
              };

              return (
                <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${getActorStyle(log.actorRole)}`}>
                    {log.actorRole === 'system' ? <i className="fa-solid fa-robot"></i> : log.actorName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{log.actorName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getActorStyle(log.actorRole)}`}>
                          {log.actorRole}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400"><i className="fa-regular fa-clock mr-1"></i>{log.timestamp}</span>
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${log.action.includes('🚨') ? 'text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100 inline-block mt-1' : 'text-slate-600'}`}>
                      {log.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DeveloperDashboard;