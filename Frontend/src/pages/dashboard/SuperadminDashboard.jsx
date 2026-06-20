import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import api from "../../api/axios";
import toast from "react-hot-toast";

const SuperadminDashboard = () => {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── LIVE CLOCK ──
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── TANSTACK QUERY: Fetch Data Dashboard Superadmin ──
  const { data, isLoading: loading, isFetching: refreshingLog } = useQuery({
    queryKey: ["superadminDashboardData"],
    queryFn: async () => {
      const response = await api.get("/dashboard/superadmin");
      return response.data?.data || response.data || {};
    },
    enabled: !!isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // ── REFRESH HANDLER ──
  const handleRefreshLog = async () => {
    await queryClient.invalidateQueries(["superadminDashboardData"]);
    toast.success("Log diperbarui");
  };

  // ── FALLBACK & DERIVED DATA AMAN ──
  const globalStats = {
    activeInterns: data?.activeInterns ?? 0,
    totalDivisions: data?.totalDivisions ?? 0,
    pendingApprovals: data?.pendingApprovals ?? 0,
  };
  const divisionPerformance = data?.divisionPerformance ?? [];
  const topInterns = data?.topInterns ?? [];
  const auditLogs = data?.auditLogs ?? [];

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-pink-100 px-3 py-2 rounded-xl shadow-xl">
          <p className="text-[10px] font-black uppercase text-pink-500 mb-1">
            {payload[0].payload.name}
          </p>
          <p className="text-sm font-black text-slate-800">
            {payload[0].value}%{" "}
            <span className="text-[9px] font-normal text-slate-400">
              Completed
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getRoleStyle = (role) => {
    if (role === "super_admin" || role === "superadmin")
      return "bg-pink-500 text-white shadow-pink-500/30";
    if (role === "admin")
      return "bg-sky-100 text-sky-700 border-sky-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const statCards = [
    {
      label: "Total Intern",
      value: globalStats.activeInterns,
      badge: "Aktif",
      badgeCls: "text-emerald-700 bg-emerald-100 border-emerald-200",
      icon: "fa-users",
      iconBg: "bg-emerald-50 text-emerald-600",
      hover: "hover:border-emerald-300 hover:shadow-emerald-100",
      footer: `Tersebar di ${globalStats.totalDivisions} Divisi`,
      footerIcon: "fa-building",
    },
    {
      label: "Divisi Ops",
      value: globalStats.totalDivisions,
      badge: "Unit",
      badgeCls: "text-blue-700 bg-blue-100 border-blue-200",
      icon: "fa-sitemap",
      iconBg: "bg-blue-50 text-blue-600",
      hover: "hover:border-blue-300 hover:shadow-blue-100",
      footer: "Pantau via Analytics",
      footerIcon: "fa-chart-line",
    },
    {
      label: "Menunggu ACC",
      value: globalStats.pendingApprovals,
      badge: "Antrean",
      badgeCls: "text-amber-700 bg-amber-100 border-amber-200",
      icon: "fa-hourglass-half",
      iconBg: "bg-amber-50 text-amber-500",
      hover: "hover:border-amber-300 hover:shadow-amber-100",
      footer: "Butuh validasi Admin",
      footerIcon: "fa-clock",
    },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-rose-50 text-rose-500 font-black text-xl sm:text-2xl px-4 text-center rounded-[2rem] border border-rose-200 shadow-sm mx-4 sm:mx-8">
        <div>
          <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 animate-bounce"></i>
          <p>ACCESS DENIED. SUPERADMIN ONLY.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* ── HERO + CHART ── */}
      <div className="bg-gradient-to-br from-pink-300 to-rose-400 rounded-[2.5rem] text-white shadow-xl shadow-pink-200/50 border border-pink-200 relative overflow-hidden group flex flex-col lg:flex-row min-h-[420px]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/40 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/50 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100/30 rounded-full blur-[80px] pointer-events-none" />

        {/* Kiri: Hero Info */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/20">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 text-white shadow-inner shrink-0">
                <i className="fa-solid fa-crown text-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                  Super Admin Access Granted
                </span>
                <span className="text-pink-100 text-[10px] font-bold tracking-widest uppercase">
                  {formatDate(currentTime)}
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white drop-shadow-sm">
              <span className="text-pink-600">Chi</span>ef Exe<span className="text-pink-600">cutive</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 items-center mt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
              <i className="fa-solid fa-satellite-dish text-white text-lg animate-pulse" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-pink-100 leading-none mb-1">
                  Server Clock (WIB)
                </p>
                <p className="text-xl font-black tabular-nums tracking-tight text-white leading-none">
                  {currentTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <Link
              to="/division-analytics"
              className="bg-white hover:bg-pink-50 text-pink-600 px-6 py-4 rounded-2xl text-xs font-black shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-1 uppercase tracking-widest flex items-center gap-2"
            >
              Division Analytics <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>

        {/* Kanan: Chart + Leaderboard */}
        <div className="w-full lg:w-[450px] xl:w-[500px] p-6 sm:p-8 md:p-10 relative z-10 flex flex-col bg-white/10 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-white/80" /> Global Performance
              </h3>
              <p className="text-[10px] font-bold text-pink-100 mt-1 uppercase tracking-widest">
                Tingkat penyelesaian tugas (%)
              </p>
            </div>
          </div>

          <div className="h-40 w-full mb-8">
            {loading ? (
              <div className="h-full w-full rounded-2xl animate-pulse flex items-end justify-around px-4 pb-2 gap-2">
                {[60, 80, 45, 90, 70].map((h, i) => (
                  <div key={i} className="bg-white/30 rounded-t-lg flex-1 animate-pulse" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : divisionPerformance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 opacity-80">
                <i className="fa-solid fa-chart-bar text-3xl text-pink-100" />
                <p className="text-xs text-white font-medium">Belum ada data performa</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionPerformance} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#ffffff", fontSize: 10, fontWeight: "bold" }} dy={8} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.1)" }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={35}>
                    {divisionPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? "#10b981" : entry.score >= 50 ? "#fbbf24" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-fire text-amber-300 animate-pulse" /> Top 3 Interns Global
            </h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/20 animate-pulse" />
                ))}
              </div>
            ) : topInterns.length === 0 ? (
              <div className="text-center py-4 opacity-80">
                <p className="text-xs text-white font-medium">Belum ada data intern</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {topInterns.map((intern, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all hover:-translate-y-1 ${i === 0 ? "bg-white/20 border-white/40 shadow-sm" : "bg-white/10 border-white/20"}`}>
                    <span className={`text-[11px] font-black mb-1.5 ${i === 0 ? "text-amber-300 drop-shadow-sm" : "text-white"}`}>
                      {i === 0 ? <i className="fa-solid fa-trophy" /> : `#${i + 1}`}
                    </span>
                    <p className="text-xs font-black text-white truncate w-full text-center leading-none">{intern.name}</p>
                    <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${i === 0 ? "text-amber-300" : "text-pink-100"}`}>{intern.score}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-white rounded-[2rem] p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-default ${card.hover}`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              <i className={`fa-solid ${card.icon} text-8xl`} />
            </div>
            <div className="flex justify-between items-start mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">{card.label}</p>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform ${card.iconBg}`}><i className={`fa-solid ${card.icon}`} /></div>
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10 flex-1">
              {loading ? (
                <div className="h-12 w-24 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">{card.value}</h3>
                  <span className={`text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border shadow-sm ${card.badgeCls}`}>{card.badge}</span>
                </>
              )}
            </div>
            <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 flex items-center gap-2"><i className={`fa-solid ${card.footerIcon} text-slate-300`} /> {card.footer}</p>
            </div>
          </div>
        ))}

        {/* Card 4: System Health */}
        <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-[2rem] p-6 sm:p-7 text-white shadow-lg shadow-pink-500/20 relative overflow-hidden group hover:shadow-xl hover:shadow-pink-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none"><i className="fa-solid fa-heart-pulse text-8xl" /></div>
          <div className="flex justify-between items-start mb-5 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-pink-50 mt-1">Status Server</p>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform border border-white/30"><i className="fa-solid fa-heart-pulse animate-pulse" /></div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-3xl md:text-4xl font-black mb-1 leading-tight tracking-tight drop-shadow-sm">Optimal</h3>
            <p className="text-[11px] sm:text-[12px] font-medium text-pink-50 mb-5">Semua node berjalan lancar</p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="w-full flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black text-pink-600 bg-white px-4 py-2.5 sm:py-3 rounded-xl uppercase tracking-widest shadow-sm cursor-default">All Systems Go</div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + AUDIT LOG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions / Executive Command */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm flex flex-col h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-4 flex items-center">
              <i className="fa-solid fa-bolt text-pink-500 mr-2" /> Executive Command
            </h3>
            <div className="space-y-2">
              {[
                {
                  to: "/manage-admin",
                  icon: "fa-user-shield",
                  color: "text-pink-600",
                  hover: "hover:border-pink-200 hover:bg-pink-50/50",
                  title: "Role Access",
                  sub: "Mutasi & promote Admin",
                },
                {
                  to: "/division-analytics",
                  icon: "fa-sitemap",
                  color: "text-blue-600",
                  hover: "hover:border-blue-200 hover:bg-blue-50/50",
                  title: "Divisions",
                  sub: "Manajemen struktur divisi",
                },
                {
                  // ✅ MENU BARU 1: APPROVAL CENTER UNTUK SUPERADMIN
                  to: "/approval",
                  icon: "fa-clipboard-check",
                  color: "text-purple-600",
                  hover: "hover:border-purple-200 hover:bg-purple-50/50",
                  title: "Approval Center",
                  sub: "Validasi tugas & izin global",
                },
                {
                  // ✅ MENU BARU 2: WHITEBOOK SYSTEM UNTUK SUPERADMIN
                  to: "/whitebook",
                  icon: "fa-book-bookmark",
                  color: "text-amber-600",
                  hover: "hover:border-amber-200 hover:bg-amber-50/50",
                  title: "Whitebook System",
                  sub: "Pantau SOP & panduan divisi",
                },
                {
                  to: "/broadcasts",
                  icon: "fa-bullhorn",
                  color: "text-emerald-600",
                  hover: "hover:border-emerald-200 hover:bg-emerald-50/50",
                  title: "Broadcast",
                  sub: "Kirim info massal",
                },
                {
                  to: "/audit-log",
                  icon: "fa-shield-halved",
                  color: "text-rose-600",
                  hover: "hover:border-rose-200 hover:bg-rose-50/50",
                  title: "Audit Log",
                  sub: "Riwayat aksi sistem",
                },
              ].map((item) => (
                <Link key={item.to} to={item.to} className={`bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-4 hover:translate-x-1 transition-all group ${item.hover}`}>
                  <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform shrink-0 ${item.color}`}><i className={`fa-solid ${item.icon}`} /></div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-0.5">{item.title}</h4>
                    <p className="text-[10px] font-medium text-slate-500">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Global Audit Log */}
        <div className="lg:col-span-2 bg-gradient-to-br from-pink-50/80 to-rose-50/80 rounded-[2.5rem] border border-pink-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 sm:px-8 py-5 border-b border-pink-200 bg-white/50 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-black text-pink-600 uppercase tracking-widest font-mono flex items-center gap-2">
              <i className="fa-solid fa-radar text-pink-500 animate-pulse" /> Global Audit Log
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 shadow-sm">Live Feed</span>
              <button
                onClick={handleRefreshLog}
                disabled={refreshingLog}
                title="Refresh log"
                className="w-8 h-8 rounded-xl bg-white border border-pink-200 text-pink-400 hover:bg-pink-100 hover:text-pink-600 transition-all flex items-center justify-center disabled:opacity-50 shadow-sm"
              >
                <i className={`fa-solid fa-arrows-rotate text-[11px] ${refreshingLog ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar font-mono text-sm">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b border-pink-100/50 pb-4 animate-pulse">
                    <div className="w-20 h-6 rounded bg-pink-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2"><div className="h-5 w-16 rounded bg-pink-200" /><div className="h-5 w-32 rounded bg-pink-100" /></div>
                      <div className="h-3 w-3/4 rounded bg-pink-100/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-60 py-16">
                <i className="fa-solid fa-shield-halved text-4xl text-pink-300" />
                <p className="text-pink-500 text-sm font-medium">Belum ada aktivitas tercatat</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.slice(0, 4).map((log, index) => {
                  const logDate = new Date(log.created_at);
                  const dateStr = logDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                  const timeStr = logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={log.id || index} className="flex items-start gap-4 border-b border-pink-100/50 pb-4 pt-3 last:border-0 hover:bg-white/40 transition-colors px-2 rounded-xl">
                      <div className="shrink-0 w-[85px] flex flex-col items-start">
                        <span className="text-pink-600 text-[11px] font-black bg-pink-100/80 border border-pink-200 px-2 py-1 rounded-md mb-1.5 shadow-sm">[{dateStr}]</span>
                        <span className="text-slate-400 text-[10px] font-bold ml-1">{timeStr} WIB</span>
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm ${getRoleStyle(log.actor_role)}`}>
                            {log.actor_role?.replace("_", " ") || "SYSTEM"}
                          </span>
                          <span className="text-slate-800 font-bold text-[13px]">{log.actor?.full_name || "System"}</span>
                        </div>
                        <p className="text-slate-600 text-[12px] font-medium leading-relaxed">{log.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && auditLogs.length > 0 && (
            <div className="px-6 sm:px-8 py-4 border-t border-pink-200 bg-white/50 shrink-0">
              <Link to="/audit-log" className="text-[11px] font-black text-pink-500 hover:text-pink-600 uppercase tracking-widest flex items-center gap-2 transition-colors w-max">Lihat Semua Log <i className="fa-solid fa-arrow-right" /></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;