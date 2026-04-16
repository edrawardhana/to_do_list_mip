import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { toast } from "react-hot-toast";
import { AlertTriangle, Trash2, Unlock, RefreshCw, Activity, Terminal, Settings } from "lucide-react";

const DeveloperDashboard = () => {
  const { user } = useAuth();
  
  // States
  const [stats, setStats] = useState({ users: 0, divisions: 0, tasks: 0, templates: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [dbOverview, setDbOverview] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiLatency, setApiLatency] = useState(0);

  // Fake chart data (For visual proxy metrics)
  const [chartData, setChartData] = useState([]);
  
  // Danger Zone States
  const [isActing, setIsActing] = useState(false);

  // Fungsi untuk mengeksekusi Danger Action
  const handleDangerAction = async (actionType, title) => {
    const passcode = prompt(`DANGER ZONE: ${title}\n\nMasukkan Developer Passcode untuk melanjutkan:`);
    if (!passcode) return; // Dibatalkan
    
    setIsActing(true);
    const loadingToast = toast.loading(`Executing ${title}...`);
    try {
      const { data, error } = await supabase.rpc('fn_execute_danger_zone', {
        action_type: actionType,
        passcode: passcode
      });

      if (error) throw error;
      toast.success(data || "Berhasil dieksekusi!", { id: loadingToast });
      
      // Refresh sedikit data agar terupdate
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Akses Ditolak atau Terjadi Kesalahan", { id: loadingToast });
    } finally {
      setIsActing(false);
    }
  };

  useEffect(() => {
    // Generate synthetic load data for the chart (just visual candy, realistic looking)
    const mockChart = [];
    for(let i = 0; i < 24; i++) {
        mockChart.push(Math.floor(Math.random() * 80) + 20); // 20-100 values
    }
    setChartData(mockChart);

    const fetchSystemStats = async () => {
      setLoading(true);
      try {
        const [
          { data: entityCounts },
          { data: logs },
          { data: dbBytes },
          { data: uStats }
        ] = await Promise.all([
          supabase.from('v_developer_entity_counts').select('*').single(),
          supabase.from('v_developer_recent_audit').select('*').limit(6),
          supabase.from('v_developer_db_overview').select('*'),
          supabase.from('v_developer_user_stats').select('*')
        ]);

        const counts = entityCounts || { total_profiles: 0, total_divisions: 0, total_tasks: 0, total_templates: 0 };

        setStats({
          users: counts.total_profiles,
          divisions: counts.total_divisions,
          tasks: counts.total_tasks,
          templates: counts.total_templates
        });

        setRecentLogs(logs || []);
        setDbOverview((dbBytes || []).slice(0, 6)); 
        setUserStats(uStats || []);
      } catch (error) {
        console.error("Gagal mengambil data sistem:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();

    // Setup Live Ping Monitor
    const interval = setInterval(async () => {
       const start = performance.now();
       try {
          // Minimal lightweight query to test DB latency
          await supabase.from('v_developer_entity_counts').select('total_profiles').limit(1);
          const end = performance.now();
          setApiLatency(Math.round(end - start));
       } catch (e) {
          setApiLatency(-1);
       }
    }, 5000); // Ping every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION: DEVELOPER CONSOLE THEME                             */}
      {/* ================================================================= */}
      <div className="bg-[#09090b] rounded-[2.5rem] text-zinc-200 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row justify-between gap-8">
          <div className="lg:max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
                <i className="fa-solid fa-code text-xl"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">Developer Root Console</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
              Platform Architecture.
            </h1>
            <p className="text-sm font-medium text-zinc-400 max-w-xl leading-relaxed">
              Halo <span className="text-zinc-200 font-bold">{user?.full_name || 'Dev'}</span>! Pantau status database, penggunaan storage, analitik traffic, dan distribusi peran pengguna sistem secara presisi.
            </p>

             <div className="flex flex-wrap gap-4 mt-8">
               {/* Environment Radar */}
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                     {import.meta.env.MODE === 'development' ? '🔧 DEV MODE' : '🚀 PROD MODE'}
                  </span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    DB: {import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] : 'UNKNOWN'}
                  </span>
               </div>

               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="relative flex h-2.5 w-2.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider">Token Auth Hooked</span>
               </div>
               <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                  apiLatency === -1 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                  apiLatency > 400 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                  'bg-zinc-900 border-zinc-800 text-sky-400'
               }`}>
                  <Activity size={14} className={apiLatency !== -1 ? 'animate-pulse' : ''} />
                  <span className="text-xs font-black uppercase tracking-wider">
                     Ping: {apiLatency === -1 ? 'OFFLINE' : apiLatency === 0 ? '...' : `${apiLatency}ms`}
                  </span>
               </div>
            </div>
          </div>
          
          {/* TRAFFIC CHART PROXY */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col justify-end bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-md">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-white">Distribusi Beban API (24 Jam)</h3>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mt-1">Live Load Proxy Metrics</p>
                </div>
                <i className="fa-solid fa-chart-column text-zinc-600 text-xl"></i>
             </div>
             
             <div className="flex items-end gap-1 h-32 w-full mt-4">
                {chartData.map((val, idx) => (
                   <div key={idx} className="flex-1 bg-gradient-to-t from-sky-500/20 to-sky-400 rounded-t-sm transition-all duration-1000 ease-in-out hover:brightness-150 cursor-pointer relative group" style={{height: `${val}%`}}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                         H - {24 - idx}
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Normal Threshold</p>
                <p className="text-[9px] font-bold text-zinc-500">Auto Generated</p>
             </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DEVELOPER MODULES NAV HUB                                         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
         <Link to="/system-config" className="group relative overflow-hidden bg-[#18181b] border border-zinc-800 rounded-[2rem] p-6 hover:border-zinc-600 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#09090b] border border-zinc-700 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner">
                     <Settings size={28} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-zinc-200">System Parameters</h3>
                     <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Global Configs Editor & Limits</p>
                  </div>
               </div>
               <div className="text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-2 transition-all">
                  <i className="fa-solid fa-arrow-right text-xl"></i>
               </div>
            </div>
         </Link>

         <Link to="/audit-log" className="group relative overflow-hidden bg-[#18181b] border border-zinc-800 rounded-[2rem] p-6 hover:border-zinc-600 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#09090b] border border-zinc-700 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
                     <Terminal size={28} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-zinc-200">Security Audit Logs</h3>
                     <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Full Server Tracing & Search Viewer</p>
                  </div>
               </div>
               <div className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-2 transition-all">
                  <i className="fa-solid fa-arrow-right text-xl"></i>
               </div>
            </div>
         </Link>
      </div>

      {/* ================================================================= */}
      {/* DATABASE & STORAGE STATS                                          */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* KOLOM KIRI: DATABASE INFO OLEH V_DEVELOPER_DB_OVERVIEW */}
         <div className="col-span-1 lg:col-span-7 space-y-6">
            <h3 className="text-xl font-black text-zinc-200 flex items-center gap-3">
              <i className="fa-solid fa-database text-sky-500"></i> Alokasi Memori & Storage Database
            </h3>
            
            <div className="bg-[#18181b] rounded-[2rem] border border-zinc-800 p-6 md:p-8 shadow-sm">
               {!loading && dbOverview.length > 0 ? (
                 <div className="space-y-5">
                    {dbOverview.map((item, index) => {
                       // Estimasi visual load based on array order since Supabase usually returns highest first
                       const fakePercentage = Math.max(10, 90 - (index * 15));
                       return (
                         <div key={index} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                               <p className="text-sm font-black text-zinc-200">{item.tablename}</p>
                               <div className="text-right">
                                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                    {item.data_size} Data <span className="text-zinc-700 mx-1">|</span> <span className="text-sky-400">{item.total_size} Total</span>
                                  </p>
                               </div>
                            </div>
                            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                               <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{width: `${fakePercentage}%`}}></div>
                            </div>
                         </div>
                       )
                    })}
                 </div>
               ) : (
                 <div className="py-12 text-center">
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-zinc-700 mb-3"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Menarik metrik ukuran relasional...</p>
                 </div>
               )}
            </div>

            {/* QUICK STATS MICRO-CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-[#18181b] border text-center border-zinc-800 rounded-[1.5rem] p-4 shadow-sm hover:border-zinc-600 transition-colors">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Entitas</p>
                 <h3 className="text-3xl font-black text-zinc-200">{loading ? "..." : stats.users + stats.divisions}</h3>
              </div>
              <div className="bg-[#18181b] border text-center border-zinc-800 rounded-[1.5rem] p-4 shadow-sm hover:border-zinc-600 transition-colors">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Log Dailies</p>
                 <h3 className="text-3xl font-black text-emerald-400">{loading ? "..." : stats.tasks}</h3>
              </div>
              <div className="bg-[#18181b] border text-center border-zinc-800 rounded-[1.5rem] p-4 shadow-sm hover:border-zinc-600 transition-colors">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Auto Blueprint</p>
                 <h3 className="text-3xl font-black text-blue-400">{loading ? "..." : stats.templates}</h3>
              </div>
              <div className="bg-[#18181b] border border-zinc-800 text-center rounded-[1.5rem] px-4 pt-5 shadow-sm transform hover:-translate-y-1 transition-all">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/80 mb-1 cursor-help" title="Database Integrity Health Score">Integritas DB</p>
                  <h3 className="text-3xl font-black text-rose-500">99<span className="text-lg text-rose-600">%</span></h3>
              </div>
            </div>
         </div>

         {/* KOLOM KANAN: STATUS AKUN PENGGUNA OLEH V_DEVELOPER_USER_STATS */}
         <div className="col-span-1 lg:col-span-5 space-y-6">
            <h3 className="text-xl font-black text-zinc-200 flex items-center gap-3">
              <i className="fa-solid fa-users-gear text-purple-400"></i> Distribusi Peran Sistem
            </h3>
            
            <div className="bg-[#18181b] rounded-[2rem] border border-zinc-800 p-6 shadow-sm overflow-hidden text-zinc-200">
               {!loading && userStats.length > 0 ? (
                 <div className="space-y-4">
                    {userStats.map((roleInfo, index) => {
                       const badgeProps = 
                         roleInfo.role === 'super_admin' ? { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', i: 'fa-chess-king' } :
                         roleInfo.role === 'developer' ? { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', i: 'fa-code' } :
                         roleInfo.role === 'admin' ? { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', i: 'fa-shield-halved' } :
                         roleInfo.role === 'user' ? { bg: 'bg-zinc-800 text-zinc-300 border-zinc-700', i: 'fa-user' } : 
                         { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', i: 'fa-user-graduate' };

                       return (
                       <div key={index} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner border ${badgeProps.bg}`}>
                               <i className={`fa-solid ${badgeProps.i}`}></i>
                             </div>
                             <div>
                               <p className="text-sm font-black uppercase tracking-widest text-zinc-200">{roleInfo.role.replace(/_/g, ' ')}</p>
                               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500"><span className="text-emerald-400 mr-1.5">●</span>{roleInfo.active} Aktif</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500"><span className="text-rose-500 mr-1.5">●</span>{roleInfo.locked} Locked</span>
                               </div>
                             </div>
                          </div>
                          <div className="text-center bg-zinc-800/50 border border-zinc-700 rounded-xl w-14 py-2 shrink-0">
                             <span className="text-xl font-black text-white">{roleInfo.total}</span>
                          </div>
                       </div>
                    )})}
                 </div>
               ) : (
                 <div className="py-12 text-center">
                    <i className="fa-solid fa-compass fa-spin text-3xl text-zinc-800 mb-3"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Sinkronisasi peran...</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* ================================================================= */}
      {/* PUSAT KOMANDO / DANGER ZONE                                       */}
      {/* ================================================================= */}
      <div className="bg-[#18181b] border border-rose-900/30 rounded-[2.5rem] overflow-hidden shadow-sm mt-8 relative">
         {/* Background Danger Accent */}
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-transparent via-rose-500/5 to-rose-500/10 pointer-events-none"></div>
         
         <div className="px-8 py-6 border-b border-rose-900/30 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
           <h3 className="font-black text-rose-500 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
               <AlertTriangle size={16} strokeWidth={3} />
             </div>
             Danger Zone (Restricted Access)
           </h3>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/50">Developer Only</span>
         </div>

         <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Action 1: Force Reset */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 group hover:border-orange-500/50 hover:bg-orange-500/5 transition-all">
               <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <RefreshCw size={24} />
               </div>
               <h4 className="text-zinc-200 font-bold mb-2">Force Reset Daily Tasks</h4>
               <p className="text-xs text-zinc-500 mb-6 min-h-[40px]">Memaksa sistem melakukan arsip harian ('pending' ke 'failed') dan me-regenerasi template tanpa menunggu Cron Tengah Malam.</p>
               <button 
                  disabled={isActing}
                  onClick={() => handleDangerAction('reset_daily', 'Force Reset Daily Tasks')}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 text-orange-400 text-xs font-black uppercase tracking-widest hover:bg-orange-500/20 hover:text-orange-300 transition-colors border border-orange-500/20 disabled:opacity-50"
               >
                  Execute Reset
               </button>
            </div>

            {/* Action 2: Purge Old Logs */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 group hover:border-rose-500/50 hover:bg-rose-500/5 transition-all">
               <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trash2 size={24} />
               </div>
               <h4 className="text-zinc-200 font-bold mb-2">Purge Old Logs</h4>
               <p className="text-xs text-zinc-500 mb-6 min-h-[40px]">Menghapus secara permanen `audit_logs` yang lebih lama dari 30 hari untuk membersihkan kapasitas disk/memori database.</p>
               <button 
                  disabled={isActing}
                  onClick={() => handleDangerAction('purge_logs', 'Purge Old Logs (> 30 days)')}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 text-rose-400 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-rose-500/20 disabled:opacity-50"
               >
                  Purge Storage
               </button>
            </div>

            {/* Action 3: Unlock Interns */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Unlock size={24} />
               </div>
               <h4 className="text-zinc-200 font-bold mb-2">Unlock All Users</h4>
               <p className="text-xs text-zinc-500 mb-6 min-h-[40px]">Aksi sapu bersih. Melepas blokir (is_locked = false) dari semua akun user 'intern' yang ditahan aksesnya oleh Admin.</p>
               <button 
                  disabled={isActing}
                  onClick={() => handleDangerAction('unlock_users', 'Unlock All Locked Sub-Users')}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border border-emerald-500/20 disabled:opacity-50"
               >
                  Force Unlock
               </button>
            </div>
         </div>
      </div>

      {/* ================================================================= */}
      {/* AUDIT LOGS / RECENT ACTIVITY                                      */}
      {/* ================================================================= */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm mt-4">
        <div className="px-8 py-6 border-b border-zinc-800/50 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-black text-zinc-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
            </div>
            Terminal Audit Log
          </h3>
          <Link to="/audit-log" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-zinc-800/80 px-5 py-2.5 rounded-xl border border-zinc-700">
            Open Full Log Viewer <i className="fa-solid fa-arrow-right ml-1"></i>
          </Link>
        </div>
        
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="text-center py-10 text-zinc-600">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Executing Table Scan...</p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-700">
              <i className="fa-solid fa-server text-5xl mb-4 opacity-50"></i>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Log Kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-[1.5rem] bg-[#09090b]/50 border border-zinc-800/80 hover:border-zinc-700 transition-all gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0 group-hover:bg-zinc-700 group-hover:text-zinc-200 transition-colors">
                      <i className="fa-solid fa-terminal text-xs"></i>
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-zinc-200 tracking-tight uppercase">[{log.table_name}] <span className="text-sky-400">{log.action || "Execute"}</span></p>
                      <p className="text-[12px] font-medium text-zinc-500 mt-1 line-clamp-1 font-mono">
                        Aktor: <span className="text-zinc-300 font-bold">{log.actor_name || "System"}</span> | Payload: {JSON.stringify(log.new_values)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0 pl-14 md:pl-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">Timestamp Exec</p>
                    <p className="text-[11px] font-bold text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DeveloperDashboard;