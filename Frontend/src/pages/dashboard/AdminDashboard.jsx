import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "../../api/axios";
import toast from "react-hot-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const myDivision = user?.division?.name || user?.division_name || "Divisi Anda";

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
      badgeCls: "text-emerald-700 bg-emerald-100 border-emerald-200",
      icon: "fa-users", iconBg: "bg-emerald-50 text-emerald-600",
      hover: "hover:border-emerald-300 hover:shadow-emerald-100",
      footer: `Dari ${stats.totalInterns} orang di divisi`, footerIcon: "fa-circle-info",
    },
    {
      label: "Antrean ACC", value: stats.pendingTasks, badge: "Tugas",
      badgeCls: "text-amber-700 bg-amber-100 border-amber-200",
      icon: "fa-clipboard-check", iconBg: "bg-amber-50 text-amber-500",
      hover: "hover:border-amber-300 hover:shadow-amber-100",
      footer: "Butuh validasi segera", footerIcon: "fa-envelope-open-text",
    },
    {
      label: "Pending User", value: stats.pendingUsers, badge: "Baru",
      badgeCls: "text-rose-700 bg-rose-100 border-rose-200",
      icon: "fa-user-clock", iconBg: "bg-rose-50 text-rose-500",
      hover: "hover:border-rose-300 hover:shadow-rose-100",
      footer: "Segera verifikasi data", footerIcon: "fa-triangle-exclamation",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 pt-8 px-2 max-w-7xl mx-auto">

      {/* ── HERO + PIE CHART ─────────────────────────────────────────────── */}
      <div className="bg-blue-950/95 backdrop-blur-2xl rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 relative overflow-hidden group flex flex-col lg:flex-row min-h-[420px]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Kiri: Hero */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-emerald-400 shadow-lg shrink-0">
                <i className="fa-solid fa-server text-lg" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-blue-950 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                System Online • {myDivision}
              </span>
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
          <div className="flex flex-wrap gap-3">
            <Link to="/approval" className="bg-white text-blue-900 px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:-translate-y-1">
              Validasi Tugas <i className="fa-solid fa-arrow-right ml-2" />
            </Link>
            <Link to="/tasks" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3.5 rounded-2xl text-sm font-black hover:bg-white/20 transition-all">
              Buat Task
            </Link>
          </div>
        </div>

        {/* Kanan: Pie Chart */}
        <div className="w-full lg:w-[450px] xl:w-[500px] p-8 md:p-10 relative z-10 flex flex-col bg-white/[0.02]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight">Top Kontribusi Intern</h3>
              <p className="text-[11px] font-medium text-blue-200/70 mt-1">Berdasarkan task yang di-ACC.</p>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-blue-800 border-t-blue-400 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40">
                <i className="fa-solid fa-chart-pie text-5xl text-blue-400" />
                <p className="text-xs text-blue-300 font-medium">Belum ada data tugas selesai</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="tasks" stroke="none">
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} Tugas`, 'Diselesaikan']} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#93c5fd' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
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
                <div className="h-12 w-20 bg-slate-100 rounded-xl animate-pulse" />
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

        {/* Card 4: Broadcast */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-[2rem] p-7 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group flex flex-col h-full hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
            <i className="fa-solid fa-tower-broadcast text-8xl" />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200 mt-1">Informasi</p>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform border border-white/20">
                <i className="fa-solid fa-bullhorn" />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-1 leading-tight tracking-tight">Broadcast<br />Pesan</h3>
            <p className="text-[12px] font-medium text-blue-100/90 mb-5">Kirim info darurat ke divisi</p>
          </div>
          <div className="relative z-10 mt-auto">
            <Link to="/broadcasts" className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-blue-600 bg-white hover:bg-slate-50 px-4 py-3.5 rounded-xl transition-colors shadow-sm uppercase tracking-widest">
              Kirim <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + ACTIVITY LOG ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-5">
              <i className="fa-solid fa-bolt text-blue-500 mr-2" />Aksi Cepat
            </h3>
            <div className="space-y-3 flex-1">
              {[
                { to: "/approval",      icon: "fa-check-to-slot",  color: "text-blue-600",   hover: "hover:border-blue-200 hover:bg-blue-50/50",     title: "Approval Center",  sub: "Validasi tugas & izin" },
                { to: "/manage-intern", icon: "fa-users-gear",     color: "text-emerald-600",hover: "hover:border-emerald-200 hover:bg-emerald-50/50",title: "Manage Interns",   sub: "Manajemen akun magang" },
                { to: "/tasks",         icon: "fa-list-check",     color: "text-purple-600", hover: "hover:border-purple-200 hover:bg-purple-50/50",  title: "Manage Tasks",     sub: "Buat & edit tugas harian" },
                { to: "/broadcasts",    icon: "fa-bullhorn",       color: "text-sky-600",    hover: "hover:border-sky-200 hover:bg-sky-50/50",        title: "Broadcast",        sub: "Kirim instruksi ke divisi" },
                { to: "/whitebook",     icon: "fa-book-bookmark",  color: "text-amber-600",  hover: "hover:border-amber-200 hover:bg-amber-50/50",    title: "Update Whitebook", sub: "Edit SOP & panduan divisi" },
                { to: "/reports",       icon: "fa-file-invoice",   color: "text-rose-600",   hover: "hover:border-rose-200 hover:bg-rose-50/50",      title: "Reports",          sub: "Laporan kinerja divisi" },
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

        {/* Activity Log */}
        <div className="lg:col-span-2 bg-blue-950 rounded-[2.5rem] border border-white/10 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest font-mono flex items-center gap-2">
              <i className="fa-solid fa-terminal text-emerald-400" /> System Log ({myDivision})
            </h3>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-[10px] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-blue-950 font-mono text-sm">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 pb-4 border-b border-white/5 animate-pulse">
                    <div className="w-24 h-3 rounded bg-white/10 shrink-0 mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="h-4 w-14 rounded bg-blue-700/30" />
                        <div className="h-4 w-20 rounded bg-white/10" />
                      </div>
                      <div className="h-3 w-full rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40 py-16">
                <i className="fa-solid fa-terminal text-4xl text-blue-400" />
                <p className="text-blue-300 text-sm font-medium">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log, i) => (
                  <div key={log.id || i} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-white/5 pb-4 hover:bg-white/[0.03] transition-colors p-2 rounded-lg">
                    <div className="text-blue-300/60 text-[11px] shrink-0 pt-0.5 w-[75px]">[{formatRelativeTime(log.created_at)}]</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          log.actor_role === 'super_admin' ? 'bg-purple-400 text-blue-950' :
                          log.actor_role === 'admin' ? 'bg-emerald-400 text-blue-950' : 'bg-blue-400 text-blue-950'
                        }`}>{log.actor_role || "activity"}</span>
                        <span className="text-blue-300 font-bold text-xs">{log.actor?.full_name || "System"}</span>
                      </div>
                      <p className="text-blue-100/70 text-xs">{log.action}</p>
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