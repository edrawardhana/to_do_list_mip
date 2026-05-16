import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "../../api/axios";
import toast from "react-hot-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const AdminDashboard = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const myDivision = user?.division?.name || user?.division_name || "Divisi Anda";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (ADMIN DEEP NAVY)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;

  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-emerald-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-emerald-400" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-white/10 border-white/10 text-blue-400",
    
    // Panel & Card Theme (Full Dark Mode)
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : isPurpleTheme ? "bg-[#1d1633] border-[#342459]" : "bg-[#0b1437] border-[#1c2242]",
    cardBg: isDeveloperTheme ? "bg-[#141417] border-zinc-800/80 hover:border-zinc-600" : isPurpleTheme ? "bg-[#281c47] border-[#44317a] hover:border-[#5a42a0]" : "bg-[#141d47] border-[#2a3673] hover:border-[#3d4b94]",
    
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200/70" : "text-blue-100/70",
    textPrimary: "text-white",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-300" : "text-blue-200",
    
    btnPrimary: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20" : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20",
    btnSecondary: isDeveloperTheme ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700" : isPurpleTheme ? "bg-[#342459] text-purple-200 hover:bg-[#44317a] border border-[#44317a]" : "bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20",
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ onSiteInterns: 0, totalInterns: 0, pendingTasks: 0, pendingUsers: 0 });
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get('/dashboard/admin');
      const data = response.data?.data || response.data;
      setChartData(data.chartData || []);
      setStats({
        onSiteInterns: data.onSiteInterns ?? data.totalInterns ?? 0,
        totalInterns: data.totalInterns ?? 0,
        pendingTasks: data.pendingTasks ?? 0,
        pendingUsers: data.pendingUsers ?? 0,
      });
      setActivityLogs(data.activityLogs || []);
      if (isRefresh) toast.success("Data diperbarui");
    } catch (error) {
      console.error("Gagal mengambil data admin:", error);
      if (!isRefresh) toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const formatRelativeTime = (ts) => {
    if (!ts) return "—";
    const diff = Math.round((new Date() - new Date(ts)) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const statCards = [
    {
      label: "Anak Magang", value: stats.onSiteInterns, badge: "On-Site",
      badgeCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: "fa-users", iconBg: "bg-emerald-500/10 text-emerald-400",
      hover: "hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      footer: `Dari ${stats.totalInterns} orang di divisi`, footerIcon: "fa-circle-info",
    },
    {
      label: "Antrean ACC", value: stats.pendingTasks, badge: "Tugas",
      badgeCls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: "fa-clipboard-check", iconBg: "bg-amber-500/10 text-amber-400",
      hover: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
      footer: "Butuh validasi segera", footerIcon: "fa-envelope-open-text",
    },
    {
      label: "Pending User", value: stats.pendingUsers, badge: "Baru",
      badgeCls: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: "fa-user-clock", iconBg: "bg-rose-500/10 text-rose-400",
      hover: "hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
      footer: "Segera verifikasi data", footerIcon: "fa-triangle-exclamation",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ── HERO + PIE CHART (COMMAND CENTER) ─────────────────────────────── */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col lg:flex-row min-h-[420px] transition-colors duration-700 ${theme.heroBg}`}>
        {/* Ornamen Matrix Dots */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '16px 16px', maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        {/* Kiri: Hero */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${theme.iconBg}`}>
                <i className="fa-solid fa-server text-sm sm:text-lg" />
                <span className={`absolute -top-1 -right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full animate-pulse border-2 border-transparent ${isDeveloperTheme ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : isPurpleTheme ? 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]'}`} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none ${isDeveloperTheme ? 'text-emerald-400' : isPurpleTheme ? 'text-fuchsia-400' : 'text-blue-400'}`}>
                System Online • {isSuperAdmin || isDeveloperTheme ? "Global" : myDivision}
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 sm:mb-4 drop-shadow-sm ${theme.title}`}>
              Admin Workspace.
            </h1>
            <div className={`max-w-xl border-l-[3px] pl-4 sm:pl-5 mb-6 sm:mb-8 ${isDeveloperTheme ? 'border-emerald-500/50' : isPurpleTheme ? 'border-purple-500/50' : 'border-blue-400/50'}`}>
              <p className={`text-[12px] sm:text-[14px] md:text-[15px] font-medium leading-relaxed ${theme.subtitle}`}>
                Akses kendali penuh. Pantau lalu lintas tugas, validasi laporan, dan kelola aktivitas operasional secara real-time di sistem terpusat.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 lg:mt-0">
            <Link to="/approval" className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center ${theme.btnPrimary}`}>
              Validasi Tugas <i className="fa-solid fa-arrow-right ml-2" />
            </Link>
            <Link to="/tasks" className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black transition-all active:scale-95 flex items-center justify-center ${theme.btnSecondary}`}>
              Manage Tasks
            </Link>
          </div>
        </div>

        {/* Kanan: Pie Chart */}
        <div className="w-full lg:w-[400px] xl:w-[450px] p-6 sm:p-8 md:p-10 relative z-10 flex flex-col bg-black/10 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${theme.title}`}>Top Kontribusi Intern</h3>
              <p className={`text-[10px] sm:text-[11px] font-medium mt-1 ${theme.textSecondary}`}>Berdasarkan task yang di-ACC.</p>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] sm:min-h-[250px] w-full mt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 animate-spin ${isDeveloperTheme ? 'border-zinc-800 border-t-emerald-500' : isPurpleTheme ? 'border-[#342459] border-t-purple-400' : 'border-blue-900 border-t-blue-400'}`} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                <i className={`fa-solid fa-chart-pie text-4xl sm:text-5xl ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-400'}`} />
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Belum ada data tugas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="tasks" stroke="none">
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} Tugas`, 'Diselesaikan']} contentStyle={{ backgroundColor: isDeveloperTheme ? '#09090b' : '#0b1437', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: isDeveloperTheme ? '#a1a1aa' : '#93c5fd' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS (DARK MODE) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border relative overflow-hidden group transition-all duration-300 flex flex-col h-full cursor-default ${theme.cardBg} ${card.hover}`}>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              <i className={`fa-solid ${card.icon} text-7xl sm:text-8xl ${theme.textPrimary}`} />
            </div>
            <div className="flex justify-between items-start mb-4 sm:mb-5">
              <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] mt-1 ${theme.textSecondary}`}>{card.label}</p>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl border shrink-0 group-hover:scale-110 transition-transform ${card.iconBg}`}>
                <i className={`fa-solid ${card.icon}`} />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 relative z-10 flex-1">
              {loading ? (
                <div className={`h-10 sm:h-12 w-16 sm:w-20 rounded-xl animate-pulse ${isDeveloperTheme ? 'bg-zinc-800' : 'bg-white/10'}`} />
              ) : (
                <>
                  <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none ${theme.textPrimary}`}>{card.value}</h3>
                  <span className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-lg uppercase tracking-widest border ${card.badgeCls}`}>{card.badge}</span>
                </>
              )}
            </div>
            <div className={`relative z-10 pt-4 sm:pt-5 border-t mt-auto ${isDeveloperTheme ? 'border-zinc-800' : 'border-white/10'}`}>
              <p className={`text-[9px] sm:text-[11px] font-bold flex items-center gap-2 ${theme.textSecondary}`}>
                <i className={`fa-solid ${card.footerIcon} opacity-50`} /> {card.footer}
              </p>
            </div>
          </div>
        ))}

        {/* Card 4: Broadcast (VVIP Flavor) */}
        <div className={`rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border relative overflow-hidden group flex flex-col h-full transition-all duration-300 ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-700 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]' : isPurpleTheme ? 'bg-[#342459] border-[#5a42a0] hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(192,38,211,0.2)]' : 'bg-blue-800 border-blue-600 hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
            <i className="fa-solid fa-tower-broadcast text-7xl sm:text-8xl text-white" />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mt-1">Informasi</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition-transform border border-white/20">
                <i className="fa-solid fa-bullhorn" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-1 leading-tight tracking-tight text-white">Broadcast<br />Pesan</h3>
            <p className="text-[10px] sm:text-[12px] font-medium text-white/70 mb-4 sm:mb-5">Kirim info darurat ke divisi</p>
          </div>
          <div className="relative z-10 mt-auto">
            <Link to="/broadcasts" className={`w-full flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-black px-4 py-3 sm:py-3.5 rounded-xl transition-colors uppercase tracking-widest border border-white/20 hover:bg-white text-white hover:text-slate-900`}>
              Kirim <i className="fa-solid fa-paper-plane" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + ACTIVITY LOG (DARK MODE) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className={`rounded-[1.5rem] sm:rounded-[2.5rem] border p-5 sm:p-6 flex flex-col h-full ${theme.panelBg}`}>
            <h3 className={`text-[10px] sm:text-xs font-black uppercase tracking-widest border-b pb-3 sm:pb-4 mb-4 sm:mb-5 ${theme.textPrimary} ${isDeveloperTheme ? 'border-zinc-800' : 'border-white/10'}`}>
              <i className={`fa-solid fa-bolt mr-2 ${isDeveloperTheme ? 'text-emerald-500' : 'text-blue-400'}`} />Aksi Cepat
            </h3>
            <div className="space-y-2 sm:space-y-3 flex-1">
              {[
                { to: "/approval",      icon: "fa-check-to-slot",  color: "text-blue-400",   bgHover: isDeveloperTheme ? "hover:bg-blue-500/10 hover:border-blue-500/30" : "hover:bg-blue-500/20 hover:border-blue-400/40", title: "Approval Center",  sub: "Validasi tugas & izin" },
                { to: "/manage-intern", icon: "fa-users-gear",     color: "text-emerald-400",bgHover: isDeveloperTheme ? "hover:bg-emerald-500/10 hover:border-emerald-500/30" : "hover:bg-emerald-500/20 hover:border-emerald-400/40", title: "Manage Interns",   sub: "Manajemen akun magang" },
                { to: "/tasks",         icon: "fa-list-check",     color: "text-purple-400", bgHover: isDeveloperTheme ? "hover:bg-purple-500/10 hover:border-purple-500/30" : "hover:bg-purple-500/20 hover:border-purple-400/40", title: "Manage Tasks",     sub: "Buat & edit tugas harian" },
                { to: "/broadcasts",    icon: "fa-bullhorn",       color: "text-sky-400",    bgHover: isDeveloperTheme ? "hover:bg-sky-500/10 hover:border-sky-500/30" : "hover:bg-sky-500/20 hover:border-sky-400/40", title: "Broadcast",        sub: "Kirim instruksi ke divisi" },
                { to: "/schedules",     icon: "fa-calendar-days",  color: "text-amber-400",  bgHover: isDeveloperTheme ? "hover:bg-amber-500/10 hover:border-amber-500/30" : "hover:bg-amber-500/20 hover:border-amber-400/40", title: "Schedules",      sub: "Atur jadwal shift operasional" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 hover:translate-x-1 transition-all group ${theme.cardBg} ${item.bgHover}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg shrink-0 group-hover:scale-110 transition-transform bg-white/5 border border-white/10 ${item.color}`}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs sm:text-sm mb-0.5 ${theme.textPrimary}`}>{item.title}</h4>
                    <p className={`text-[9px] sm:text-[11px] font-medium ${theme.textSecondary}`}>{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className={`lg:col-span-2 rounded-[1.5rem] sm:rounded-[2.5rem] border shadow-lg overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px] ${theme.panelBg}`}>
          <div className={`px-5 sm:px-8 py-4 sm:py-5 border-b flex justify-between items-center shrink-0 bg-white/5 ${isDeveloperTheme ? 'border-zinc-800' : 'border-white/10'}`}>
            <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-2 ${theme.textPrimary}`}>
              <i className={`fa-solid fa-terminal ${isDeveloperTheme ? 'text-emerald-500' : 'text-blue-400'}`} /> System Log ({isSuperAdmin || isDeveloperTheme ? "Global" : myDivision})
            </h3>
            <div className="flex gap-2">
              <Link to="/audit-log" className={`text-[9px] sm:text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-colors hover:text-white ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                Lihat Semua
              </Link>
              <button onClick={() => fetchDashboardData(true)} disabled={refreshing} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all disabled:opacity-50 ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-blue-400'}`}>
                <i className={`fa-solid fa-arrows-rotate text-[10px] sm:text-xs ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar font-mono text-xs sm:text-sm">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex gap-3 pb-4 border-b animate-pulse ${isDeveloperTheme ? 'border-zinc-800/50' : 'border-white/5'}`}>
                    <div className={`w-16 sm:w-24 h-3 rounded shrink-0 mt-1 ${isDeveloperTheme ? 'bg-zinc-800' : 'bg-white/10'}`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className={`h-3 sm:h-4 w-12 sm:w-14 rounded ${isDeveloperTheme ? 'bg-emerald-900/50' : 'bg-blue-700/30'}`} />
                        <div className={`h-3 sm:h-4 w-16 sm:w-20 rounded ${isDeveloperTheme ? 'bg-zinc-800' : 'bg-white/10'}`} />
                      </div>
                      <div className={`h-2 sm:h-3 w-full rounded ${isDeveloperTheme ? 'bg-zinc-900' : 'bg-white/5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30 py-10 sm:py-16">
                <i className={`fa-solid fa-terminal text-3xl sm:text-4xl ${isDeveloperTheme ? 'text-emerald-500' : 'text-blue-400'}`} />
                <p className={`text-[10px] sm:text-sm font-medium uppercase tracking-widest ${theme.textSecondary}`}>Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activityLogs.map((log, i) => (
                  <div key={log.id || i} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 border-b pb-3 sm:pb-4 transition-colors p-2 rounded-lg ${isDeveloperTheme ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-white/5 hover:bg-white/[0.03]'}`}>
                    <div className={`text-[9px] sm:text-[11px] shrink-0 pt-0.5 w-[65px] sm:w-[75px] opacity-60 ${theme.textSecondary}`}>[{formatRelativeTime(log.created_at)}]</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-widest border ${
                          log.actor_role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          log.actor_role === 'developer' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          log.actor_role === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                          'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        }`}>{log.actor_role || "activity"}</span>
                        <span className={`font-bold text-[10px] sm:text-xs ${theme.textPrimary}`}>{log.actor?.full_name || "System"}</span>
                      </div>
                      <p className={`text-[10px] sm:text-xs opacity-80 ${theme.textSecondary}`}>{log.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;