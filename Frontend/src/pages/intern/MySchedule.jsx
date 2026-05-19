import { useState, useEffect } from 'react';
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

  // Shift config
  const shiftConfig = {
    morning: {
      bg: 'bg-green-500',
      light: 'bg-green-50 border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-500 text-white',
      label: 'Pagi',
      time: '08:00 - 15:00 WIB',
      icon: '🌅',
      short: 'M',
    },
    middle: {
      bg: 'bg-yellow-500',
      light: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-500 text-white',
      label: 'Middle',
      time: '10:00 - 17:00 WIB',
      icon: '⏳',
      short: 'MD',
    },
    afternoon: {
      bg: 'bg-orange-500',
      light: 'bg-orange-50 border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-500 text-white',
      label: 'Sore',
      time: '15:00 - 22:00 WIB',
      icon: '🌇',
      short: 'A',
    },
    full: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-500 text-white',
      label: 'Cuti',
      time: 'Hari Cuti',
      icon: '🏖️',
      short: 'C',
    },
  };

  const { daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Calculate stats
  const stats = schedules.reduce(
    (acc, s) => {
      if (s.shift_type === 'morning') acc.morning++;
      else if (s.shift_type === 'middle') acc.middle++;
      else if (s.shift_type === 'afternoon') acc.afternoon++;
      else if (s.shift_type === 'full') acc.full++;
      acc.total++;
      return acc;
    },
    { morning: 0, middle: 0, afternoon: 0, full: 0, total: 0 }
  );

  // Find today's schedule
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todaySchedule = isCurrentMonth ? getScheduleForDay(today.getDate()) : null;

  // Navigate month
  const previousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">📅 Jadwal Shift Saya</h1>
          <p className="text-slate-500">Lihat jadwal shift kamu bulan ini</p>
        </div>

        {/* Today's Schedule Card */}
        {isCurrentMonth && (
          <div className={`rounded-2xl border-2 p-5 ${
            todaySchedule
              ? shiftConfig[todaySchedule.shift_type]?.light || 'bg-blue-50 border-blue-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Hari Ini — {today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {todaySchedule ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{shiftConfig[todaySchedule.shift_type]?.icon}</span>
                    <div>
                      <p className={`text-xl font-bold ${shiftConfig[todaySchedule.shift_type]?.text}`}>
                        {shiftConfig[todaySchedule.shift_type]?.label}
                      </p>
                      <p className="text-slate-600 text-sm">
                        {shiftConfig[todaySchedule.shift_type]?.time}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">😴</span>
                    <div>
                      <p className="text-xl font-bold text-slate-600">Day Off</p>
                      <p className="text-slate-500 text-sm">Tidak ada jadwal hari ini</p>
                    </div>
                  </div>
                )}
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ${
                todaySchedule ? shiftConfig[todaySchedule.shift_type]?.bg : 'bg-slate-300'
              }`}>
                {todaySchedule ? shiftConfig[todaySchedule.shift_type]?.short : 'OFF'}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-sm text-slate-500 mt-1">Total Hari Kerja</p>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-700">{stats.morning}</p>
            <p className="text-sm text-green-600 mt-1">🌅 Pagi</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-yellow-700">{stats.middle}</p>
            <p className="text-sm text-yellow-600 mt-1">⏳ Middle</p>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-orange-700">{stats.afternoon}</p>
            <p className="text-sm text-orange-600 mt-1">🌇 Sore</p>
          </div>
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-purple-700">{stats.full}</p>
            <p className="text-sm text-purple-600 mt-1">🏖️ Cuti</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-chevron-left text-slate-600"></i>
            </button>
            <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-chevron-right text-slate-600"></i>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day offset */}
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const schedule = getScheduleForDay(day);
              const date = new Date(year, month, day);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = isCurrentMonth && today.getDate() === day;
              const cfg = schedule ? shiftConfig[schedule.shift_type] : null;

              return (
                <div
                  key={day}
                  className={`rounded-xl p-1.5 min-h-[60px] flex flex-col items-center justify-center border transition-all ${
                    isToday
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : isWeekend
                      ? 'border-red-100 bg-red-50/50'
                      : 'border-slate-100'
                  } ${cfg ? cfg.light : ''}`}
                >
                  <span className={`text-xs font-bold mb-1 ${
                    isToday ? 'text-blue-600' : isWeekend ? 'text-red-500' : 'text-slate-600'
                  }`}>
                    {day}
                  </span>
                  {cfg ? (
                    <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                      {cfg.short}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-[10px]">
                      OFF
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule List */}
        {schedules.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Daftar Jadwal {monthName}</h3>
            <div className="space-y-2">
              {schedules
                .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
                .map(schedule => {
                  const cfg = shiftConfig[schedule.shift_type];
                  const dateObj = new Date(schedule.shift_date + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                  const dateLabel = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

                  return (
                    <div
                      key={schedule.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${cfg?.light || 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${cfg?.bg || 'bg-slate-400'} rounded-xl flex items-center justify-center text-white font-bold`}>
                          {cfg?.short || '?'}
                        </div>
                        <div>
                          <p className={`font-semibold ${cfg?.text || 'text-slate-700'}`}>
                            {cfg?.icon} {cfg?.label || schedule.shift_type}
                          </p>
                          <p className="text-xs text-slate-500">{dayName}, {dateLabel}</p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">{cfg?.time}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-600 font-semibold text-lg">Belum ada jadwal bulan ini</p>
            <p className="text-slate-400 text-sm mt-1">Hubungi admin divisi kamu untuk mengatur jadwal shift</p>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap gap-4 items-center justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <span className="text-slate-600">Pagi (08:00 - 15:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">MD</div>
              <span className="text-slate-600">Middle (10:00 - 17:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <span className="text-slate-600">Sore (15:00 - 22:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-slate-600">Cuti (Hari Cuti)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
