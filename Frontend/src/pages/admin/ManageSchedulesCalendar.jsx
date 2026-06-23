import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

// 🔥 FIX 1: Helper Tanggal Merah Nasional
const HOLIDAYS = ['2026-01-01', '2026-02-14', '2026-03-20', '2026-03-21', '2026-04-03', '2026-05-01', '2026-05-14', '2026-06-01', '2026-08-17', '2026-12-25'];

const isPaidDay = (year, month, day) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const d = new Date(year, month, day);
  return d.getDay() === 0 || HOLIDAYS.includes(dateStr); 
};

// 🔥 FIX 2: Warna Fix 4 Biji + Paid Day
const SHIFT_CONFIG = {
  morning: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'P', color: 'text-white', label: 'Pagi' },
  middle: { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'M', color: 'text-white', label: 'Middle' },
  afternoon: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'S', color: 'text-white', label: 'Sore' },
  off: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'OFF', color: 'text-white', label: 'Libur' },
  paid_day: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'PD', color: 'text-white', label: 'Paid Day' },
};

const CYCLE = { morning: 'middle', middle: 'afternoon', afternoon: 'off', off: null };
const getShiftBadge = (shiftType) => {
  const cfg = SHIFT_CONFIG[shiftType];
  if (!cfg) return { bg: 'bg-slate-100', text: 'OFF', color: 'text-slate-400', label: 'Day Off' };
  return { bg: cfg.bg, text: cfg.text, color: cfg.color, label: cfg.label };
};

export default function ManageSchedulesCalendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [bulkSchedules, setBulkSchedules] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Helpers ──
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const padDate = (n) => String(n).padStart(2, '0');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const handleCellClick = (internId, day) => {
    if (activeDropdown?.internId === internId && activeDropdown?.day === day) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown({ internId, day });
    }
  };

  const executeUpdateSchedule = async (internId, day, type) => {
    setActiveDropdown(null);
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = getScheduleForDate(internId, day);
    const tid = toast.loading('Menyimpan...');

    try {
      if (type === 'delete') {
        if (existing) await api.delete(`/schedules/${existing.id}`);
      } else if (existing) {
        await api.put(`/schedules/${existing.id}`, { shift_type: type });
      } else {
        await api.post('/schedules', { user_id: internId, shift_date: dateStr, shift_type: type });
      }
      toast.success('Jadwal tersimpan!', { id: tid });
      // 🔥 FIX 1: Pake cara TanStack buat refresh data
      queryClient.invalidateQueries({ queryKey: ['calendarSchedulesRaw'] });
    } catch (error) {
      toast.error('Gagal menyimpan jadwal', { id: tid });
    }
  };

  // ── TANSTACK QUERY: Fetch All Schedules ──
  const { data: allSchedules = [], isLoading: schedulesLoading, isError: schedulesError } = useQuery({
    queryKey: ['calendarSchedulesRaw'],
    queryFn: async () => {
      const response = await api.get('/schedules');
      return response.data?.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── TANSTACK QUERY: Fetch Interns ──
  const { data: interns = [], isLoading: internsLoading, isError: internsError } = useQuery({
    queryKey: ['calendarInternsList'],
    queryFn: async () => {
      const response = await api.get('/profiles');
      const allProfiles = response.data?.data || response.data || [];
      return allProfiles.filter(u => u.role === 'intern');
    },
    staleTime: 5 * 60 * 1000,
  });

  const loading = schedulesLoading || internsLoading;
  const loadError = schedulesError || internsError;

  // ── DERIVED STATE: Filter data bulan ini di RAM (0 Milidetik) ──
  const schedules = useMemo(() => {
    const { year, month, daysInMonth: currentDays } = getDaysInMonth(currentMonth);
    const startDate = `${year}-${padDate(month + 1)}-01`;
    const endDateStr = `${year}-${padDate(month + 1)}-${padDate(currentDays)}`;

    return allSchedules.filter(s => {
      const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return d >= startDate && d <= endDateStr;
    });
  }, [allSchedules, currentMonth]);

  const getScheduleForDate = (internId, day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${padDate(month + 1)}-${padDate(day)}`;
    return schedules.find(s => {
      const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return s.user_id === internId && d === dateStr;
    });
  };

  // ── Bulk Planner Operations ──
  const openBulkModal = () => {
    setSelectedIntern('');
    setBulkSchedules({});
    setShowBulkModal(true);
  };

  const loadBulkForIntern = (internId) => {
    if (!internId) { setBulkSchedules({}); return; }
    const { daysInMonth: currentDays } = getDaysInMonth(currentMonth);
    const init = {};
    for (let d = 1; d <= currentDays; d++) {
      const s = getScheduleForDate(internId, d);
      init[d] = s?.shift_type || null;
    }
    setBulkSchedules(init);
  };

  const cycleBulkDay = (day) => {
    const cur = bulkSchedules[day] ?? null;
    const next = cur === null ? 'morning' : CYCLE[cur];
    setBulkSchedules(prev => ({ ...prev, [day]: next }));
  };

  const setAllBulk = (type) => {
    const { daysInMonth: currentDays } = getDaysInMonth(currentMonth);
    const next = {};
    for (let d = 1; d <= currentDays; d++) next[d] = type;
    setBulkSchedules(next);
  };

  const saveBulkSchedules = async () => {
    if (!selectedIntern) { toast.error('Pilih intern terlebih dahulu'); return; }
    setSaving(true);
    const tid = toast.loading('Menyimpan jadwal...');
    try {
      const { year, month } = getDaysInMonth(currentMonth);
      const ops = [];
      
      for (const [day, shiftType] of Object.entries(bulkSchedules)) {
        const dateStr = `${year}-${padDate(month + 1)}-${padDate(parseInt(day))}`;
        const existing = getScheduleForDate(selectedIntern, parseInt(day));

        if (shiftType === null && existing) {
          ops.push({ type: 'delete', id: existing.id });
        } else if (shiftType && existing && existing.shift_type !== shiftType) {
          ops.push({ type: 'update', id: existing.id, shift_type: shiftType });
        } else if (shiftType && !existing) {
          ops.push({ type: 'create', user_id: selectedIntern, shift_date: dateStr, shift_type: shiftType });
        }
      }

      if (ops.length === 0) {
        toast.success('Tidak ada perubahan', { id: tid });
        setShowBulkModal(false);
        setSaving(false);
        return;
      }

      let successCount = 0;
      for (const op of ops) {
        try {
          if (op.type === 'delete') await api.delete(`/schedules/${op.id}`);
          else if (op.type === 'update') await api.put(`/schedules/${op.id}`, { shift_type: op.shift_type });
          else if (op.type === 'create') await api.post('/schedules', { user_id: op.user_id, shift_date: op.shift_date, shift_type: op.shift_type });
          successCount++;
        } catch (err) {
          if (err.response?.status === 400 && err.response?.data?.message?.includes('sudah ada')) successCount++;
        }
      }

      toast.success(`${successCount} perubahan jadwal berhasil diterapkan`, { id: tid });
      setShowBulkModal(false);
      queryClient.invalidateQueries(['calendarSchedulesRaw']);
    } catch (error) {
      toast.error('Gagal menyimpan jadwal massal', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const { daysInMonth: currentDaysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Memuat Jadwal...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500"></i>
          <p className="text-slate-700 font-bold">Gagal memuat data jadwal</p>
          <button onClick={() => queryClient.invalidateQueries(['calendarSchedulesRaw'])} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            <i className="fa-solid fa-arrows-rotate mr-2"></i> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-b from-[#162447] to-[#1a3a6c] rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-blue-400/20 shadow-2xl relative overflow-hidden text-white mb-6">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white shrink-0 shadow-lg">
                <i className="fa-solid fa-calendar-days text-xl"></i>
              </div>
              <span className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">Schedule Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-white">Calendar Center.</h1>
            <p className="text-blue-100/70 text-sm font-medium leading-relaxed max-w-lg">Kelola jadwal shift intern untuk 1 bulan penuh. Klik langsung pada tanggal di kalender untuk mengubah shift.</p>
          </div>

          <div className="flex flex-col gap-3 shrink-0 mt-6 md:mt-0 w-full sm:w-72">
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl w-full shadow-sm">
              <button onClick={previousMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"><i className="fa-solid fa-chevron-left text-sm"></i></button>
              <h2 className="text-[12px] font-black text-white text-center uppercase tracking-widest flex-1 truncate px-1">{monthName}</h2>
              <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"><i className="fa-solid fa-chevron-right text-sm"></i></button>
              <div className="w-px h-6 bg-white/20 mx-1 shrink-0"></div>
              <button onClick={() => queryClient.invalidateQueries(['calendarSchedulesRaw'])} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"><i className="fa-solid fa-arrows-rotate text-sm"></i></button>
            </div>
            <button onClick={openBulkModal} className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 border border-blue-500"><i className="fa-solid fa-calendar-plus text-lg"></i> Atur Jadwal Bulanan</button>
          </div>
        </div>
      </div>

      {/* LEGEND WIDGET */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center text-[11px] sm:text-xs font-black uppercase tracking-widest">
          {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 ${cfg.bg} rounded-md flex items-center justify-center text-white`}>{cfg.text}</div>
              <span className="text-slate-600">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-slate-400">OFF</div>
            <span className="text-slate-600">Day Off</span>
          </div>
          <span className="text-blue-500 italic lowercase tracking-normal ml-auto hidden md:block"><i className="fa-solid fa-circle-info mr-1"></i> Klik kotak kalender: M → MD → A → C → OFF</span>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 min-w-[220px]">Intern Profile</th>
                {Array.from({ length: currentDaysInMonth }, (_, i) => i + 1).map(day => {
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={day} className={`px-2 py-3 text-center text-xs font-black uppercase border-r border-slate-200 min-w-[55px] ${isWeekend ? 'bg-rose-50 text-rose-500' : 'text-slate-500'}`}>
                      <div>{day}</div>
                      <div className="text-[9px] font-bold tracking-widest mt-0.5">{dayName}</div>
                    </th>
                  );
                })}
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 ? (
                <tr>
                  <td colSpan={currentDaysInMonth + 2} className="text-center py-16">
                    <i className="fa-solid fa-users text-4xl mb-3 text-slate-200 block"></i>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada intern di divisi ini</p>
                  </td>
                </tr>
              ) : interns.map((intern) => {
                let totalDays = 0;
                for (let day = 1; day <= currentDaysInMonth; day++) {
                  if (getScheduleForDate(intern.id, day)) totalDays++;
                }
                return (
                  <tr key={intern.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">{intern.full_name?.charAt(0) || 'I'}</div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-800 text-sm truncate">{intern.full_name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate mt-0.5">{intern.division?.name || 'No Division'}</div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: currentDaysInMonth }, (_, i) => i + 1).map(day => {
              
                      let schedule = getScheduleForDate(intern.id, day);
                      let defaultType = isPaidDay(currentMonth.getFullYear(), currentMonth.getMonth(), day) ? 'paid_day' : 'off';
                      let activeType = schedule ? schedule.shift_type : defaultType;
                      let badge = SHIFT_CONFIG[activeType] || SHIFT_CONFIG['off'];
                      let isDropdownOpen = activeDropdown?.internId === intern.id && activeDropdown?.day === day;

                      return (
                        <td key={day} className="px-1.5 py-2 text-center border-r border-slate-100 relative">
                          {/* Kotak Utama */}
                          <div 
                            onClick={() => handleCellClick(intern.id, day)}
                            className={`w-8 h-8 ${badge.bg} rounded-lg flex items-center justify-center ${badge.color} font-black text-[10px] mx-auto cursor-pointer hover:scale-110 shadow-sm transition-all`}
                          >
                            {badge.text}
                          </div>

                          {/* 🔥 Dropdown Popover */}
                          {isDropdownOpen && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-2xl rounded-xl p-1.5 flex flex-col gap-1 w-[120px] animate-in zoom-in-95">
                              {Object.entries(SHIFT_CONFIG).map(([type, cfg]) => (
                                <button 
                                  key={type} onClick={() => executeUpdateSchedule(intern.id, day, type)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 text-slate-700 text-left`}
                                >
                                  <div className={`w-3 h-3 rounded-full ${cfg.bg}`}></div> {cfg.label}
                                </button>
                              ))}
                              <div className="h-px bg-slate-100 my-0.5"></div>
                              <button 
                                onClick={() => executeUpdateSchedule(intern.id, day, 'delete')}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-50 text-rose-600 text-left"
                              >
                                <i className="fa-solid fa-eraser w-3 text-center"></i> Auto Set
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-black text-slate-800 bg-slate-50/50">{totalDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK SCHEDULE MODAL */}
      {showBulkModal && createPortal(
        <div className="fixed inset-0 bg-[#0b1437]/80 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-calendar-plus text-blue-500"></i> Atur Jadwal Bulanan</h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{monthName}</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-sm"></i></button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-6 custom-scrollbar">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">1. Pilih Intern <span className="text-rose-500">*</span></label>
                <select value={selectedIntern} onChange={(e) => { setSelectedIntern(e.target.value); loadBulkForIntern(e.target.value); }} className="w-full px-5 py-4 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none">
                  <option value="">-- Pilih Intern --</option>
                  {interns.map((intern) => <option key={intern.id} value={intern.id}>{intern.full_name} — {intern.division?.name || 'No Division'}</option>)}
                </select>
              </div>

              {selectedIntern ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">2. Atur Jadwal Per Hari</p>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setAllBulk(key)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${cfg.light} ${cfg.text.replace('text-white', '')} ${cfg.border} hover:opacity-80 flex items-center gap-1.5`} style={{ color: key === 'morning' ? '#10b981' : key === 'afternoon' ? '#f43f5e' : key === 'middle' ? '#f59e0b' : '#a855f7' }}>
                        <div className={`w-2 h-2 rounded-full ${cfg.bg}`}></div> Semua {cfg.label}
                      </button>
                    ))}
                    <button onClick={() => setAllBulk(null)} className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors text-[10px] font-black uppercase tracking-wider border border-slate-200 shadow-sm ml-auto"><i className="fa-solid fa-eraser mr-1"></i> Kosongkan</button>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: currentDaysInMonth }, (_, i) => i + 1).map(day => {
                      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const currentShift = bulkSchedules[day] ?? null;
                      const badge = getShiftBadge(currentShift);
                      return (
                        <div key={day} onClick={() => cycleBulkDay(day)} className={`p-3 border-2 rounded-2xl cursor-pointer hover:border-blue-400 transition-all select-none flex flex-col items-center justify-center ${isWeekend ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100'}`}>
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>{day} {dayName}</div>
                          <div className={`w-full h-10 ${badge.bg} rounded-xl flex items-center justify-center ${badge.color} font-black text-sm shadow-sm`}>{badge.text}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <i className="fa-solid fa-hand-pointer text-4xl mb-4 animate-bounce text-blue-300"></i>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pilih intern untuk mulai mengatur jadwal</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-8 py-6 flex gap-3 shrink-0 bg-white rounded-b-[2.5rem] shadow-[0_-10px_15px_rgba(0,0,0,0.02)]">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-500 font-black text-sm rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest">Batal</button>
              <button onClick={saveBulkSchedules} disabled={!selectedIntern || saving} className="flex-1 px-4 py-4 bg-[#162447] hover:bg-[#1a3a6c] text-white font-black text-sm rounded-xl shadow-lg shadow-[#162447]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest">
                {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</> : <><i className="fa-solid fa-floppy-disk"></i> Simpan Jadwal</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}