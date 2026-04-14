import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Import Recharts sebagai ganti Chameleon
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "../../api/axios";

const AdminDashboard = () => {
  const { user } = useAuth();
  const myDivision = user?.division?.name || user?.division_name || "IT Support";
  const [loading, setLoading] = useState(true);

  // State untuk Real Data
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ onSiteInterns: 0, totalInterns: 0, pendingTasks: 0, pendingUsers: 0 });
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/admin');
        const data = response.data?.data || response.data;
        
        setChartData(data.chartData || []);
        setStats({
          onSiteInterns: data.stats?.onSiteInterns ?? data.onSiteInterns ?? 0,
          totalInterns: data.stats?.totalInterns ?? data.totalInterns ?? 0,
          pendingTasks: data.stats?.pendingTasks ?? data.pendingTasks ?? 0,
          pendingUsers: data.stats?.pendingUsers ?? data.pendingUsers ?? 0,
        });
        setActivityLogs(data.activityLogs || []);
      } catch (error) {
        console.error("Gagal mengambil data admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Palette warna custom biar senada sama dashboard
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      {/* ================================================================= */}
      {/* ADMIN COMMAND CENTER: HERO + CHART (MERGED)                       */}
      {/* ================================================================= */}
      <div className="bg-blue-950/95 backdrop-blur-2xl rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 relative overflow-hidden group flex flex-col lg:flex-row min-h-[450px]">
        {/* Animated Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* --- BAGIAN KIRI: HERO INFO --- */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-emerald-400 shadow-lg shrink-0">
                   <i className="fa-solid fa-server text-lg"></i>
                   <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-blue-950 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                 </div>
                 <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                   System Online • {myDivision}
                 </span>
               </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-white drop-shadow-sm">
              Admin Workspace.
            </h1>
            
            <div className="max-w-xl border-l-[3px] border-blue-400/50 pl-5 mb-8">
              <p className="text-[14px] md:text-[15px] text-blue-100/80 font-medium leading-relaxed">
                Akses kendali penuh. Pantau lalu lintas tugas, validasi laporan, dan kelola aktivitas operasional anak magang secara real-time.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
             <Link to="/approval" className="bg-white text-blue-900 px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:-translate-y-1">
                Validasi Tugas <i className="fa-solid fa-arrow-right ml-2"></i>
             </Link>
             <Link to="/tasks" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3.5 rounded-2xl text-sm font-black hover:bg-white/20 transition-all">
                Buat Task
             </Link>
          </div>
        </div>

        {/* --- BAGIAN KANAN: CHART DONAT --- */}
        <div className="w-full lg:w-[450px] xl:w-[500px] p-8 md:p-10 relative z-10 flex flex-col bg-white/[0.02]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                Top Kontribusi Intern
              </h3>
              <p className="text-[11px] font-medium text-blue-200/70 mt-1">
                Berdasarkan task yang di-ACC.
              </p>
            </div>
            <select className="bg-blue-900/50 border border-white/10 text-[10px] font-bold text-blue-100 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 shadow-sm cursor-pointer backdrop-blur-md">
              <option className="text-slate-800">April 2026</option>
              <option className="text-slate-800">Maret 2026</option>
            </select>
          </div>

          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-blue-200/50 text-xs font-bold uppercase tracking-widest">
                  {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Memuat Data...</> : "Tidak Ada Data"}
                </div>
              ) : (
                <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="tasks"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Tugas`, 'Diselesaikan']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={40} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#93c5fd' }} // text-blue-300
                />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* BARIS 1: LIVE OVERVIEW STATS                                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Anak Magang Aktif */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-users text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Anak Magang</p>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : stats.onSiteInterns}</h3>
             <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-emerald-200 shadow-sm">On-Site</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-circle-info text-slate-300"></i> Dari {stats.totalInterns} orang di divisi
            </p>
          </div>
        </div>

        {/* Card 2: Antrean Approval */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-clipboard-list text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Antrean ACC</p>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : stats.pendingTasks}</h3>
             <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-amber-200 shadow-sm">Tugas</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-envelope-open-text text-slate-300"></i> Plus 2 pengajuan izin
            </p>
          </div>
        </div>

        {/* Card 3: Pending ACC */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none"><i className="fa-solid fa-user-clock text-8xl"></i></div>
          
          <div className="flex justify-between items-start mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">Pending User</p>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-user-shield"></i>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
             <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{loading ? '...' : stats.pendingUsers}</h3>
             <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-rose-200 shadow-sm">Baru</span>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
               <i className="fa-solid fa-triangle-exclamation text-slate-300"></i> Segera verifikasi data
            </p>
          </div>
        </div>

        {/* Card 4: Broadcast Pengumuman */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-[2rem] p-7 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group flex flex-col h-full hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-1.5 transition-all duration-300">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
             <i className="fa-solid fa-tower-broadcast text-8xl"></i>
           </div>

           <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200 mt-1">Informasi</p>
                 <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform border border-white/20">
                    <i className="fa-solid fa-bullhorn"></i>
                 </div>
              </div>
              <h3 className="text-2xl font-black mb-1 leading-tight tracking-tight">Broadcast<br/>Pesan</h3>
              <p className="text-[12px] font-medium text-blue-100/90 mb-5">Kirim info darurat ke divisi</p>
           </div>

           <div className="relative z-10 mt-auto">
              <Link to="/broadcasts" className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-blue-600 bg-white hover:bg-slate-50 px-4 py-3.5 rounded-xl transition-colors shadow-sm uppercase tracking-widest">
                 Kirim <i className="fa-solid fa-arrow-right"></i>
              </Link>
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
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-5">
              <i className="fa-solid fa-bolt text-blue-500 mr-2"></i>Aksi Cepat
            </h3>
            
            <div className="space-y-3 flex-1">
              <Link to="/approval" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-check-to-slot"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Approval Center</h4>
                    <p className="text-[11px] font-medium text-slate-500">Validasi tugas & izin</p>
                 </div>
              </Link>

              <Link to="/manage-intern" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-200 hover:bg-emerald-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-users-gear"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Manage Interns</h4>
                    <p className="text-[11px] font-medium text-slate-500">Manajemen akun magang</p>
                 </div>
              </Link>

              <Link to="/tasks" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-purple-200 hover:bg-purple-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-purple-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-list-check"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Manage Tasks</h4>
                    <p className="text-[11px] font-medium text-slate-500">Buat & edit tugas harian</p>
                 </div>
              </Link>

              <Link to="/whitebook" className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-amber-200 hover:bg-amber-50/50 hover:translate-x-1 transition-all group">
                 <div className="w-12 h-12 bg-white text-amber-600 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0"><i className="fa-solid fa-book-bookmark"></i></div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Update Whitebook</h4>
                    <p className="text-[11px] font-medium text-slate-500">Edit SOP & panduan divisi</p>
                 </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: System Audit Log */}
        <div className="lg:col-span-2 bg-blue-950 rounded-[2.5rem] border border-white/10 shadow-lg overflow-hidden flex flex-col h-full min-h-[450px]">
          <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest font-mono">
              <i className="fa-solid fa-terminal text-emerald-400 mr-2"></i>System Log ({myDivision})
            </h3>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-blue-950 font-mono text-sm">
            <div className="space-y-4">
              
              {loading ? (
                 <div className="text-blue-200/50 text-xs text-center py-4"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Sinkronisasi Log...</div>
              ) : activityLogs.length === 0 ? (
                 <div className="text-blue-200/50 text-xs text-center py-4">Belum ada aktivitas terbaru</div>
              ) : activityLogs.map((log, i) => (
                 <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-white/5 pb-4 hover:bg-white/[0.03] transition-colors p-2 rounded-lg">
                    <div className="text-blue-300/60 text-[11px] shrink-0 pt-0.5 w-[140px]">{new Date(log.created_at).toLocaleString('id-ID')}</div>
                    <div>
                       <div className="flex flex-wrap items-center gap-2 mb-1">
                         <span className={`text-[10px] font-bold text-blue-950 px-2 py-0.5 rounded uppercase tracking-wider ${
                           log.actor_role === 'super_admin' ? 'bg-purple-400' : log.actor_role === 'admin' ? 'bg-emerald-400' : 'bg-blue-400'
                         }`}>{log.actor_role || "Activity"}</span>
                         <span className="text-blue-300 font-bold">@{log.actor?.username || log.actor?.nickname || "System"}</span>
                       </div>
                       <p className="text-blue-100/70 text-xs">{log.action}</p>
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

export default AdminDashboard;