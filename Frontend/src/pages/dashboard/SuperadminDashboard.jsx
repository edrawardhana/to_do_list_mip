import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from "../../api/axios"; // 1. Import Axios instance
import toast from "react-hot-toast";

const SuperadminDashboard = () => {
  const { user } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // ==========================================
  // REAL DATA STATES
  // ==========================================
  const [globalStats, setGlobalStats] = useState({ activeInterns: 0, totalDivisions: 0, pendingApprovals: 0, systemHealth: "Optimal" });
  const [auditLogs, setAuditLogs] = useState([]);
  const [divisionPerformance, setDivisionPerformance] = useState([]);
  const [topInterns, setTopInterns] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch data dari backend saat komponen dimuat
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Asumsi semua data dashboard diambil dari satu endpoint agar efisien
        const response = await api.get('/dashboard/superadmin');
        const data = response.data?.data || response.data;

        // Isi state dengan data asli dari database
        setGlobalStats({
          activeInterns: data.activeInterns || 0,
          totalDivisions: data.totalDivisions || 0,
          pendingApprovals: data.pendingApprovals || 0,
          systemHealth: "Optimal" // Bisa juga diambil dari API jika ada
        });
        setDivisionPerformance(data.divisionPerformance || []);
        setTopInterns(data.topInterns || []);
        setAuditLogs(data.auditLogs || []);

      } catch (error) {
        console.error("Gagal memuat data Superadmin:", error);
        toast.error("Gagal memuat data dashboard. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  // Custom Tooltip buat Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1d1633] border border-purple-500/30 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-[10px] font-black uppercase text-purple-300 mb-1">Divisi {payload[0].payload.name}</p>
          <p className="text-sm font-black text-white">{payload[0].value}% <span className="text-[9px] font-normal text-slate-400">Completed</span></p>
        </div>
      );
    }
    return null;
  };

  // Fungsi bantuan untuk format waktu relatif pada log
  const formatRelativeTime = (timestamp) => {
    // Untuk production, disarankan menggunakan library seperti `date-fns`
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now - date) / 1000);
    if (diffSeconds < 60) return "Baru saja";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mnt lalu`;
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* VVIP COMMAND CENTER: HERO + CHART (MERGED)                        */}
      {/* ================================================================= */}
      <div className="bg-[#1d1633]/95 backdrop-blur-2xl rounded-[2.5rem] text-white shadow-2xl shadow-purple-900/20 border border-purple-500/20 relative overflow-hidden group flex flex-col lg:flex-row min-h-[450px]">
        
        {/* Animated Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-fuchsia-500/30 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* --- BAGIAN KIRI: HERO INFO --- */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-purple-500/20">
          <div>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="relative w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-amber-400 shadow-lg shrink-0">
                   <i className="fa-solid fa-crown text-lg"></i>
                   <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-[#1d1633] rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                      VVIP Access Granted
                    </span>
                    <span className="text-purple-300/60 text-[10px] font-bold tracking-widest uppercase">
                      {formatDate(currentTime)}
                    </span>
                 </div>
               </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-400 drop-shadow-sm">
              Chief Executive.
            </h1>
            
            <div className="max-w-xl border-l-[3px] border-purple-500/50 pl-5 mb-8">
              <p className="text-[14px] md:text-[15px] text-purple-200/80 font-medium leading-relaxed">
                Otoritas tertinggi ekosistem MCC. Pantau <span className="text-white font-bold">Global Metrics</span>, orkestrasi manuver setiap divisi, dan kelola akses operasional dari satu pintu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
             <div className="bg-black/20 backdrop-blur-md border border-purple-500/30 px-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-inner shrink-0">
               <i className="fa-solid fa-satellite-dish text-purple-400 text-lg animate-pulse"></i>
               <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-300/70 leading-none mb-1">Server Clock (WIB)</p>
                  <p className="text-xl font-black tabular-nums tracking-tight text-white leading-none">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
               </div>
             </div>
             
             <Link to="/division-analytics" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg shadow-purple-600/30 transition-all hover:-translate-y-1 uppercase tracking-widest border border-purple-400/50">
                System Analytics <i className="fa-solid fa-arrow-right ml-2"></i>
             </Link>
          </div>
        </div>

        {/* --- BAGIAN KANAN: CHART & LEADERBOARD --- */}
        <div className="w-full lg:w-[450px] xl:w-[500px] p-8 md:p-10 relative z-10 flex flex-col bg-black/[0.15]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-purple-400"></i> Global Performance
              </h3>
              <p className="text-[10px] font-bold text-purple-300/70 mt-1 uppercase tracking-widest">
                Tingkat penyelesaian tugas (%)
              </p>
            </div>
          </div>

          {/* Recharts Area */}
          <div className="h-40 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionPerformance} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#d8b4fe', fontSize: 11, fontWeight: 'bold' }} 
                  dy={8}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={35}>
                  {divisionPerformance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.score >= 90 ? '#10b981' : entry.score >= 80 ? '#a855f7' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Leaderboard */}
          <div className="mt-auto">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3 flex items-center gap-2 animate-pulse">
               <i className="fa-solid fa-fire text-orange-500"></i> Top 3 Interns Global
             </h3>
             <div className="grid grid-cols-3 gap-3">
                {topInterns.map((intern, i) => (
                   <div key={i} className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all hover:-translate-y-1 ${
                     i === 0 ? "bg-gradient-to-br from-amber-500/20 to-orange-500/5 border-amber-500/50 shadow-lg shadow-amber-500/20" : "bg-white/5 border-white/10"
                   }`}>
                      <span className={`text-[11px] font-black mb-1.5 ${
                        i === 0 ? "text-amber-400 drop-shadow-md" : "text-purple-300"
                      }`}>
                        {i === 0 ? <i className="fa-solid fa-trophy"></i> : `#${i + 1}`}
                      </span>
                      <p className="text-xs font-black text-white truncate w-full text-center leading-none">{loading ? '...' : intern.name}</p>
                      <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${i === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{loading ? '...' : `${intern.score}%`}</p>
                   </div>
                ))}
             </div>
          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* BARIS 1: LIVE OVERVIEW STATS                                        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-users text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Total Intern</p>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : globalStats.activeInterns}</h3>
             <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-purple-200 shadow-sm">Aktif</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-building text-slate-300"></i> Tersebar di {globalStats.totalDivisions} Divisi
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-layer-group text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Divisi Ops</p>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-sitemap"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : globalStats.totalDivisions}</h3>
             <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-blue-200 shadow-sm">Unit</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-chart-line text-slate-300"></i> Pantau via Analytics
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-hourglass-half text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Menunggu ACC</p>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : globalStats.pendingApprovals}</h3>
             <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-amber-200 shadow-sm">Antrean</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-clock text-slate-300"></i> Butuh validasi Admin Divisi
            </p>
          </div>
        </div>

        {/* Card 4: System Health (Gradient) */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 rounded-[2rem] p-7 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-600/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
             <i className="fa-solid fa-heart-pulse text-8xl"></i>
           </div>

           <div className="flex justify-between items-start mb-5 relative z-10">
             <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-200 mt-1">Status Server</p>
             <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform border border-white/20">
                <i className="fa-solid fa-heart-pulse animate-pulse text-rose-300"></i>
             </div>
           </div>

           <div className="relative z-10 flex-1">
              <h3 className="text-3xl md:text-4xl font-black mb-1 leading-tight tracking-tight">{globalStats.systemHealth}</h3>
              <p className="text-[12px] font-medium text-purple-100/90 mb-5">Semua node berjalan lancar</p>
           </div>

           <div className="relative z-10 mt-auto">
              <div className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-white bg-white/10 border border-white/20 px-4 py-3 rounded-xl uppercase tracking-widest backdrop-blur-md cursor-default">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span> All Systems Go
              </div>
           </div>
        </div>
        
      </div>

      {/* ================================================================= */}
      {/* BARIS 2: SHORTCUTS & ACTIVITY LOG                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-5 flex items-center">
              <i className="fa-solid fa-bolt text-purple-500 mr-2"></i> Executive Command
            </h3>
            
            <div className="space-y-3 flex-1">
              <Link to="/manage-admin" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-purple-200 hover:bg-purple-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-purple-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-user-shield"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Role Access</h4>
                    <p className="text-[11px] font-medium text-slate-500">Mutasi & promote Admin</p>
                 </div>
              </Link>

              <Link to="/division-analytics" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-sitemap"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Divisions</h4>
                    <p className="text-[11px] font-medium text-slate-500">Manajemen struktur divisi</p>
                 </div>
              </Link>

              <Link to="/broadcasts" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-200 hover:bg-emerald-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-bullhorn"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Broadcast</h4>
                    <p className="text-[11px] font-medium text-slate-500">Kirim instruksi massal</p>
                 </div>
              </Link>

              <Link to="/reports" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-amber-200 hover:bg-amber-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-amber-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-file-invoice"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Global Reports</h4>
                    <p className="text-[11px] font-medium text-slate-500">Unduh rekapitulasi data</p>
                 </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Global Audit Log */}
        <div className="lg:col-span-2 bg-[#1d1633] rounded-[2.5rem] border border-purple-500/20 shadow-lg overflow-hidden flex flex-col h-full min-h-[450px]">
          <div className="px-8 py-5 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest font-mono">
              <i className="fa-solid fa-radar text-rose-400 mr-2 animate-pulse"></i>Global Audit Log
            </h3>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Feed
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-black/10 font-mono text-sm">
            <div className="space-y-4">
              
              {auditLogs.map((log, index) => {
                 let roleStyle = "bg-slate-800 text-slate-400 border-slate-700";
                 if (log.actor_role === "super_admin") roleStyle = "bg-purple-500/20 text-purple-400 border-purple-500/30";
                 if (log.actor_role === "admin") roleStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                 if (log.actor_role === "system") roleStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";

                 return (
                   <div key={log.id || index} className="flex flex-col sm:flex-row sm:items-start gap-3 border-b border-white/5 pb-4 hover:bg-white/[0.03] transition-colors p-2 rounded-lg">
                      <div className="text-purple-300/50 text-[11px] shrink-0 pt-0.5 w-[80px]">[{formatRelativeTime(log.created_at)}]</div>
                      <div>
                         <div className="flex flex-wrap items-center gap-2 mb-1">
                           <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${roleStyle}`}>{log.actor_role}</span>
                           <span className="text-white font-bold">{log.actor?.full_name || 'System'}</span>
                         </div>
                         <p className="text-purple-200/70 text-xs leading-relaxed">{log.action}</p>
                      </div>
                   </div>
                 )
              })}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperadminDashboard;