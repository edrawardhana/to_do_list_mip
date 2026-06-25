import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// 🔥 TANGGAL MERAH SINKRON NASIONAL
const HOLIDAYS = ['2026-01-01', '2026-02-14', '2026-03-20', '2026-03-21', '2026-04-03', '2026-05-01', '2026-05-14', '2026-06-01', '2026-08-17', '2026-12-25'];

export default function MySchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMobileHeroOpen, setIsMobileHeroOpen] = useState(false);
  const [mobileView, setMobileView] = useState('calendar');

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    return { daysInMonth, year, month };
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { year, month } = getDaysInMonth(currentMonth);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = new Date(year, month + 1, 0);
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const response = await api.get('/schedules');
      const allSchedules = response.data.data || [];

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

  const getScheduleForDay = (day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.find(s => {
      const scheduleDate = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return scheduleDate === dateStr;
    });
  };

  // 🔥 CONFIG WARNA SINKRON 100%
  const shiftConfig = {
    morning: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Pagi', time: '08:00 - 15:00 WIB', icon: 'fa-sun', short: 'PAGI' },
    middle: { bg: 'bg-yellow-500', light: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Middle', time: '10:00 - 17:00 WIB', icon: 'fa-hourglass-half', short: 'MID' },
    afternoon: { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Sore', time: '15:00 - 22:00 WIB', icon: 'fa-cloud-sun', short: 'SORE' },
    off: { bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Libur', time: 'Istirahat', icon: 'fa-bed', short: 'OFF' },
    paid_day: { bg: 'bg-blue-500', light: 'bg-blue-50 border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Paid Day', time: 'Tanggal Merah', icon: 'fa-calendar-star', short: 'HOLI' },
    pending_sakit: { bg: 'bg-rose-100 border border-rose-300 animate-pulse shadow-sm shadow-rose-500/20', light: 'bg-rose-100 border-rose-300 animate-pulse shadow-sm shadow-rose-500/20', text: 'text-rose-700 font-black', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Sakit (Pending)', time: 'Menunggu ACC', icon: 'fa-house-medical', short: 'SKT*' },
    pending_izin: { bg: 'bg-amber-100 border border-amber-300 animate-pulse shadow-sm shadow-amber-500/20', light: 'bg-amber-100 border-amber-300 animate-pulse shadow-sm shadow-amber-500/20', text: 'text-amber-700 font-black', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Izin (Pending)', time: 'Menunggu ACC', icon: 'fa-envelope-open-text', short: 'IZN*' }
  };

  const { daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // 🔥 STATS DIBIKIN 4 DOANG SINKRON DASHBOARD
  const stats = useMemo(() => {
    let counts = { morning: 0, middle: 0, afternoon: 0, off: 0, total: daysInMonth };
    for (let d = 1; d <= daysInMonth; d++) {
      const schedule = getScheduleForDay(d);
      if (schedule) {
        if (schedule.shift_type === 'morning') counts.morning++;
        else if (schedule.shift_type === 'middle') counts.middle++;
        else if (schedule.shift_type === 'afternoon') counts.afternoon++;
        else counts.off++; 
      } else {
        counts.off++;
      }
    }
    return counts;
  }, [schedules, daysInMonth, currentMonth]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todaySchedule = isCurrentMonth ? getScheduleForDay(today.getDate()) : null;

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
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 md:pt-8 px-3 md:px-6 max-w-7xl mx-auto">
      {/* HERO */}
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 border border-sky-400/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden relative transition-all duration-500">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-sky-300/20 rounded-full blur-2xl pointer-events-none hidden md:block"></div>

        {/* Header Khusus HP */}
        <div className="md:hidden flex items-center justify-between p-4 relative z-20 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
              <i className="fa-solid fa-calendar-days text-sm"></i>
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white">MY SCHEDULE</h1>
          </div>
          <button 
            type="button"
            onClick={() => setIsMobileHeroOpen(!isMobileHeroOpen)}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <i className={`fa-solid fa-chevron-down text-sm transition-transform duration-300 ${isMobileHeroOpen ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        {/* Konten Hero */}
        <div className={`relative z-10 transition-all duration-500 ease-in-out overflow-hidden md:max-h-[500px] ${
          isMobileHeroOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-[500px] md:opacity-100"
        }`}>
          <div className="p-4 pt-2 md:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
            <div className="flex-1">
              <div className="hidden md:flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/30 shrink-0">
                  <i className="fa-solid fa-calendar-days text-xl"></i>
                </div>
                <span className="text-sky-50 text-[11px] font-black uppercase tracking-widest">Time Management</span>
              </div>
              <h1 className="hidden md:block text-4xl lg:text-5xl font-black tracking-tight mb-3 text-white">My Schedule</h1>
              <p className="text-[11px] md:text-sm text-sky-50/90 font-medium max-w-xl leading-relaxed border-l-[2px] md:border-l-[3px] border-white/30 pl-2.5 md:pl-4">
                Pantau jadwal shift bulanan Anda. Jangan lupa persiapkan diri untuk shift selanjutnya.
              </p>
            </div>
            {isCurrentMonth && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 w-full lg:w-[320px] shrink-0 shadow-xl flex flex-row lg:flex-col items-center justify-between lg:items-stretch lg:justify-start gap-3 md:gap-4 mt-1 lg:mt-0">
                <div className="flex-1 lg:border-b lg:border-white/10 lg:pb-3">
                  <p className="text-[9px] md:text-[10px] font-bold text-sky-100 uppercase tracking-widest mb-0.5">Shift Hari Ini</p>
                  <p className="text-[10px] md:text-xs font-bold text-white">{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
                
                {todaySchedule ? (
                  <div className="flex items-center gap-2 md:gap-4 text-right lg:text-left">
                    <div className="hidden lg:flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center text-white text-xl border border-white/20 shadow-inner">
                      <i className={`fa-solid ${shiftConfig[todaySchedule.status?.startsWith('pending') ? todaySchedule.status : todaySchedule.shift_type]?.icon}`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-2xl font-black text-white leading-none mb-0.5 md:mb-1">{shiftConfig[todaySchedule.status?.startsWith('pending') ? todaySchedule.status : todaySchedule.shift_type]?.label}</h3>
                      <p className="text-[9px] md:text-xs text-sky-100 font-medium">{shiftConfig[todaySchedule.status?.startsWith('pending') ? todaySchedule.status : todaySchedule.shift_type]?.time}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 md:gap-4 text-right lg:text-left">
                    <div className="hidden lg:flex w-12 h-12 rounded-2xl bg-white/10 items-center justify-center text-white/70 text-xl border border-white/10"><i className="fa-solid fa-bed"></i></div>
                    <div>
                      <h3 className="text-lg md:text-2xl font-black text-white leading-none mb-0.5 md:mb-1">Libur</h3>
                      <p className="text-[9px] md:text-xs text-sky-100 font-medium">Tidak ada jadwal hari ini</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS WIDGETS */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="bg-emerald-50/50 rounded-[1rem] md:rounded-[1.5rem] border border-emerald-100 p-2.5 md:p-4 shadow-sm flex flex-col items-center justify-center">
          <p className="text-lg md:text-3xl font-black text-emerald-600 leading-none mb-1">{stats.morning}</p>
          <p className="text-[8px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center leading-tight">Pagi</p>
        </div>
        <div className="bg-yellow-50/50 rounded-[1rem] md:rounded-[1.5rem] border border-yellow-100 p-2.5 md:p-4 shadow-sm flex flex-col items-center justify-center">
          <p className="text-lg md:text-3xl font-black text-yellow-600 leading-none mb-1">{stats.middle}</p>
          <p className="text-[8px] md:text-[10px] font-bold text-yellow-500 uppercase tracking-widest text-center leading-tight">Middle</p>
        </div>
        <div className="bg-orange-50/50 rounded-[1rem] md:rounded-[1.5rem] border border-orange-100 p-2.5 md:p-4 shadow-sm flex flex-col items-center justify-center">
          <p className="text-lg md:text-3xl font-black text-orange-600 leading-none mb-1">{stats.afternoon}</p>
          <p className="text-[8px] md:text-[10px] font-bold text-orange-500 uppercase tracking-widest text-center leading-tight">Sore</p>
        </div>
        <div className="bg-rose-50/50 rounded-[1rem] md:rounded-[1.5rem] border border-rose-100 p-2.5 md:p-4 shadow-sm flex flex-col items-center justify-center">
          <p className="text-lg md:text-3xl font-black text-rose-600 leading-none mb-1">{stats.off}</p>
          <p className="text-[8px] md:text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center leading-tight">Libur</p>
        </div>
      </div>

      <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl w-full border border-slate-200/50 shadow-inner">
        <button onClick={() => setMobileView('calendar')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileView === 'calendar' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-400'}`}>Kalender</button>
        <button onClick={() => setMobileView('list')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileView === 'list' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-400'}`}>Detail List</button>
      </div>

      {/* KALENDER & LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        
        {/* KALENDER UTAMA */}
        <div className={`lg:col-span-7 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 p-4 md:p-8 flex-col ${mobileView === 'calendar' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b border-slate-100">
            <button onClick={previousMonth} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><i className="fa-solid fa-chevron-left text-xs md:text-sm"></i></button>
            <h2 className="text-sm md:text-xl font-black text-slate-800 uppercase tracking-widest">{monthName}</h2>
            <button onClick={nextMonth} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><i className="fa-solid fa-chevron-right text-xs md:text-sm"></i></button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pb-1 md:pb-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1">
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => <div key={`empty-${i}`} className="bg-transparent" />)}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const schedule = getScheduleForDay(day);
              const dateObj = new Date(year, month, day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isWeekendOrHoli = dateObj.getDay() === 0 || HOLIDAYS.includes(dateStr);
              const isToday = isCurrentMonth && today.getDate() === day;

              let cfg = null;
              if (schedule) {
                if (schedule.status && schedule.status.startsWith('pending')) {
                  cfg = shiftConfig[schedule.status]; 
                } else {
                  cfg = shiftConfig[schedule.shift_type] || shiftConfig['off'];
                }
              } else {
                cfg = isWeekendOrHoli ? shiftConfig['paid_day'] : shiftConfig['off'];
              }

              // 🔥 FIX 5: Kotak kalender dibikin cebol di HP (min-h-[40px])
              return (
                <div key={day} className={`rounded-[0.6rem] md:rounded-2xl p-1 md:p-2 flex flex-col items-center justify-center border transition-all min-h-[40px] md:min-h-[70px] ${isToday ? 'border-blue-500 ring-2 ring-blue-100 bg-white shadow-md' : 'border-slate-100 bg-white'} ${cfg ? cfg.light : 'hover:bg-slate-50'}`}>
                  <span className={`text-[9px] md:text-xs font-black mb-0.5 md:mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>{day}</span>
                  {cfg ? (
                    <div className={`w-full max-w-[2rem] md:max-w-[2.5rem] h-3.5 md:h-6 ${cfg.bg} rounded md:rounded-lg flex items-center justify-center text-white font-black text-[6px] md:text-[10px] tracking-wider shadow-sm truncate`}>{cfg.short}</div>
                  ) : (
                    <div className="w-full max-w-[2rem] md:max-w-[2.5rem] h-3.5 md:h-6 bg-slate-50 border border-slate-200 rounded md:rounded-lg flex items-center justify-center text-slate-400 font-black text-[6px] md:text-[10px]">OFF</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DAFTAR JADWAL LIST */}
        <div className={`lg:col-span-5 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 flex-col h-[400px] lg:h-full lg:max-h-[600px] ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-[1.5rem] md:rounded-t-[2rem] shrink-0">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">Detail Shift</h3>
          </div>

          <div className="p-3 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            {schedules.length > 0 ? (
              <div className="space-y-2.5 md:space-y-3">
                {schedules.sort((a, b) => a.shift_date.localeCompare(b.shift_date)).map(schedule => {
                  const cfg = schedule.status?.startsWith('pending') ? shiftConfig[schedule.status] : shiftConfig[schedule.shift_type] || shiftConfig['off'];
                  const rawDate = schedule.shift_date ? schedule.shift_date.substring(0, 10) : "";
                  const dateObj = new Date(rawDate ? `${rawDate}T00:00:00` : new Date());
                  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                  const dateLabel = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <div key={schedule.id} className={`flex items-center justify-between p-3 md:p-4 rounded-[1rem] md:rounded-2xl border transition-all hover:shadow-md ${cfg?.light || 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
                        <div className={`w-8 h-8 md:w-12 md:h-12 ${cfg?.bg || 'bg-slate-400'} rounded-lg md:rounded-xl flex items-center justify-center text-white text-sm md:text-lg shadow-sm shrink-0`}><i className={`fa-solid ${cfg?.icon || 'fa-calendar-day'}`}></i></div>
                        <div className="min-w-0">
                          <p className={`font-black text-[11px] md:text-sm leading-none mb-0.5 md:mb-1 truncate ${cfg?.text || 'text-slate-700'}`}>{cfg?.label || schedule.shift_type}</p>
                          <p className="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{dayName}, {dateLabel}</p>
                        </div>
                      </div>
                      <span className="text-[8px] md:text-[10px] font-black text-slate-500 bg-white px-2 py-1 md:px-2.5 md:py-1.5 rounded-md border border-slate-200 shadow-sm shrink-0 ml-2">{cfg?.time.replace(' WIB', '')}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                <i className="fa-solid fa-calendar-xmark text-4xl md:text-5xl text-slate-300 mb-3"></i>
                <p className="text-slate-500 font-bold text-xs md:text-sm">Belum ada jadwal</p>
                <p className="text-slate-400 text-[10px] mt-1">Hubungi admin divisi untuk ploting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}