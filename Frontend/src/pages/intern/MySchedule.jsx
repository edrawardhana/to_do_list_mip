import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function MySchedule() {
  const { user, isDeveloper, isSuperAdmin, isAdmin } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO SECTION)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  // Default buat Intern & Admin adalah tema Biru
  const isBlueTheme = !isDeveloperTheme && !isPurpleTheme;

  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#242b4d] border-[#303861] shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/20",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-blue-500/20 border-blue-400/30 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" 
      : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" 
      : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: isDeveloperTheme ? "text-white" 
      : isPurpleTheme ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200" 
      : "text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    statItem: isDeveloperTheme ? "text-zinc-400" : "text-white/80",
  };

  const shiftConfig = {
    morning: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Morning', time: '08:00 - 15:00', icon: 'fa-sun', short: 'M' },
    afternoon: { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'Afternoon', time: '15:00 - 22:00', icon: 'fa-cloud-sun', short: 'A' },
    full: { bg: 'bg-purple-500', light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Cuti', time: 'Hari Libur', icon: 'fa-umbrella-beach', short: 'C' },
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), year, month };
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      const allSchedules = response.data.data || [];
      const { year, month } = getDaysInMonth(currentMonth);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;

      setSchedules(allSchedules.filter(s => {
        const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
        return d >= startDate && d <= endDateStr;
      }));
    } catch (error) {
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [currentMonth]);

  const getScheduleForDay = (day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.find(s => (s.shift_date ? s.shift_date.substring(0, 10) : '') === dateStr);
  };

  const stats = useMemo(() => schedules.reduce((acc, s) => {
    if (s.shift_type === 'morning') acc.morning++;
    else if (s.shift_type === 'afternoon') acc.afternoon++;
    else if (s.shift_type === 'full') acc.full++;
    acc.total++;
    return acc;
  }, { morning: 0, afternoon: 0, full: 0, total: 0 }), [schedules]);

  const today = new Date();
  const { daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todaySchedule = isCurrentMonth ? getScheduleForDay(today.getDate()) : null;
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const getSafeDateDisplay = (dateString) => {
    if (!dateString) return { day: '-', date: '-' };
    const parts = dateString.split('T')[0].split('-');
    const safeObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return {
      day: safeObj.toLocaleDateString('id-ID', { weekday: 'long' }),
      date: safeObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center animate-pulse">
        <i className="fa-solid fa-calendar-days text-4xl text-blue-500/50 mb-4"></i>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Schedule...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 pb-24 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* ================================================================= */}
        {/* HERO HEADER (DYNAMIC THEME)                                         */}
        {/* ================================================================= */}
        <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
          {/* Glow Effects */}
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
          <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8">
            <div className="lg:max-w-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                  <i className="fa-regular fa-calendar-check text-xl" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                  Shift Planning System
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight transition-colors duration-500 ${theme.title}`}>
                My Schedule.
              </h1>
              <p className={`text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
                Pantau jadwal kerjamu, plot shift harian, dan ajukan hari libur dengan mudah dalam satu tampilan.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider">
                  <i className="fa-solid fa-building-user opacity-60" /> {user?.division?.name || "MCC Intern"}
                </div>
              </div>
            </div>

            {/* Stats Widget Kanan */}
            <div className={`w-full lg:w-80 shrink-0 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-center gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Month Summary</span>
                <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded-md">{monthName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-white/40 mb-1">Hari Kerja</span>
                  <span className="text-xl font-black text-white">{stats.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-emerald-400 mb-1">Morning</span>
                  <span className="text-xl font-black text-white">{stats.morning}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-orange-400 mb-1">Afternoon</span>
                  <span className="text-xl font-black text-white">{stats.afternoon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-purple-400 mb-1">Cuti</span>
                  <span className="text-xl font-black text-white">{stats.full}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Highlight (Responsive) */}
        {isCurrentMonth && (
          <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition-all animate-in slide-in-from-left duration-700 ${
            todaySchedule ? shiftConfig[todaySchedule.shift_type]?.light : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  todaySchedule ? shiftConfig[todaySchedule.shift_type]?.bg + ' text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                }`}>
                  <i className={`fa-solid ${todaySchedule ? shiftConfig[todaySchedule.shift_type]?.icon : 'fa-mug-hot'}`}></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-0.5">Focus Hari Ini</p>
                  <h2 className={`text-xl sm:text-2xl font-black ${todaySchedule ? shiftConfig[todaySchedule.shift_type]?.text : 'text-slate-700'}`}>
                    {todaySchedule ? todaySchedule.shift_type.toUpperCase() + ' SHIFT' : 'DAY OFF / ISTIRAHAT'}
                  </h2>
                  <p className="text-slate-500 text-xs font-medium">
                    <i className="fa-regular fa-clock mr-1"></i> {todaySchedule ? shiftConfig[todaySchedule.shift_type]?.time : 'Selamat beristirahat brok!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-slate-200/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-slate-600">{today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Calendar Panel */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-4 sm:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-90">
                <i className="fa-solid fa-chevron-left text-slate-400"></i>
              </button>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">{monthName}</h2>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-90">
                <i className="fa-solid fa-chevron-right text-slate-400"></i>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                <div key={d} className={`text-center text-[10px] sm:text-xs font-black uppercase tracking-widest py-2 ${d === 'Min' || d === 'Sab' ? 'text-rose-400' : 'text-slate-400'}`}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-3">
              {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square sm:min-h-[80px] rounded-2xl bg-slate-50/50 border border-transparent" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const schedule = getScheduleForDay(day);
                const isToday = isCurrentMonth && today.getDate() === day;
                const cfg = schedule ? shiftConfig[schedule.shift_type] : null;

                return (
                  <div key={day} className={`aspect-square sm:min-h-[80px] rounded-2xl p-1 sm:p-2 flex flex-col items-center justify-center border transition-all relative group cursor-default ${
                    isToday ? 'border-blue-500 shadow-md ring-4 ring-blue-50' : cfg ? cfg.light + ' border-2 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                  }`}>
                    <span className={`text-[10px] sm:text-xs font-black mb-1 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{day}</span>
                    {cfg ? (
                      <div className={`w-6 h-6 sm:w-10 sm:h-10 ${cfg.bg} rounded-lg flex items-center justify-center text-white font-black text-[10px] sm:text-sm shadow-sm`}>
                        {cfg.short}
                      </div>
                    ) : <div className="w-1 h-1 rounded-full bg-slate-200 mt-2" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Detail Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-6 flex flex-col max-h-[600px]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-list-ul text-blue-500"></i> Detail Shift
                </h3>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{schedules.length} Event</span>
              </div>
              
              <div className="overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {schedules.length > 0 ? (
                  schedules.sort((a, b) => a.shift_date.localeCompare(b.shift_date)).map(s => {
                    const cfg = shiftConfig[s.shift_type];
                    const { day, date } = getSafeDateDisplay(s.shift_date);
                    return (
                      <div key={s.id} className={`p-4 rounded-2xl border transition-all hover:translate-x-1 ${cfg?.light || 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white ${cfg?.bg || 'bg-slate-400'}`}>
                            <i className={`fa-solid ${cfg?.icon || 'fa-clock'}`}></i>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs text-slate-800 uppercase tracking-wide">{cfg?.label || s.shift_type}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{day}, {date}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 border border-slate-100">
                      <i className="fa-solid fa-calendar-xmark"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No shift scheduled</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Legend & Info</p>
               <div className="space-y-3">
                  {Object.values(shiftConfig).map(c => (
                    <div key={c.label} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center text-[10px] font-black shadow-sm`}>{c.short}</div>
                      <div>
                        <p className="text-[11px] font-black leading-none">{c.label}</p>
                        <p className="text-[9px] font-medium text-slate-400">{c.time}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}