import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from "../../api/axios";
import toast from "react-hot-toast";

const SuperadminDashboard = () => {
  const { user } = useAuth();

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

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard data
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
      console.error("Gagal memuat data Superadmin:", error);
      if (!showRefreshToast) toast.error("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
      setRefreshingLog(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const formatDate = (date) =>
    date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
        <div className="bg-[#1d1633] border border-purple-500/30 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-[10px] font-black uppercase text-purple-300 mb-1">
            {payload[0].payload.name}
          </p>
          <p className="text-sm font-black text-white">
            {payload[0].value}%{" "}
            <span className="text-[9px] font-normal text-slate-400">Completed</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Role badge style for audit log
  const getRoleStyle = (role) => {
    if (role === "super_admin") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    if (role === "admin")       return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (role === "developer")   return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-slate-800 text-slate-400 border-slate-700";
  };

  // ─── STAT CARDS CONFIG ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total Intern", value: globalStats.activeInterns,
      badge: "Aktif", badgeCls: "text-purple-700 bg-purple-100 border-purple-200",
      icon: "fa-users", iconBg: "bg-purple-50 text-purple-600",
      hover: "hover:border-purple-300 hover:shadow-purple-100",
      footer: `Tersebar di ${globalStats.totalDivisions} Divisi`, footerIcon: "fa-building",
    },
    {
      label: "Divisi Ops", value: globalStats.totalDivisions,
      badge: "Unit", badgeCls: "text-blue-700 bg-blue-100 border-blue-200",
      icon: "fa-sitemap", iconBg: "bg-blue-50 text-blue-600",
      hover: "hover:border-blue-300 hover:shadow-blue-100",
      footer: "Pantau via Analytics", footerIcon: "fa-chart-line",
    },
    {
      label: "Menunggu ACC", value: globalStats.pendingApprovals,
      badge: "Antrean", badgeCls: "text-amber-700 bg-amber-100 border-amber-200",
      icon: "fa-hourglass-half", iconBg: "bg-amber-50 text-amber-500",
      hover: "hover:border-amber-300 hover:shadow-amber-100",
      footer: "Butuh validasi Admin Divisi", footerIcon: "fa-clock",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* ── HERO + CHART ─────────────────────────────────────────────────── */}
      <div className="bg-[#1d1633]/95 backdrop-blur-2xl rounded-[2.5rem] text-white shadow-2xl shadow-purple-900/20 border border-purple-500/20 relative overflow-hidden group flex flex-col lg:flex-row min-h-[420px]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-fuchsia-500/30 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Kiri: Hero */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-purple-500/20">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-amber-400 shadow-lg shrink-0">
                <i className="fa-solid fa-crown text-lg" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-[#1d1633] rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">VVIP Access Granted</span>
                <span className="text-purple-300/60 text-[10px] font-bold tracking-widest uppercase">{formatDate(currentTime)}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-400 drop-shadow-sm">
              Chief Executive.
            </h1>

            <div className="max-w-xl border-l-[3px] border-purple-500/50 pl-5 mb-8">
              <p className="text-[14px] md:text-[15px] text-purple-200/80 font-medium leading-relaxed">
                Otoritas tertinggi ekosistem MCC. Pantau{" "}
                <span className="text-white font-bold">Global Metrics</span>, orkestrasi manuver setiap divisi, dan kelola akses operasional dari satu pintu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-black/20 backdrop-blur-md border border-purple-500/30 px-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-inner shrink-0">
              <i className="fa-solid fa-satellite-dish text-purple-400 text-lg animate-pulse" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-300/70 leading-none mb-1">Server Clock (WIB)</p>
                <p className="text-xl font-black tabular-nums tracking-tight text-white leading-none">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
            <Link
              to="/division-analytics"
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg shadow-purple-600/30 transition-all hover:-translate-y-1 uppercase tracking-widest border border-purple-400/50"
            >
              Division Analytics <i className="fa-solid fa-arrow-right ml-2" />
            </Link>
          </div>
        </div>

        {/* Kanan: Chart + Leaderboard */}
        <div className="w-full lg:w-[450px] xl:w-[500px] p-8 md:p-10 relative z-10 flex flex-col bg-black/[0.15]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-purple-400" /> Global Performance
              </h3>
              <p className="text-[10px] font-bold text-purple-300/70 mt-1 uppercase tracking-widest">
                Tingkat penyelesaian tugas (%)
              </p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-40 w-full mb-8">
            {loading ? (
              <div className="h-full w-full rounded-2xl bg-white/5 animate-pulse flex items-end justify-around px-4 pb-2 gap-2">
                {[60, 80, 45, 90, 70].map((h, i) => (
                  <div key={i} className="bg-white/10 rounded-t-lg flex-1 animate-pulse" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : divisionPerformance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
                <i className="fa-solid fa-chart-bar text-3xl text-purple-400" />
                <p className="text-xs text-purple-300 font-medium">Belum ada data performa</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionPerformance} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#d8b4fe', fontSize: 11, fontWeight: 'bold' }} dy={8} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={35}>
                    {divisionPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#a855f7' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Leaderboard */}
          <div className="mt-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3 flex items-center gap-2 animate-pulse">
              <i className="fa-solid fa-fire text-orange-500" /> Top 3 Interns Global
            </h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : topInterns.length === 0 ? (
              <div className="text-center py-4 opacity-50">
                <p className="text-xs text-purple-300 font-medium">Belum ada data intern</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {topInterns.map((intern, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all hover:-translate-y-1 ${
                      i === 0 ? "bg-gradient-to-br from-amber-500/20 to-orange-500/5 border-amber-500/50 shadow-lg shadow-amber-500/20" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className={`text-[11px] font-black mb-1.5 ${i === 0 ? "text-amber-400 drop-shadow-md" : "text-purple-300"}`}>
                      {i === 0 ? <i className="fa-solid fa-trophy" /> : `#${i + 1}`}
                    </span>
                    <p className="text-xs font-black text-white truncate w-full text-center leading-none">{intern.name}</p>
                    <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${i === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {intern.score}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default ${card.hover}`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              <i className={`fa-solid ${card.icon} text-8xl`} />
            </div>
            <div className="flex justify-between items-start mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">{card.label}</p>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform ${card.iconBg}`}>
                <i className={`fa-solid ${card.icon}`} />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
              {loading ? (
                <div className="h-12 w-24 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{card.value}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border shadow-sm ${card.badgeCls}`}>{card.badge}</span>
                </>
              )}
            </div>
            <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                <i className={`fa-solid ${card.footerIcon} text-slate-300`} /> {card.footer}
              </p>
            </div>
          </div>
        ))}

        {/* Card 4: System Health */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 rounded-[2rem] p-7 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-600/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
            <i className="fa-solid fa-heart-pulse text-8xl" />
          </div>
          <div className="flex justify-between items-start mb-5 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-200 mt-1">Status Server</p>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform border border-white/20">
              <i className="fa-solid fa-heart-pulse animate-pulse text-rose-300" />
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-3xl md:text-4xl font-black mb-1 leading-tight tracking-tight">Optimal</h3>
            <p className="text-[12px] font-medium text-purple-100/90 mb-5">Semua node berjalan lancar</p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-white bg-white/10 border border-white/20 px-4 py-3 rounded-xl uppercase tracking-widest backdrop-blur-md cursor-default">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" /> All Systems Go
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + AUDIT LOG ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-5 flex items-center">
              <i className="fa-solid fa-bolt text-purple-500 mr-2" /> Executive Command
            </h3>
            <div className="space-y-3 flex-1">
              {[
                { to: "/manage-admin",      icon: "fa-user-shield",  color: "text-purple-600", hover: "hover:border-purple-200 hover:bg-purple-50/50", title: "Role Access",      sub: "Mutasi & promote Admin" },
                { to: "/division-analytics",icon: "fa-sitemap",      color: "text-blue-600",   hover: "hover:border-blue-200 hover:bg-blue-50/50",     title: "Divisions",       sub: "Manajemen struktur divisi" },
                { to: "/broadcasts",        icon: "fa-bullhorn",     color: "text-emerald-600",hover: "hover:border-emerald-200 hover:bg-emerald-50/50",title: "Broadcast",       sub: "Kirim instruksi massal" },
                { to: "/reports",           icon: "fa-file-invoice", color: "text-amber-600",  hover: "hover:border-amber-200 hover:bg-amber-50/50",    title: "Global Reports",  sub: "Unduh rekapitulasi data" },
                { to: "/audit-log",         icon: "fa-shield-halved",color: "text-rose-600",   hover: "hover:border-rose-200 hover:bg-rose-50/50",      title: "Audit Log",       sub: "Riwayat aksi sistem" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className={`bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:translate-x-1 transition-all group ${item.hover}`}>
                  <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0 ${item.color}`}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">{item.title}</h4>
                    <p className="text-[11px] font-medium text-slate-500">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Global Audit Log */}
        <div className="lg:col-span-2 bg-[#1d1633] rounded-[2.5rem] border border-purple-500/20 shadow-lg overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-8 py-5 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest font-mono flex items-center gap-2">
              <i className="fa-solid fa-radar text-rose-400 animate-pulse" />
              Global Audit Log
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Feed
              </span>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshingLog}
                title="Refresh log"
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-purple-300 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <i className={`fa-solid fa-arrows-rotate text-[10px] ${refreshingLog ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-black/10 font-mono text-sm">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-white/5 pb-4 animate-pulse">
                    <div className="w-16 h-3 rounded bg-white/10 shrink-0 mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="h-4 w-16 rounded bg-purple-500/20" />
                        <div className="h-4 w-24 rounded bg-white/10" />
                      </div>
                      <div className="h-3 w-full rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50 py-16">
                <i className="fa-solid fa-shield-halved text-4xl text-purple-400" />
                <p className="text-purple-300 text-sm font-medium">Belum ada aktivitas tercatat</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="flex flex-col sm:flex-row sm:items-start gap-3 border-b border-white/5 pb-4 hover:bg-white/[0.03] transition-colors p-2 rounded-lg"
                  >
                    <div className="text-purple-300/50 text-[11px] shrink-0 pt-0.5 w-[80px]">
                      [{formatRelativeTime(log.created_at)}]
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${getRoleStyle(log.actor_role)}`}>
                          {log.actor_role?.replace('_', ' ')}
                        </span>
                        <span className="text-white font-bold text-xs">
                          {log.actor?.full_name || 'System'}
                        </span>
                      </div>
                      <p className="text-purple-200/70 text-xs leading-relaxed">{log.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer link to full audit log */}
          {!loading && auditLogs.length > 0 && (
            <div className="px-8 py-4 border-t border-white/10 bg-black/20 shrink-0">
              <Link to="/audit-log" className="text-[11px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-2 transition-colors w-max">
                Lihat Semua Log <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SuperadminDashboard;