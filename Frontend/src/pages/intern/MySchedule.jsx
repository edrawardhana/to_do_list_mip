import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function MySchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    return { daysInMonth, year, month };
  };

  // Fetch schedules for current month
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { year, month } = getDaysInMonth(currentMonth);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = new Date(year, month + 1, 0);
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const response = await api.get('/schedules');
      const allSchedules = response.data.data || [];

      // Filter for current month only
      const monthSchedules = allSchedules.filter(schedule => {
        const scheduleDate = schedule.shift_date ? schedule.shift_date.substring(0, 10) : '';
        return scheduleDate >= startDate && scheduleDate <= endDateStr;
      });

      setSchedules(monthSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentMonth]);

  // Get schedule for a specific day
  const getScheduleForDay = (day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.find(s => {
      const scheduleDate = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return scheduleDate === dateStr;
    });
  };

  // Shift config disesuaikan dengan tema Tailwind modern
  const shiftConfig = {
    morning: {
      bg: 'bg-emerald-500',
      light: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: 'Pagi',
      time: '08:00 - 15:00 WIB',
      icon: 'fa-sun',
      short: 'PAGI',
    },
    middle: {
      bg: 'bg-yellow-500',
      light: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      label: 'Middle',
      time: '10:00 - 17:00 WIB',
      icon: 'fa-hourglass-half',
      short: 'MID',
    },
    afternoon: {
      bg: 'bg-amber-500',
      light: 'bg-amber-50 border-amber-200',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Sore',
      time: '15:00 - 22:00 WIB',
      icon: 'fa-cloud-sun',
      short: 'SORE',
    },
    full: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50 border-purple-200',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Cuti',
      time: 'Hari Cuti',
      icon: 'fa-umbrella-beach',
      short: 'CUTI',
    },
  };

  const { daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Calculate stats
  const stats = useMemo(() => schedules.reduce(
    (acc, s) => {
      if (s.shift_type === 'morning') acc.morning++;
      else if (s.shift_type === 'middle') acc.middle++;
      else if (s.shift_type === 'afternoon') acc.afternoon++;
      else if (s.shift_type === 'full') acc.full++;
      acc.total++;
      return acc;
    },
    { morning: 0, middle: 0, afternoon: 0, full: 0, total: 0 }
  ), [schedules]);

  // Find today's schedule
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todaySchedule = isCurrentMonth ? getScheduleForDay(today.getDate()) : null;

  // Navigate month
  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Memuat Jadwal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 md:pt-8 px-4 md:px-6 max-w-7xl mx-auto">
      
      {/* ── HERO SECTION ── */}
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 border border-sky-400/50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-sky-300/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
          
          {/* Teks Kiri */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/30 shrink-0">
                <i className="fa-solid fa-calendar-days text-lg md:text-xl"></i>
              </div>
              <span className="text-sky-50 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                Time Management
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-2 md:mb-3 text-white">
              My Schedule
            </h1>
            <p className="text-xs md:text-sm text-sky-50/90 font-medium max-w-xl leading-relaxed border-l-[3px] border-white/30 pl-3 md:pl-4">
              Pantau jadwal shift bulanan Anda. Jangan lupa persiapkan diri untuk shift selanjutnya.
            </p>
          </div>

          {/* Widget Kanan (Jadwal Hari Ini) */}
          {isCurrentMonth && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 md:p-6 w-full lg:w-[320px] shrink-0 shadow-xl">
              <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                <div>
                  <p className="text-[10px] font-bold text-sky-100 uppercase tracking-widest mb-0.5">
                    Shift Hari Ini
                  </p>
                  <p className="text-[11px] md:text-xs font-bold text-white">
                    {today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm ${todaySchedule ? shiftConfig[todaySchedule.shift_type]?.bg : 'bg-white/20'}`}>
                   {todaySchedule ? shiftConfig[todaySchedule.shift_type]?.short.charAt(0) : '—'}
                </div>
              </div>

              {todaySchedule ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl border border-white/20 shadow-inner">
                    <i className={`fa-solid ${shiftConfig[todaySchedule.shift_type]?.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white leading-none mb-1">
                      {shiftConfig[todaySchedule.shift_type]?.label}
                    </h3>
                    <p className="text-xs text-sky-100 font-medium">
                      {shiftConfig[todaySchedule.shift_type]?.time}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/70 text-xl border border-white/10">
                    <i className="fa-solid fa-bed"></i>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white leading-none mb-1">Libur</h3>
                    <p className="text-xs text-sky-100 font-medium">Tidak ada jadwal hari ini</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STATS WIDGETS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl md:rounded-[1.5rem] border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center hover:border-blue-300 transition-colors">
          <p className="text-2xl md:text-3xl font-black text-slate-800 leading-none mb-1">{stats.total}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hari</p>
        </div>
        <div className="bg-emerald-50/50 rounded-2xl md:rounded-[1.5rem] border border-emerald-100 p-4 shadow-sm flex flex-col items-center justify-center hover:border-emerald-300 transition-colors">
          <i className="fa-solid fa-sun text-emerald-500 mb-1.5 text-sm"></i>
          <p className="text-2xl md:text-3xl font-black text-emerald-600 leading-none mb-1">{stats.morning}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Pagi</p>
        </div>
        <div className="bg-yellow-50/50 rounded-2xl md:rounded-[1.5rem] border border-yellow-100 p-4 shadow-sm flex flex-col items-center justify-center hover:border-yellow-300 transition-colors">
          <i className="fa-solid fa-hourglass-half text-yellow-500 mb-1.5 text-sm"></i>
          <p className="text-2xl md:text-3xl font-black text-yellow-600 leading-none mb-1">{stats.middle}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Middle</p>
        </div>
        <div className="bg-amber-50/50 rounded-2xl md:rounded-[1.5rem] border border-amber-100 p-4 shadow-sm flex flex-col items-center justify-center hover:border-amber-300 transition-colors">
          <i className="fa-solid fa-cloud-sun text-amber-500 mb-1.5 text-sm"></i>
          <p className="text-2xl md:text-3xl font-black text-amber-600 leading-none mb-1">{stats.afternoon}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-amber-500 uppercase tracking-widest">Sore</p>
        </div>
        <div className="bg-purple-50/50 rounded-2xl md:rounded-[1.5rem] border border-purple-100 p-4 shadow-sm flex flex-col items-center justify-center hover:border-purple-300 transition-colors">
          <i className="fa-solid fa-umbrella-beach text-purple-500 mb-1.5 text-sm"></i>
          <p className="text-2xl md:text-3xl font-black text-purple-600 leading-none mb-1">{stats.full}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-purple-500 uppercase tracking-widest">Cuti</p>
        </div>
      </div>

      {/* ── KALENDER & LIST GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* KALENDER UTAMA */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-5 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <button
              onClick={previousMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">
              {monthName}
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pb-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1">
            {/* Blank cells */}
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
              <div key={`empty-${i}`} className="bg-transparent" />
            ))}

            {/* Days cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const schedule = getScheduleForDay(day);
              const date = new Date(year, month, day);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = isCurrentMonth && today.getDate() === day;
              const cfg = schedule ? shiftConfig[schedule.shift_type] : null;

              return (
                <div
                  key={day}
                  className={`rounded-xl md:rounded-2xl p-1.5 md:p-2 flex flex-col items-center justify-center border transition-all min-h-[50px] md:min-h-[70px] ${
                    isToday
                      ? 'border-blue-500 ring-2 ring-blue-100 bg-white shadow-md'
                      : isWeekend && !cfg
                      ? 'border-rose-100 bg-rose-50/30'
                      : 'border-slate-100 bg-white'
                  } ${cfg ? cfg.light : 'hover:bg-slate-50'}`}
                >
                  <span className={`text-[10px] md:text-xs font-black mb-1 md:mb-1.5 ${
                    isToday ? 'text-blue-600' : isWeekend && !cfg ? 'text-rose-500' : 'text-slate-600'
                  }`}>
                    {day}
                  </span>
                  {cfg ? (
                    <div className={`w-full max-w-[2.5rem] h-5 md:h-6 ${cfg.bg} rounded-md md:rounded-lg flex items-center justify-center text-white font-black text-[8px] md:text-[10px] tracking-wider shadow-sm`}>
                      {cfg.short}
                    </div>
                  ) : (
                    <div className="w-full max-w-[2.5rem] h-5 md:h-6 bg-slate-100 border border-slate-200 rounded-md md:rounded-lg flex items-center justify-center text-slate-400 font-bold text-[8px] md:text-[10px]">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DAFTAR JADWAL LIST */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col h-full lg:max-h-[600px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-[2rem]">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-base">
            Detail Shift
            </h3>
          </div>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            {schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules
                  .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
                  .map(schedule => {
                    const cfg = shiftConfig[schedule.shift_type];
                    const rawDate = schedule.shift_date ? schedule.shift_date.substring(0, 10) : "";
                    const dateObj = new Date(rawDate ? `${rawDate}T00:00:00` : new Date());

                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                    const dateLabel = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

                    return (
                      <div
                        key={schedule.id}
                        className={`flex items-center justify-between p-3.5 md:p-4 rounded-2xl border transition-all hover:shadow-md ${cfg?.light || 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-10 h-10 md:w-12 md:h-12 ${cfg?.bg || 'bg-slate-400'} rounded-xl flex items-center justify-center text-white text-lg shadow-sm shrink-0`}>
                            <i className={`fa-solid ${cfg?.icon || 'fa-calendar-day'}`}></i>
                          </div>
                          <div>
                            <p className={`font-black text-xs md:text-sm leading-none mb-1 ${cfg?.text || 'text-slate-700'}`}>
                              {cfg?.label || schedule.shift_type}
                            </p>
                            <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {dayName}, {dateLabel}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                          {cfg?.time.replace(' WIB', '')}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                <i className="fa-solid fa-calendar-xmark text-4xl md:text-5xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 font-bold text-sm">Belum ada jadwal</p>
                <p className="text-slate-400 text-xs mt-1">Hubungi admin divisi untuk ploting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}