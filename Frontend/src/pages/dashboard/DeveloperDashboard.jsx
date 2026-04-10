import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [isLockingMassive, setIsLockingMassive] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Fake Live Stats State (Biar UI kerasa hidup)
  const [sysStats, setSysStats] = useState({ cpu: 32, ram: 45, ping: 12, db: 68, api: 99.9 });

  // ==========================================
  // DUMMY DATA: GLOBAL AUDIT LOGS
  // ==========================================
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: "23:05:12", actorName: "Root Boss", actorRole: "superadmin", action: "Mempromosikan 'Mas Anton' menjadi Admin Divisi Multimedia.", type: "warning" },
    { id: 2, timestamp: "22:30:45", actorName: "Pak Budi", actorRole: "admin", action: "Mengunci individual akun 'Kiel' (IT Support).", type: "danger" },
    { id: 3, timestamp: "20:15:00", actorName: "Nabil", actorRole: "intern", action: "Mengirimkan laporan logbook harian.", type: "info" },
    { id: 4, timestamp: "18:00:01", actorName: "System Cron", actorRole: "system", action: "Menembakkan 15 FCM Push Notification.", type: "system" },
    { id: 5, timestamp: "15:45:22", actorName: "Siti", actorRole: "intern", action: "Mengajukan izin tukar shift (Swap Shift).", type: "info" },
    { id: 6, timestamp: "14:10:05", actorName: "System DB", actorRole: "system", action: "Auto-backup PostgreSQL (Success).", type: "success" },
  ]);

  useEffect(() => {
    // Interval buat animasi fake stats server
    const interval = setInterval(() => {
      setSysStats(prev => ({
        cpu: Math.floor(Math.random() * (45 - 20 + 1) + 20),
        ram: Math.floor(Math.random() * (50 - 42 + 1) + 42),
        ping: Math.floor(Math.random() * (18 - 8 + 1) + 8),
        db: prev.db, // Static
        api: prev.api // Static
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // ACTIONS: ROOT COMMANDS
  // ==========================================
  const handleEmergencyLock = async () => {
    const confirmText = window.prompt(
      "🚨 PERINGATAN DARURAT 🚨\n\nTindakan ini akan mengunci (Force Logout) SELURUH akun anak magang di MCC.\n\nKetik 'CONFIRM' untuk mengeksekusi:"
    );

    if (confirmText === "CONFIRM") {
      setIsLockingMassive(true);
      setTimeout(() => {
        setIsLockingMassive(false);
        const newLog = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          actorName: user?.nickname || "Developer",
          actorRole: "developer",
          action: "🚨 MENGEKSEKUSI EMERGENCY MASS LOCK. Seluruh akun user dibekukan.",
          type: "danger"
        };
        setAuditLogs([newLog, ...auditLogs]);
        alert("EKSEKUSI BERHASIL: Seluruh akun anak magang telah dibekukan.");
      }, 1500);
    }
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      setIsClearingCache(false);
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        actorName: "System",
        actorRole: "system",
        action: "🧹 System Cache & Redis berhasil dibersihkan secara manual.",
        type: "success"
      };
      setAuditLogs([newLog, ...auditLogs]);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION: TERMINAL AESTHETIC                                    */}
      {/* ================================================================= */}
      <div className="bg-[#09090b] rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-stretch gap-6 group">
        
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-rose-500/20 transition-all duration-1000"></div>

        {/* Hero Content Kiri */}
        <div className="relative z-10 p-8 md:p-10 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md flex items-center gap-2 bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-rose-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              CONNECTION SECURED
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white leading-tight">
            Core Infrastructure <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-zinc-400">
              Online & Active.
            </span>
          </h1>
          
          {/* Fake Terminal Block (Menampilkan proses login lu) */}
          <div className="mt-4 bg-[#0f0f11] border border-zinc-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-w-lg shadow-inner">
             <div className="flex gap-2 mb-2 border-b border-zinc-800/50 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
             </div>
             <p className="text-zinc-500">Last login: {new Date().toLocaleString('id-ID')} on ttys001</p>
             <p className="text-zinc-400 mt-1"><span className="text-emerald-400">root@mcc-server</span><span className="text-zinc-500">:~#</span> su - {user?.nickname?.toLowerCase() || "developer"}</p>
             <p className="text-zinc-500">Authenticating God Mode protocols...</p>
             <p className="text-emerald-400 animate-pulse mt-1">Access Granted.</p>
          </div>
        </div>

        {/* Hero Stats Kanan */}
        <div className="relative z-10 bg-[#141417] border-l border-zinc-800 p-8 md:p-10 w-full md:w-[350px] shrink-0 flex flex-col justify-center">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
             <i className="fa-solid fa-server text-rose-500"></i> System Vitals
           </h3>
           
           <div className="space-y-5">
             <div>
               <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
                 <span className="text-zinc-400">CPU LOAD</span>
                 <span className="text-emerald-400">{sysStats.cpu}%</span>
               </div>
               <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${sysStats.cpu}%` }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
                 <span className="text-zinc-400">MEMORY (RAM)</span>
                 <span className="text-amber-400">{sysStats.ram}%</span>
               </div>
               <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                 <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${sysStats.ram}%` }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
                 <span className="text-zinc-400">DB PING</span>
                 <span className="text-sky-400">{sysStats.ping}ms</span>
               </div>
               <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                 <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${(sysStats.ping / 50) * 100}%` }}></div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4 SYSTEM METRICS CARDS (KHUSUS DEV)                                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
         {/* Card 1: Database */}
         <div className="bg-[#18181b] p-6 rounded-[2rem] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-600 transition-colors flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-4">
              <i className="fa-solid fa-database text-xl text-blue-500"></i>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Online</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Database Load</p>
              <h3 className="text-2xl font-black text-zinc-200">{sysStats.db}<span className="text-sm font-bold text-zinc-500 ml-1">%</span></h3>
            </div>
         </div>

         {/* Card 2: Storage */}
         <div className="bg-[#18181b] p-6 rounded-[2rem] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-600 transition-colors flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-4">
              <i className="fa-solid fa-hard-drive text-xl text-amber-500"></i>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Safe</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Storage Used</p>
              <h3 className="text-2xl font-black text-zinc-200">1.2<span className="text-sm font-bold text-zinc-500 ml-1">GB</span></h3>
            </div>
         </div>

         {/* Card 3: API Health */}
         <div className="bg-[#18181b] p-6 rounded-[2rem] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-600 transition-colors flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-4">
              <i className="fa-solid fa-network-wired text-xl text-emerald-500"></i>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Optimal</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">API Uptime</p>
              <h3 className="text-2xl font-black text-zinc-200">{sysStats.api}<span className="text-sm font-bold text-zinc-500 ml-1">%</span></h3>
            </div>
         </div>

         {/* Card 4: Error Rate */}
         <div className="bg-[#18181b] p-6 rounded-[2rem] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-600 transition-colors flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-4">
              <i className="fa-solid fa-bug text-xl text-rose-500"></i>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Clean</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Exceptions</p>
              <h3 className="text-2xl font-black text-zinc-200">0<span className="text-sm font-bold text-zinc-500 ml-1">/hr</span></h3>
            </div>
         </div>
      </div>

      {/* ================================================================= */}
      {/* MAIN LAYOUT: KIRI (COMMANDS & SHORTCUTS) | KANAN (AUDIT LOGS)       */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: ROOT COMMAND CENTER & SHORTCUTS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ROOT COMMAND CENTER */}
          <div className="bg-[#141417] border border-zinc-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-xs font-black text-zinc-200 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-zinc-800/50 pb-4">
              <i className="fa-solid fa-terminal text-rose-500"></i> Root Commands
            </h3>
            
            <div className="space-y-3">
              {/* Emergency Button */}
              <button 
                onClick={handleEmergencyLock}
                disabled={isLockingMassive}
                className="w-full p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-lg">
                    <i className={`fa-solid ${isLockingMassive ? 'fa-circle-notch fa-spin' : 'fa-radiation'} group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm">Emergency Lock</h4>
                    <p className="text-[10px] text-rose-400/70 font-medium mt-0.5">Force logout semua intern</p>
                  </div>
                </div>
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </button>

              {/* Clear Cache Button */}
              <button 
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="w-full p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">
                    <i className={`fa-solid ${isClearingCache ? 'fa-circle-notch fa-spin' : 'fa-broom'} group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm">Clear Redis Cache</h4>
                    <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">Bersihkan memori sistem</p>
                  </div>
                </div>
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </button>

              {/* Database Backup */}
              <button 
                onClick={() => alert("Simulasi: Mengirim command pg_dump ke server database...")}
                className="w-full p-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-500 rounded-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-lg">
                    <i className="fa-solid fa-database group-hover:scale-110 transition-transform"></i>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm">Force DB Backup</h4>
                    <p className="text-[10px] text-sky-400/70 font-medium mt-0.5">Trigger manual dump SQL</p>
                  </div>
                </div>
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </button>
            </div>
          </div>

          {/* QUICK SHORTCUTS */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Master Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/manage-admin" className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl hover:border-zinc-500 transition-colors flex flex-col gap-2">
                <i className="fa-solid fa-chess-king text-purple-400 text-lg"></i>
                <span className="text-[11px] font-bold text-zinc-300">Access Control</span>
              </Link>
              <Link to="/system-config" className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl hover:border-zinc-500 transition-colors flex flex-col gap-2">
                <i className="fa-solid fa-sliders text-emerald-400 text-lg"></i>
                <span className="text-[11px] font-bold text-zinc-300">Sys Config</span>
              </Link>
              <Link to="/division-analytics" className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl hover:border-zinc-500 transition-colors flex flex-col gap-2">
                <i className="fa-solid fa-sitemap text-blue-400 text-lg"></i>
                <span className="text-[11px] font-bold text-zinc-300">Analytics</span>
              </Link>
              <Link to="/broadcasts" className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl hover:border-zinc-500 transition-colors flex flex-col gap-2">
                <i className="fa-solid fa-bullhorn text-amber-400 text-lg"></i>
                <span className="text-[11px] font-bold text-zinc-300">Broadcast</span>
              </Link>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: GLOBAL AUDIT LOG (Terminal Style) */}
        <div className="lg:col-span-7 bg-[#09090b] rounded-[2rem] border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[700px]">
          <div className="px-6 py-5 border-b border-zinc-800 bg-[#141417] flex justify-between items-center shrink-0">
            <h3 className="text-sm font-black text-zinc-200 flex items-center gap-3">
              <i className="fa-solid fa-list-ul text-emerald-500"></i> Global Audit Stream
            </h3>
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live
            </span>
          </div>
          
          {/* List Log Terminal */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-sm bg-[#09090b]">
            <div className="space-y-1">
              {auditLogs.map((log) => {
                // Pewarnaan berdasarkan Tipe
                const colorMap = {
                  system: "text-blue-400",
                  warning: "text-amber-400",
                  danger: "text-rose-500",
                  info: "text-zinc-400",
                  success: "text-emerald-400"
                };
                const logColor = colorMap[log.type] || "text-zinc-400";

                return (
                  <div key={log.id} className="p-2.5 hover:bg-zinc-900/50 rounded-lg transition-colors border border-transparent hover:border-zinc-800/50 flex flex-col gap-1 group">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="text-zinc-500">[{log.timestamp}]</span>
                      <span className={`uppercase font-black px-1.5 rounded bg-zinc-800 border border-zinc-700 ${
                        log.actorRole === 'superadmin' ? 'text-purple-400' :
                        log.actorRole === 'developer' ? 'text-zinc-300' :
                        log.actorRole === 'admin' ? 'text-blue-400' : 
                        log.actorRole === 'system' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {log.actorRole}
                      </span>
                      <span className="text-zinc-300 font-bold">{log.actorName}</span>
                    </div>
                    <div className="flex items-start gap-2.5 pl-1">
                      <i className={`fa-solid fa-angle-right mt-1 text-[9px] ${logColor}`}></i>
                      <p className={`${logColor} leading-relaxed text-[12px] ${log.type === 'danger' ? 'bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 mt-0.5' : ''}`}>
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

    </div>
  );
};

export default DeveloperDashboard;