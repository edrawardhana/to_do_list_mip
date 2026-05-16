import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from "../../api/axios";
import toast from "react-hot-toast";

const SuperadminDashboard = () => {
  const { user, isDeveloper } = useAuth();

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (BORDERLESS & CLEAN)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = !isDeveloperTheme; 

  const theme = {
    // Hero tanpa border putih/terang, full shadow
    heroBg: isDeveloperTheme ? "bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "bg-[#1d1633] shadow-[0_20px_50px_rgba(19,10,35,0.5)]",
    blobTop: isDeveloperTheme ? "bg-emerald-500/10" : "bg-fuchsia-500/20",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : "bg-purple-500/20",
    iconBg: isDeveloperTheme ? "bg-zinc-800 text-emerald-400" : "bg-white/5 text-amber-400",
    
    // Panel & Card tanpa border yang bikin jelek
    panelBg: isDeveloperTheme ? "bg-[#09090b] shadow-2xl" : "bg-[#1d1633] shadow-2xl",
    cardBg: isDeveloperTheme ? "bg-[#141417]" : "bg-[#281c47]",
    
    textPrimary: "text-white",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-purple-300/60",
    
    btnPrimary: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30",
    
    // Warna Hover untuk Quick Actions yang lebih nyala
    hoverAction: isDeveloperTheme ? "hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-500 hover:shadow-emerald-500/20" : "hover:bg-gradient-to-r hover:from-purple-600 hover:to-fuchsia-500 hover:shadow-fuchsia-500/20",
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshingLog, setRefreshingLog] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    activeInterns: 0,
    totalDivisions: 0,
    pendingApprovals: 0,
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [divisionPerformance, setDivisionPerformance] = useState([]);
  const [topInterns, setTopInterns] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshingLog(true);
    else setLoading(true);

    try {
      const response = await api.get('/dashboard/superadmin');
      const data = response.data?.data || response.data;

      setGlobalStats({
        activeInterns:    data.activeInterns    ?? 0,
        totalDivisions:   data.totalDivisions   ?? 0,
        pendingApprovals: data.pendingApprovals  ?? 0,
      });
      setDivisionPerformance(data.divisionPerformance ?? []);
      setTopInterns(data.topInterns ?? []);
      setAuditLogs(data.auditLogs ?? []);

      if (showRefreshToast) toast.success("Log diperbarui");
    } catch (error) {
      if (!showRefreshToast) toast.error("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
      setRefreshingLog(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const formatDate = (date) => date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    const diffSeconds = Math.round((new Date() - date) / 1000);
    if (diffSeconds < 60)   return "Baru saja";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mnt lalu`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} jam lalu`;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className={`${isDeveloperTheme ? 'bg-[#18181b]/95' : 'bg-[#1d1633]/95'} px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/5`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDeveloperTheme ? 'text-zinc-400' : 'text-purple-300'}`}>
            {payload[0].payload.name}
          </p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${payload[0].value >= 80 ? 'bg-emerald-400 animate-pulse' : payload[0].value >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
            <p className="text-base font-black text-white leading-none">
              {payload[0].value}% <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${theme.textSecondary}`}>Score</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getRoleStyle = (role) => {
    if (role === "super_admin") return "bg-purple-500/20 text-purple-400";
    if (role === "admin")       return "bg-emerald-500/10 text-emerald-400";
    if (role === "developer")   return "bg-blue-500/10 text-blue-400";
    return "bg-white/5 text-zinc-400";
  };

  // ─── STAT CARDS CONFIG ─────────────────────────────────────────
  const statCards = [
    {
      label: "Total Intern", value: globalStats.activeInterns,
      badge: "Aktif", badgeCls: isDeveloperTheme ? "text-emerald-400 bg-emerald-500/10" : "text-fuchsia-400 bg-fuchsia-500/10",
      icon: "fa-users", iconBg: isDeveloperTheme ? "bg-emerald-500/10 text-emerald-400" : "bg-fuchsia-500/10 text-fuchsia-400",
      hoverShadow: isDeveloperTheme ? "hover:shadow-[0_15px_30px_rgba(16,185,129,0.1)]" : "hover:shadow-[0_15px_30px_rgba(217,70,239,0.15)]",
      footer: `Tersebar di ${globalStats.totalDivisions} Divisi`, footerIcon: "fa-building",
    },
    {
      label: "Divisi Ops", value: globalStats.totalDivisions,
      badge: "Unit", badgeCls: isDeveloperTheme ? "text-sky-400 bg-sky-500/10" : "text-blue-400 bg-blue-500/10",
      icon: "fa-sitemap", iconBg: isDeveloperTheme ? "bg-sky-500/10 text-sky-400" : "bg-blue-500/10 text-blue-400",
      hoverShadow: isDeveloperTheme ? "hover:shadow-[0_15px_30px_rgba(14,165,233,0.1)]" : "hover:shadow-[0_15px_30px_rgba(59,130,246,0.15)]",
      footer: "Pantau via Analytics", footerIcon: "fa-chart-line",
    },
    {
      label: "Menunggu ACC", value: globalStats.pendingApprovals,
      badge: "Antrean", badgeCls: "text-amber-400 bg-amber-500/10",
      icon: "fa-hourglass-half", iconBg: "bg-amber-500/10 text-amber-400",
      hoverShadow: "hover:shadow-[0_15px_30px_rgba(245,158,11,0.15)]",
      footer: "Butuh validasi Admin", footerIcon: "fa-clock",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">

      {/* ── HERO + CHART ─────────────────────────────────────────────────── */}
      <div className={`rounded-[2.5rem] relative overflow-hidden flex flex-col lg:flex-row min-h-[420px] transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${theme.blobTop}`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${theme.blobBot}`} />

        {/* Kiri: Hero */}
        <div className={`flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5`}>
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className={`relative w-12 h-12 backdrop-blur-md rounded-2xl flex items-center justify-center ${theme.iconBg} shrink-0`}>
                <i className={`fa-solid ${isDeveloperTheme ? 'fa-server' : 'fa-crown'} text-xl`} />
                <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full animate-pulse ${isDeveloperTheme ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]'}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] leading-none mb-1.5 ${isDeveloperTheme ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isDeveloperTheme ? 'Developer Root Access' : 'VVIP Access Granted'}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${theme.textSecondary}`}>
                  {formatDate(currentTime)}
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-5 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-sm">
              {isDeveloperTheme ? 'Dev Console.' : 'Chief Executive.'}
            </h1>

            <div className={`max-w-xl border-l-[3px] pl-5 mb-8 ${isDeveloperTheme ? 'border-emerald-500/50' : 'border-purple-500/50'}`}>
              <p className={`text-sm md:text-[15px] font-medium leading-relaxed ${theme.subtitle}`}>
                Otoritas tertinggi ekosistem MCC. Pantau{" "}
                <span className="text-white font-bold">Global Metrics</span>, orkestrasi manuver setiap divisi, dan kelola akses operasional dari satu pintu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className={`backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4 shrink-0 bg-white/5`}>
              <i className={`fa-solid fa-satellite-dish text-lg animate-pulse ${isDeveloperTheme ? 'text-emerald-400' : 'text-purple-400'}`} />
              <div className="text-left">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 ${theme.textSecondary}`}>Server Clock (WIB)</p>
                <p className="text-xl font-black tabular-nums tracking-tight text-white leading-none">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
            <Link
              to="/division-analytics"
              className={`px-6 py-4 rounded-2xl text-xs font-black transition-all hover:-translate-y-1 uppercase tracking-widest flex items-center ${theme.btnPrimary}`}
            >
              Analytics <i className="fa-solid fa-arrow-right ml-2" />
            </Link>
          </div>
        </div>

        {/* Kanan: Chart + Leaderboard */}
        <div className={`w-full lg:w-[420px] xl:w-[480px] p-8 md:p-10 relative z-10 flex flex-col bg-black/10 backdrop-blur-sm`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeveloperTheme ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  <i className="fa-solid fa-chart-simple" />
                </div>
                Global Performance
              </h3>
              <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${theme.textSecondary}`}>
                Tingkat penyelesaian tugas (%)
              </p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-40 w-full mb-8 relative">
            <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
            </div>

            {loading ? (
              <div className="h-full w-full rounded-2xl flex items-end justify-around px-2 pb-0 gap-3">
                {[40, 70, 50, 90, 60].map((h, i) => (
                  <div key={i} className={`rounded-t-lg flex-1 animate-pulse opacity-50 ${isDeveloperTheme ? 'bg-emerald-500/20' : 'bg-fuchsia-500/20'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : divisionPerformance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40">
                <i className={`fa-solid fa-chart-bar text-4xl ${isDeveloperTheme ? 'text-emerald-400' : 'text-purple-400'}`} />
                <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionPerformance} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDeveloperTheme ? '#a1a1aa' : '#d8b4fe', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {divisionPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? (isDeveloperTheme ? '#0ea5e9' : '#a855f7') : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Leaderboard Berkasta */}
          <div className="mt-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-white">
              <i className="fa-solid fa-ranking-star text-amber-400 animate-pulse" /> Top 3 Interns
            </h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
              </div>
            ) : topInterns.length === 0 ? (
              <div className="text-center py-5 rounded-2xl bg-white/[0.02]">
                <p className={`text-xs font-medium ${theme.textSecondary}`}>Data intern belum tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 items-end">
                {/* Juara 2 (Silver) */}
                {topInterns[1] && (
                  <div className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all hover:-translate-y-1 h-[85%] bg-gradient-to-br from-white/10 to-transparent shadow-lg`}>
                    <span className="text-xs font-black mb-1.5 text-slate-300 drop-shadow-md">#2</span>
                    <p className="text-[11px] font-black text-white truncate w-full text-center">{topInterns[1].name}</p>
                    <p className="text-[10px] font-bold mt-1 text-slate-400">{topInterns[1].score}%</p>
                  </div>
                )}
                {/* Juara 1 (Gold) */}
                {topInterns[0] && (
                  <div className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all hover:-translate-y-1.5 h-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative`}>
                    <i className="fa-solid fa-crown absolute -top-3 text-amber-400 text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-bounce" />
                    <span className="text-sm font-black mb-1.5 text-amber-400 drop-shadow-md mt-1">#1</span>
                    <p className="text-xs font-black text-white truncate w-full text-center">{topInterns[0].name}</p>
                    <p className="text-[11px] font-black mt-1 text-amber-400">{topInterns[0].score}%</p>
                  </div>
                )}
                {/* Juara 3 (Bronze) */}
                {topInterns[2] && (
                  <div className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all hover:-translate-y-1 h-[75%] bg-gradient-to-br from-orange-400/10 to-transparent shadow-lg`}>
                    <span className="text-xs font-black mb-1.5 text-orange-300 drop-shadow-md">#3</span>
                    <p className="text-[11px] font-black text-white truncate w-full text-center">{topInterns[2].name}</p>
                    <p className="text-[10px] font-bold mt-1 text-orange-400/80">{topInterns[2].score}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS (BORDERLESS & CLEAN) ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-[2rem] p-6 sm:p-7 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full cursor-default ${theme.cardBg} ${card.hoverShadow}`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.06] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <i className={`fa-solid ${card.icon} text-8xl ${theme.textPrimary}`} />
            </div>
            <div className="flex justify-between items-start mb-5">
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-1 ${theme.textSecondary}`}>{card.label}</p>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${card.iconBg}`}>
                <i className={`fa-solid ${card.icon}`} />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
              {loading ? (
                <div className="h-12 w-24 bg-white/5 rounded-xl animate-pulse" />
              ) : (
                <>
                  <h3 className={`text-5xl font-black tracking-tighter leading-none ${theme.textPrimary}`}>{card.value}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${card.badgeCls}`}>{card.badge}</span>
                </>
              )}
            </div>
            <div className={`relative z-10 pt-5 border-t mt-auto ${isDeveloperTheme ? 'border-white/5' : 'border-white/5'}`}>
              <p className={`text-[11px] font-bold flex items-center gap-2 ${theme.textSecondary}`}>
                <i className={`fa-solid ${card.footerIcon} opacity-50`} /> {card.footer}
              </p>
            </div>
          </div>
        ))}

        {/* Card 4: System Health (Accent Glow) */}
        <div className={`rounded-[2rem] p-6 sm:p-7 relative overflow-hidden group flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 ${isDeveloperTheme ? 'bg-[#09090b] shadow-[0_15px_30px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-[#281c47] to-[#1d1633] shadow-[0_15px_30px_rgba(217,70,239,0.2)]'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
            <i className="fa-solid fa-heart-pulse text-8xl text-white" />
          </div>
          <div className="flex justify-between items-start mb-5 relative z-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-1 ${isDeveloperTheme ? 'text-emerald-200/50' : 'text-purple-200/50'}`}>Status Server</p>
            <div className={`w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${isDeveloperTheme ? 'bg-zinc-900 text-emerald-400' : 'bg-white/5 text-white'}`}>
              <i className="fa-solid fa-heart-pulse animate-pulse text-rose-400" />
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-3xl md:text-4xl font-black mb-1.5 leading-tight tracking-tight text-white">Optimal</h3>
            <p className={`text-[11px] md:text-[12px] font-medium mb-5 ${isDeveloperTheme ? 'text-emerald-100/70' : 'text-purple-100/70'}`}>Semua node merespons lancar</p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className={`w-full flex items-center justify-center gap-2.5 text-[10px] font-black px-4 py-3.5 rounded-xl uppercase tracking-widest backdrop-blur-md cursor-default ${isDeveloperTheme ? 'bg-emerald-950/30 text-emerald-300' : 'bg-white/5 text-white'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span> 
              All Systems Go
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + AUDIT LOG (KETINGGIAN PRESISI & HOVER KEREN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Quick Actions (Executive Command) */}
        <div className="lg:col-span-1 h-full">
          <div className={`rounded-[2rem] p-5 sm:p-6 flex flex-col h-full shadow-2xl ${theme.panelBg}`}>
            <h3 className={`text-[11px] font-black uppercase tracking-widest border-b pb-3 mb-4 flex items-center shrink-0 ${theme.textPrimary} ${isDeveloperTheme ? 'border-white/5' : 'border-white/5'}`}>
              <i className={`fa-solid fa-bolt mr-2.5 ${isDeveloperTheme ? 'text-emerald-500' : 'text-fuchsia-500'}`} /> Executive Command
            </h3>
            
            {/* Pembungkus tombol yang ngebagi ruang biar padat dan ga ada whitespace berlebih */}
            <div className="space-y-3 flex-1">
              {[
                { to: "/manage-admin",      icon: "fa-user-shield",  color: "text-purple-400", title: "Role Access",      sub: "Mutasi & promote Admin" },
                { to: "/divisions",         icon: "fa-sitemap",      color: "text-blue-400",   title: "Divisions",       sub: "Manajemen struktur divisi" },
                { to: "/broadcasts",        icon: "fa-bullhorn",     color: "text-emerald-400",title: "Broadcast",       sub: "Kirim instruksi massal" },
                { to: "/reports",           icon: "fa-file-invoice", color: "text-amber-400",  title: "Global Reports",  sub: "Unduh rekapitulasi data" },
                { to: "/audit-log",         icon: "fa-shield-halved",color: "text-rose-400",   title: "Audit Log",       sub: "Riwayat aksi sistem" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className={`p-4 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group ${theme.cardBg} ${theme.hoverAction}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white transition-all bg-black/20 ${item.color}`}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-0.5 leading-none group-hover:text-white transition-colors ${theme.textPrimary}`}>{item.title}</h4>
                    <p className={`text-[11px] font-medium leading-none mt-1.5 group-hover:text-white/80 transition-colors ${theme.textSecondary}`}>{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Global Audit Log (TINGGI DIPOTONG BIAR PAS) */}
        <div className="lg:col-span-2 h-full">
          <div className={`rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[420px] ${theme.panelBg}`}>
            <div className={`px-5 sm:px-8 py-4 border-b flex justify-between items-center shrink-0 bg-white/[0.02] border-white/5`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-2.5 ${isDeveloperTheme ? 'text-zinc-300' : 'text-purple-300'}`}>
                <i className="fa-solid fa-radar text-rose-400 animate-pulse" />
                Global Audit Log
              </h3>
              <div className="flex items-center gap-3">
                <span className={`hidden sm:flex text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest items-center gap-1.5 ${isDeveloperTheme ? 'text-emerald-400 bg-emerald-500/10' : 'text-fuchsia-400 bg-fuchsia-500/10'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDeveloperTheme ? 'bg-emerald-400' : 'bg-fuchsia-400'}`} /> Live Feed
                </span>
                <button
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshingLog}
                  title="Refresh log"
                  className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 ${isDeveloperTheme ? 'bg-zinc-900 text-zinc-400 hover:text-emerald-400' : 'bg-white/5 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300'}`}
                >
                  <i className={`fa-solid fa-arrows-rotate text-xs ${refreshingLog ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar bg-black/[0.08] font-mono text-xs sm:text-sm">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex gap-3 pb-4 border-b animate-pulse border-white/5`}>
                      <div className={`w-16 h-3 rounded shrink-0 mt-1 bg-white/10`} />
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <div className={`h-4 w-16 rounded ${isDeveloperTheme ? 'bg-emerald-900/30' : 'bg-purple-500/20'}`} />
                          <div className={`h-4 w-24 rounded bg-white/10`} />
                        </div>
                        <div className={`h-3 w-full rounded bg-white/5`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30 py-16">
                  <i className={`fa-solid fa-shield-halved text-4xl ${isDeveloperTheme ? 'text-emerald-500' : 'text-purple-400'}`} />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Belum ada aktivitas tercatat</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className={`flex flex-col sm:flex-row sm:items-start gap-3 border-b pb-4 transition-colors p-2 rounded-xl hover:bg-white/[0.03] border-white/5`}
                    >
                      <div className={`text-[11px] shrink-0 pt-0.5 w-[80px] ${theme.textSecondary}`}>
                        [{formatRelativeTime(log.created_at)}]
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${getRoleStyle(log.actor_role)}`}>
                            {log.actor_role?.replace('_', ' ')}
                          </span>
                          <span className="text-white font-bold text-xs">
                            {log.actor?.full_name || 'System'}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDeveloperTheme ? 'text-zinc-400' : 'text-purple-200/70'}`}>{log.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!loading && auditLogs.length > 0 && (
              <div className={`px-5 sm:px-8 py-3.5 border-t shrink-0 bg-black/20 border-white/5`}>
                <Link to="/audit-log" className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors w-max ${isDeveloperTheme ? 'text-emerald-400 hover:text-emerald-300' : 'text-purple-400 hover:text-purple-300'}`}>
                  Lihat Full Sistem Log <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperadminDashboard;