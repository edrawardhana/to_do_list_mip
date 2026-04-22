import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const DeveloperDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({ users: 0, admins: 0, superAdmins: 0, divisions: 0, tasks: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiLatency, setApiLatency] = useState(0);
  const [chartData] = useState(() => Array.from({ length: 24 }, () => Math.floor(Math.random() * 70) + 20));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profilesRes, divisionsRes, tasksRes, logsRes] = await Promise.all([
        api.get("/profiles"),
        api.get("/divisions"),
        api.get("/daily-tasks"),
        api.get("/audit-logs", { params: { page: 1 } }),
      ]);

      const profiles = profilesRes.data?.data || [];
      const divisions = divisionsRes.data?.data || divisionsRes.data || [];
      const tasks = tasksRes.data?.data || tasksRes.data || [];
      const logs = logsRes.data?.data || [];

      const admins = profiles.filter(p => p.role === "admin").length;
      const superAdmins = profiles.filter(p => p.role === "super_admin").length;
      const developers = profiles.filter(p => p.role === "developer").length;
      const interns = profiles.filter(p => p.role === "intern" || p.role === "user").length;

      setStats({
        users: profiles.length,
        admins,
        superAdmins,
        divisions: Array.isArray(divisions) ? divisions.length : 0,
        tasks: Array.isArray(tasks) ? tasks.length : 0,
      });

      setUserRoleData([
        { role: "developer", label: "Developer", count: developers, icon: "fa-code", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
        { role: "super_admin", label: "Super Admin", count: superAdmins, icon: "fa-chess-king", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
        { role: "admin", label: "Admin Divisi", count: admins, icon: "fa-shield-halved", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
        { role: "intern", label: "Intern / User", count: interns, icon: "fa-user-graduate", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      ]);

      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const interval = setInterval(async () => {
      const start = performance.now();
      try {
        await api.get("/divisions");
        setApiLatency(Math.round(performance.now() - start));
      } catch {
        setApiLatency(-1);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getActionBadge = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("login")) return { cls: "text-emerald-400", icon: "fa-right-to-bracket" };
    if (a.includes("hapus") || a.includes("delete")) return { cls: "text-rose-400", icon: "fa-trash-can" };
    if (a.includes("lock") || a.includes("kunci")) return { cls: "text-orange-400", icon: "fa-lock" };
    if (a.includes("role") || a.includes("kasta")) return { cls: "text-purple-400", icon: "fa-crown" };
    if (a.includes("update") || a.includes("profil")) return { cls: "text-amber-400", icon: "fa-pen-to-square" };
    return { cls: "text-sky-400", icon: "fa-bolt" };
  };

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-[#18181b] border border-zinc-800 rounded-[1.5rem] p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${color}`}>
        <i className={`fa-solid ${icon} text-sm`} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
        <h3 className="text-3xl font-black text-zinc-100">{loading ? <span className="text-zinc-700">···</span> : value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================ */}
      {/* HERO SECTION                                                      */}
      {/* ================================================================ */}
      <div className="bg-[#09090b] rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8">
          {/* Left: Identity */}
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
                <i className="fa-solid fa-code text-xl" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                Developer Root Console
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              Platform Control.
            </h1>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Halo <span className="text-zinc-200 font-bold">{user?.full_name || "Dev"}</span>! Monitor sistem, analitik, dan distribusi pengguna secara real-time.
            </p>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <i className="fa-solid fa-gear text-[10px]" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {import.meta.env.MODE === "development" ? "Dev Mode" : "Production"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider">JWT Auth Active</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${apiLatency === -1 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                  apiLatency > 400 ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                    "bg-zinc-900 border-zinc-800 text-sky-400"
                }`}>
                <i className={`fa-solid fa-wifi text-[10px] ${apiLatency !== -1 ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Ping: {apiLatency === -1 ? "OFFLINE" : apiLatency === 0 ? "···" : `${apiLatency}ms`}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="w-full lg:w-80 shrink-0 bg-zinc-900/50 border border-zinc-800/60 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-zinc-200">API Load (24h)</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Synthetic proxy metrics</p>
              </div>
              <i className="fa-solid fa-chart-column text-zinc-700 text-lg" />
            </div>
            <div className="flex items-end gap-0.5 h-24 w-full">
              {chartData.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-sky-500/20 to-sky-400/70 rounded-t-sm hover:to-sky-300 transition-all duration-300 cursor-pointer"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Normal</p>
              <p className="text-[9px] font-bold text-zinc-600">Auto Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* QUICK STATS                                                        */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users} icon="fa-users" color="bg-sky-500/10 text-sky-400 border-sky-500/20" />
        <StatCard label="Total Divisi" value={stats.divisions} icon="fa-building" color="bg-purple-500/10 text-purple-400 border-purple-500/20" />
        <StatCard label="Log Harian" value={stats.tasks} icon="fa-clipboard-list" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
        <StatCard label="Total Admins" value={stats.admins + stats.superAdmins} icon="fa-user-shield" color="bg-amber-500/10 text-amber-400 border-amber-500/20" />
      </div>

      {/* ================================================================ */}
      {/* SYSTEM ANALYTICS: Role Distribution + Navigation Hub             */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Role Distribution */}
        <div className="lg:col-span-7 bg-[#0f0f11] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#18181b] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <i className="fa-solid fa-users-gear text-xs text-purple-400" />
            </div>
            <h3 className="font-black text-zinc-200 text-sm">Distribusi Peran Sistem</h3>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-[#18181b] border border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-zinc-800 rounded" />
                    <div className="h-2 w-16 bg-zinc-900 rounded" />
                  </div>
                  <div className="w-12 h-10 bg-zinc-800 rounded-xl" />
                </div>
              ))
            ) : userRoleData.map((r) => (
              <div key={r.role} className="flex items-center justify-between p-4 rounded-2xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner border ${r.cls}`}>
                    <i className={`fa-solid ${r.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-200 uppercase tracking-wider">{r.label}</p>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden" style={{ width: "8rem" }}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${r.cls.includes("rose") ? "bg-rose-500" : r.cls.includes("purple") ? "bg-purple-500" : r.cls.includes("sky") ? "bg-sky-500" : "bg-emerald-500"}`}
                        style={{ width: stats.users > 0 ? `${Math.min(100, (r.count / stats.users) * 100)}%` : "0%" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center bg-zinc-800/60 border border-zinc-700 rounded-xl w-14 py-2.5 shrink-0">
                  <span className="text-xl font-black text-white">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Module Navigation Hub */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-compass" /> Quick Access
          </h3>
          <Link to="/system-config" className="group relative overflow-hidden bg-[#18181b] border border-zinc-800 rounded-[1.5rem] p-5 hover:border-zinc-600 transition-all flex-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#09090b] border border-zinc-700 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner">
                <i className="fa-solid fa-server text-lg" />
              </div>
              <div>
                <h3 className="font-black text-zinc-200">System Config</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Global Parameters Editor</p>
              </div>
            </div>
            <div className="flex justify-end relative z-10 mt-4">
              <span className="text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all">
                <i className="fa-solid fa-arrow-right" />
              </span>
            </div>
          </Link>

          <Link to="/audit-log" className="group relative overflow-hidden bg-[#18181b] border border-zinc-800 rounded-[1.5rem] p-5 hover:border-zinc-600 transition-all flex-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#09090b] border border-zinc-700 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
                <i className="fa-solid fa-shield-halved text-lg" />
              </div>
              <div>
                <h3 className="font-black text-zinc-200">Security Audit Log</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Full Server Tracing & Search</p>
              </div>
            </div>
            <div className="flex justify-end relative z-10 mt-4">
              <span className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                <i className="fa-solid fa-arrow-right" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TERMINAL AUDIT LOG (Recent Activity)                              */}
      {/* ================================================================ */}
      <div className="bg-[#0f0f11] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 bg-[#18181b] flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <i className="fa-solid fa-terminal text-xs" />
            </div>
            <div className="truncate">
              <h3 className="font-black text-zinc-200 text-xs sm:text-sm truncate">Terminal Audit Log</h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-600 uppercase tracking-widest truncate">6 Aktivitas Terbaru</p>
            </div>
          </div>
          <Link
            to="/audit-log"
            className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors bg-zinc-800/80 hover:bg-zinc-700 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-zinc-700 flex items-center gap-2 shrink-0"
          >
            <span className="hidden sm:inline">Full</span> Log <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>

        {/* Log list */}
        <div className="p-3 sm:p-6 space-y-2 sm:space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-[#18181b] border border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 w-3/4 sm:w-48 bg-zinc-800 rounded" />
                  <div className="h-2 w-1/2 sm:w-32 bg-zinc-900 rounded" />
                </div>
                <div className="hidden sm:block h-7 w-28 bg-zinc-800 rounded-lg" />
              </div>
            ))
          ) : recentLogs.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-inbox text-xl text-zinc-700" />
              </div>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Belum ada log aktivitas</p>
            </div>
          ) : (
            recentLogs.map((log, i) => {
              const badge = getActionBadge(log.action);
              const actorName = log.actor?.full_name || log.actor_name || "System";
              const targetName = log.target?.full_name || log.target_name || null;

              return (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-all gap-3 sm:gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className={`mt-0.5 sm:mt-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors ${badge.cls}`}>
                      <i className={`fa-solid ${badge.icon} text-[10px] sm:text-xs`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-sm font-black text-zinc-200 leading-tight truncate">
                        <span className="text-zinc-500 font-bold">{actorName}</span>
                        <span className="text-zinc-700 mx-1">→</span>
                        <span className={badge.cls}>{log.action || "Execute"}</span>
                        {targetName && (
                          <>
                            <span className="text-zinc-700 mx-1">→</span>
                            <span className="text-zinc-400">{targetName}</span>
                          </>
                        )}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-mono text-zinc-700 mt-1 truncate">
                        {log.new_values ? JSON.stringify(log.new_values) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-11 sm:pl-0 flex justify-start sm:justify-end">
                    <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* DANGER ZONE                                                        */}
      {/* ================================================================ */}
      <div className="bg-[#0f0f11] border border-rose-900/30 rounded-[2rem] overflow-hidden shadow-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-rose-500/5 pointer-events-none" />

        <div className="px-6 py-4 border-b border-rose-900/30 bg-rose-950/20 flex items-center justify-between gap-3 relative z-10">
          <h3 className="font-black text-rose-500 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <i className="fa-solid fa-skull-crossbones text-xs text-rose-400" />
            </div>
            Danger Zone
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/40 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/30">
            Developer Only
          </span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {[
            { icon: "fa-rotate", color: "orange", title: "Force Reset Daily Tasks", desc: "Memaksa arsip harian dan regenerasi template tanpa menunggu Cron.", label: "Execute Reset" },
            { icon: "fa-trash-can", color: "rose", title: "Purge Old Logs", desc: "Hapus permanen audit_logs lebih dari 30 hari untuk efisiensi storage.", label: "Purge Storage" },
            { icon: "fa-unlock", color: "emerald", title: "Unlock All Users", desc: "Melepas blokir (is_locked=false) dari semua akun user yang ditahan.", label: "Force Unlock" },
          ].map(({ icon, color, title, desc, label }) => {
            const colorMap = {
              orange: { card: "hover:border-orange-500/40 hover:bg-orange-500/5", icon: "bg-orange-500/10 text-orange-500", btn: "text-orange-400 border-orange-500/20 hover:bg-orange-500/20" },
              rose: { card: "hover:border-rose-500/40 hover:bg-rose-500/5", icon: "bg-rose-500/10 text-rose-500", btn: "text-rose-400 border-rose-500/20 hover:bg-rose-500/20" },
              emerald: { card: "hover:border-emerald-500/40 hover:bg-emerald-500/5", icon: "bg-emerald-500/10 text-emerald-500", btn: "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" },
            };
            const c = colorMap[color];
            return (
              <div key={title} className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 group transition-all ${c.card}`}>
                <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${icon} text-lg`} />
                </div>
                <h4 className="text-zinc-200 font-black text-sm mb-2">{title}</h4>
                <p className="text-xs text-zinc-600 mb-5 leading-relaxed min-h-[48px]">{desc}</p>
                <button className={`w-full py-2.5 rounded-xl bg-zinc-900 text-xs font-black uppercase tracking-widest border transition-colors ${c.btn}`}>
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DeveloperDashboard;