import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const Broadcasts = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (FULL PAGE)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;

  const theme = {
    // --- HERO THEME ---
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-emerald-400" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-white/10 border-white/10 text-sky-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" 
      : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" 
      : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    
    // --- TARGET SELECTION THEME ---
    targetWrap: isDeveloperTheme ? "bg-[#141417] border-t border-zinc-800/50" 
      : isPurpleTheme ? "bg-[#281c47] border-t border-purple-800/50" 
      : "bg-[#161d3d] border-t border-blue-800/50",
    optBase: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 hover:bg-zinc-800/50" 
      : isPurpleTheme ? "bg-[#1d1633] border-purple-800/30 hover:bg-purple-800/30" 
      : "bg-[#0b1437] border-blue-800/30 hover:bg-blue-800/30",
    optActive: isDeveloperTheme ? "bg-[#27272a] border-zinc-500 shadow-lg" 
      : isPurpleTheme ? "bg-purple-800/60 border-purple-400 shadow-purple-900/50 shadow-lg" 
      : "bg-blue-800/60 border-blue-400 shadow-blue-900/50 shadow-lg",
    optTitleActive: "text-white",
    optTitleMuted: isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-200" : "text-blue-200",
    optDesc: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-300/70" : "text-blue-300/70",
    targetBox: isDeveloperTheme ? "bg-[#09090b] border-zinc-800" : isPurpleTheme ? "bg-[#1d1633] border-purple-800/30" : "bg-[#0b1437] border-blue-800/30",
    targetBadgeActive: isDeveloperTheme ? "bg-zinc-700 text-zinc-100 border-zinc-600" 
      : isPurpleTheme ? "bg-purple-600 text-white border-purple-500" 
      : "bg-blue-600 text-white border-blue-500",
    targetBadgeMuted: isDeveloperTheme ? "bg-transparent text-zinc-400 border-zinc-700 hover:bg-zinc-800/50" 
      : isPurpleTheme ? "bg-transparent text-purple-300 border-purple-700/50 hover:bg-purple-800/40" 
      : "bg-transparent text-blue-300 border-blue-700/50 hover:bg-blue-800/40",

    // --- TOOLBAR (LANTAI HERO) ---
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    searchInputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/50",

    // --- BOTTOM PANELS ---
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200",
    panelTitle: isDeveloperTheme ? "text-zinc-200 border-zinc-800/50 bg-[#141417]" : "text-slate-800 border-slate-100 bg-slate-50/50",
    inputBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-zinc-600"
      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-500",
    btnPrimary: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30 text-white disabled:bg-zinc-800 disabled:text-zinc-600"
      : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30 text-white disabled:bg-slate-300"
      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white disabled:bg-slate-300",
    logCard: isDeveloperTheme ? "bg-[#141417] border-zinc-800 hover:border-zinc-600" : "bg-white border-slate-200 hover:border-blue-200",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
  };

  const [allDivisions, setAllDivisions] = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState(isAdmin && !isPurpleTheme && !isDeveloperTheme ? "division_locked" : "global");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchLog, setSearchLog] = useState("");
  
  // 🔥 FIX: Tambahin state loadingLogs di sini
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchBroadcastData = async () => {
    setLoadingLogs(true); // Aktifin skeleton loading
    try {
      const [divRes, internRes, histRes] = await Promise.all([
        api.get('/divisions'), 
        api.get('/profiles'), 
        api.get('/broadcasts/history')
      ]);
      setAllDivisions(divRes.data?.data || divRes.data || []);
      setAllInterns((internRes.data?.data || internRes.data || []).filter(u => u.role === 'intern').map(i => ({ ...i, name: i.full_name || i.name })));
      setHistory(histRes.data?.data || histRes.data || []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoadingLogs(false); // Matiin skeleton loading
    }
  };

  useEffect(() => { fetchBroadcastData(); }, []);

  const targetOptions = useMemo(() => {
    if (isDeveloper || isSuperAdmin) return [
      { value: "global", label: "Global (Semua Intern)", desc: "Kirim ke seluruh anak magang" },
      { value: "division", label: "Divisi Spesifik", desc: "Pilih satu/beberapa divisi" },
      { value: "personal", label: "Personal", desc: "Pilih orang tertentu" }
    ];
    if (isAdmin) return [
      { value: "division_locked", label: `Semua Anak ${myDivision}`, desc: "Kirim ke divisi lu aja" },
      { value: "personal_locked", label: `Personal`, desc: "Pilih orang di divisi lu" }
    ];
    return [];
  }, [isDeveloper, isSuperAdmin, isAdmin, myDivision]);

  const [category, setCategory] = useState("info");
  const [fcmResult, setFcmResult] = useState(null);

  const availableTargetList = useMemo(() => {
    if (targetType === "division") return allDivisions;
    if (targetType === "personal") return allInterns;
    if (targetType === "personal_locked") return allInterns.filter(i => (i.division?.name || i.division || "") === myDivision);
    return [];
  }, [targetType, allDivisions, allInterns, myDivision]);

  const toggleTarget = (item) => setSelectedTargets(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);

  const filteredLogs = useMemo(() => {
    if (!searchLog) return history;
    const q = searchLog.toLowerCase();
    return history.filter(l => l.title?.toLowerCase().includes(q) || l.content?.toLowerCase().includes(q) || l.target?.toLowerCase().includes(q));
  }, [history, searchLog]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if ((targetType.includes("division") && targetType !== "division_locked") || targetType.includes("personal")) {
      if (selectedTargets.length === 0) return toast.error("Pilih minimal 1 target!");
    }
    setIsLoading(true);
    setFcmResult(null);
    try {
      const targets = selectedTargets.map(t => t.id || t);
      const res = await api.post('/broadcasts/send', {
        title,
        content: message,
        targetType,
        targets,
        category,
      });
      const fcm = res.data?.fcm;
      setFcmResult(fcm);

      if (fcm?.skipped) {
        toast.success("Broadcast disimpan! FCM dilewati.");
      } else if (fcm?.sent > 0) {
        toast.success(`Broadcast terkirim! FCM: ${fcm.sent} perangkat.`);
      } else {
        toast.success("Broadcast disimpan! Tidak ada device token aktif.");
      }

      setTitle(""); setMessage(""); setSelectedTargets([]);
      fetchBroadcastData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim Broadcast");
    } finally {
      setIsLoading(false);
    }
  };

  const fmtTime = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' - ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION + TARGET (NO WHITESPACE)                               */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white transition-colors duration-700 ${theme.heroBg}`}>

        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        {/* Info Hero */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-satellite-dish text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Push Notification System
              </span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight transition-colors duration-500 ${theme.title}`}>
              Broadcast Center.
            </h1>
            <p className={`text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Kirimkan pengumuman serentak ke layar handphone pengguna magang secara langsung via Firebase Cloud Messaging.
            </p>
          </div>

          {/* Widget Firebase */}
          <div className={`w-full lg:w-80 shrink-0 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-center items-center gap-4 text-center border transition-colors duration-500 ${theme.widgetBg}`}>
            <i className={`fa-brands fa-google text-4xl ${isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-300" : "text-blue-300"}`} />
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-300" : "text-blue-300"}`}>Powered by</p>
              <p className={`text-xl font-black ${isDeveloperTheme ? "text-zinc-300" : "text-white"}`}>Firebase FCM</p>
            </div>
          </div>
        </div>

        {/* Target Selection Dock (Dalam Hero) */}
        <div className={`p-6 sm:p-8 relative z-10 transition-colors duration-500 ${theme.targetWrap}`}>
          <label className={`text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 mb-5 ${isDeveloperTheme ? "text-zinc-400" : "text-white/70"}`}>
            <i className="fa-solid fa-crosshairs" /> 1. Tentukan Target Penerima Pesan
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetOptions.map(opt => (
              <label key={opt.value} className={`flex items-start gap-3 p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                  targetType === opt.value ? theme.optActive : theme.optBase
                }`}>
                <div className="mt-0.5 shrink-0">
                  <input type="radio" name="target" value={opt.value} checked={targetType === opt.value} onChange={() => { setTargetType(opt.value); setSelectedTargets([]); }} className={`w-4 h-4 bg-transparent border-zinc-500 focus:ring-offset-transparent ${isDeveloperTheme ? "text-emerald-500 focus:ring-emerald-500" : isPurpleTheme ? "text-purple-400 focus:ring-purple-400" : "text-blue-400 focus:ring-blue-400"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold mb-1 truncate ${targetType === opt.value ? theme.optTitleActive : theme.optTitleMuted}`}>{opt.label}</p>
                  <p className={`text-[10px] font-medium leading-tight ${theme.optDesc}`}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {(targetType === "division" || targetType === "personal" || targetType === "personal_locked") && (
            <div className={`animate-in fade-in slide-in-from-top-2 mt-4 p-5 sm:p-6 rounded-2xl border transition-colors duration-500 ${theme.targetBox}`}>
              <p className={`text-[10px] font-bold mb-4 uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-white/60"}`}>Pilih dari daftar di bawah (bisa multi-select):</p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {availableTargetList.map(item => {
                  const val = typeof item === 'string' ? item : item.id;
                  const label = typeof item === 'string' ? item : item.name;
                  const isSelected = selectedTargets.includes(val);
                  return (
                    <button key={val} type="button" onClick={() => toggleTarget(val)} className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        isSelected ? theme.targetBadgeActive : theme.targetBadgeMuted
                      }`}>
                      {label} {isSelected && <i className="fa-solid fa-check text-[10px]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* TOOLBAR BAWAH: SEARCH RIWAYAT */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-8 py-3 sm:py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          <div className="flex items-center gap-2">
            <i className={`fa-solid fa-clock-rotate-left ${theme.iconMuted}`} />
            <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-widest ${theme.iconMuted}`}>Riwayat Penyiaran</span>
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
            <input type="text" placeholder="Cari judul/isi pesan..." value={searchLog} onChange={e => setSearchLog(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none border transition-colors shadow-sm ${theme.searchInputBg}`} />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* KONTEN BAWAH (Form & History)                                       */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6">
          <div className={`rounded-[2rem] border p-6 sm:p-8 shadow-sm flex flex-col h-full transition-colors duration-500 ${theme.panelBg}`}>
            <h3 className={`text-lg sm:text-xl font-black mb-6 flex items-center gap-3 border-b pb-5 transition-colors duration-500 ${theme.panelTitle}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : isPurpleTheme ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                <i className="fa-solid fa-pen-nib text-sm" />
              </div>
              Tulis Pesan Broadcast
            </h3>

            {(targetType === "global" || targetType === "division_locked") ? (
              <div className={`border rounded-xl p-4 mb-6 flex gap-3 items-start transition-colors duration-500 ${isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700" : isPurpleTheme ? "bg-fuchsia-50 border-fuchsia-200" : "bg-amber-50 border-amber-200"}`}>
                <i className={`fa-solid fa-bullhorn mt-0.5 shrink-0 ${isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-fuchsia-500" : "text-amber-500"}`} />
                <div>
                  <p className={`text-[11px] sm:text-xs font-black uppercase tracking-widest mb-1 ${isDeveloperTheme ? "text-zinc-300" : isPurpleTheme ? "text-fuchsia-800" : "text-amber-800"}`}>Broadcast Massal</p>
                  <p className={`text-[10px] sm:text-[11px] font-medium leading-relaxed ${isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-fuchsia-700/80" : "text-amber-700/80"}`}>Pesan ini akan dikirim ke semua layar HP target secara serentak.</p>
                </div>
              </div>
            ) : (
              <div className={`border rounded-xl p-4 mb-6 flex gap-3 items-start transition-colors duration-500 ${isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700" : isPurpleTheme ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"}`}>
                <i className={`fa-solid fa-user-check mt-0.5 shrink-0 ${isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-500" : "text-blue-500"}`} />
                <div>
                  <p className={`text-[11px] sm:text-xs font-black uppercase tracking-widest mb-1 ${isDeveloperTheme ? "text-zinc-300" : isPurpleTheme ? "text-purple-800" : "text-blue-800"}`}>Target Personal: {selectedTargets.length}</p>
                  <p className={`text-[10px] sm:text-[11px] font-medium leading-relaxed ${isDeveloperTheme ? "text-zinc-400" : isPurpleTheme ? "text-purple-700/80" : "text-blue-700/80"}`}>Pesan hanya akan masuk ke notifikasi target yang dipilih.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-5 flex-1 flex flex-col">
              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] block mb-2 ${theme.textSecondary}`}>2. Judul Notifikasi <span className="text-rose-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Misal: Info Shift Mendadak!" className={`w-full rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm font-bold outline-none transition-colors duration-500 border ${theme.inputBg}`} />
              </div>
              <div className="flex-1 flex flex-col">
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] mb-2 flex justify-between ${theme.textSecondary}`}>3. Isi Pesan Singkat <span className="text-rose-500">*</span></label>
                <textarea rows="4" value={message} onChange={e => setMessage(e.target.value)} required placeholder="Ketik pesan yang akan muncul di pop-up notifikasi layar HP target..." className={`w-full rounded-xl p-4 sm:p-5 text-sm font-medium outline-none resize-none transition-colors duration-500 flex-1 min-h-[120px] border ${theme.inputBg}`}></textarea>
                <div className="flex justify-end mt-2">
                  <p className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${message.length > 150 ? 'text-rose-500' : theme.textSecondary}`}>{message.length}/150 Karakter</p>
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] block mb-2 ${theme.textSecondary}`}>4. Kategori</label>
                <div className="flex gap-2">
                  {[
                    { val: "info",   icon: "fa-circle-info",      label: "Info",   cls: isDeveloperTheme ? "border-sky-500/40 bg-sky-500/10 text-sky-400" : "border-blue-300 bg-blue-50 text-blue-700" },
                    { val: "urgent", icon: "fa-triangle-exclamation", label: "Urgent", cls: isDeveloperTheme ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-rose-300 bg-rose-50 text-rose-700" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCategory(opt.val)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black border transition-all ${
                        category === opt.val
                          ? opt.cls
                          : isDeveloperTheme ? "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600" : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <i className={`fa-solid ${opt.icon}`}></i> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FCM result badge */}
              {fcmResult && !fcmResult.skipped && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold ${
                  fcmResult.sent > 0
                    ? isDeveloperTheme ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  <i className="fa-brands fa-google text-base"></i>
                  <span>FCM: <strong>{fcmResult.sent}</strong> terkirim · <strong>{fcmResult.failed}</strong> gagal · <strong>{fcmResult.no_token}</strong> tanpa token</span>
                </div>
              )}

              <div className="pt-2 sm:pt-4">
                <button type="submit" disabled={isLoading || ((targetType.includes("division") || targetType.includes("personal")) && targetType !== "division_locked" && selectedTargets.length === 0)} className={`w-full py-3.5 sm:py-4 rounded-xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:shadow-none disabled:cursor-not-allowed ${theme.btnPrimary}`}>
                  {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Mengirim...</> : <><i className="fa-solid fa-paper-plane" /> Kirim Sekarang</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className={`lg:col-span-6 xl:col-span-7 rounded-[2rem] border shadow-sm flex flex-col h-full min-h-[400px] sm:min-h-[500px] overflow-hidden transition-colors duration-500 ${theme.panelBg}`}>
          <div className={`px-6 sm:px-8 py-5 sm:py-6 border-b flex justify-between items-center shrink-0 transition-colors duration-500 ${theme.panelTitle}`}>
            <h3 className={`font-black flex items-center gap-3 ${theme.textPrimary}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : isPurpleTheme ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                <i className="fa-solid fa-clock-rotate-left text-sm" />
              </div>
              Log Penyiaran
            </h3>
          </div>
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3 sm:space-y-4">
              {loadingLogs ? (
                Array.from({length: 4}).map((_, i) => <div key={i} className={`h-24 rounded-2xl animate-pulse border ${theme.logCard}`} />)
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-10 sm:py-16 flex flex-col items-center opacity-40">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-3 border ${isDeveloperTheme ? "bg-zinc-800/50 text-zinc-600 border-zinc-700/50" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                    <i className="fa-solid fa-inbox" />
                  </div>
                  <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>Belum ada riwayat</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className={`border rounded-2xl p-4 sm:p-5 transition-all group shadow-sm ${theme.logCard}`}>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${isDeveloperTheme ? "bg-zinc-800 text-zinc-400" : "bg-slate-100 text-slate-500"}`}>
                        <i className="fa-regular fa-clock mr-1" /> {log.date || new Date(log.created_at || Date.now()).toLocaleDateString('id-ID')}
                      </span>
                      <span className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shrink-0 ${isDeveloperTheme ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                        <i className="fa-solid fa-check-double" /> Terkirim
                      </span>
                    </div>
                    <h4 className={`text-[13px] sm:text-[15px] font-bold mb-1.5 sm:mb-2 leading-tight ${theme.textPrimary}`}>{log.title}</h4>
                    {log.content && <p className={`text-[11px] sm:text-xs font-medium leading-relaxed mb-3 line-clamp-2 ${theme.textSecondary}`}>{log.content}</p>}
                    <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isDeveloperTheme ? "border-zinc-800" : "border-slate-100"}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>Target:</span>
                        <span className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md border truncate max-w-[80px] sm:max-w-[120px] ${isDeveloperTheme ? "text-zinc-300 bg-zinc-700/50 border-zinc-600" : isPurpleTheme ? "text-purple-600 bg-purple-50 border-purple-100" : "text-blue-600 bg-blue-50 border-blue-100"}`}>{log.target || 'Global'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-black border border-white ${isDeveloperTheme ? "bg-zinc-700 text-zinc-300 border-zinc-600" : "bg-slate-200 text-slate-600"}`}>{(log.sender || 'A').charAt(0)}</div>
                        <span className={`text-[9px] sm:text-[10px] font-bold truncate max-w-[60px] sm:max-w-xs ${theme.textSecondary}`}>{log.sender || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcasts;