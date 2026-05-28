import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

// Shift config — single source of truth
const SHIFT_CONFIG = {
  morning: {
    bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200',
    text: 'M', color: 'text-white', label: 'Morning', time: '08:00 - 15:00',
    badgeClass: 'bg-emerald-500 text-white',
  },
  middle: {
    bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200',
    text: 'MD', color: 'text-white', label: 'Middle', time: '10:00 - 17:00',
    badgeClass: 'bg-amber-500 text-white',
  },
  afternoon: {
    bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200',
    text: 'A', color: 'text-white', label: 'Afternoon', time: '15:00 - 22:00',
    badgeClass: 'bg-rose-500 text-white',
  },
  full: {
    bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200',
    text: 'C', color: 'text-white', label: 'Cuti', time: 'Hari Cuti',
    badgeClass: 'bg-purple-500 text-white',
  },
};

const OFF_BADGE = { bg: 'bg-slate-100', text: 'OFF', color: 'text-slate-400', label: 'Day Off' };

const CYCLE = { morning: 'middle', middle: 'afternoon', afternoon: 'full', full: null };

export default function ManageSchedulesCalendar() {
  const [schedules, setSchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [bulkSchedules, setBulkSchedules] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
      year,
      month,
    };
  };

  const padDate = (n) => String(n).padStart(2, '0');

  const getShiftBadge = (shiftType) => {
    const cfg = SHIFT_CONFIG[shiftType];
    if (!cfg) return OFF_BADGE;
    return { bg: cfg.bg, text: cfg.text, color: cfg.color, label: cfg.label };
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSchedules = async () => {
    try {
      const { year, month } = getDaysInMonth(currentMonth);
      const startDate = `${year}-${padDate(month + 1)}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDateStr = `${year}-${padDate(month + 1)}-${padDate(lastDay)}`;

      const response = await api.get('/schedules');
      const allSchedules = response.data.data || [];

      const monthSchedules = allSchedules.filter(s => {
        const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
        return d >= startDate && d <= endDateStr;
      });

      setSchedules(monthSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat jadwal');
    }
  };

  const fetchInterns = async () => {
    try {
      const response = await api.get('/profiles');
      const allProfiles = response.data.data || [];
      const internList = allProfiles.filter(u => u.role === 'intern');
      setInterns(internList);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat data intern');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        await Promise.all([fetchSchedules(), fetchInterns()]);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentMonth]);

  // ── Schedule lookup ───────────────────────────────────────────────────────
  const getScheduleForDate = (internId, day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${padDate(month + 1)}-${padDate(day)}`;
    return schedules.find(s => {
      const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return s.user_id === internId && d === dateStr;
    });
  };

  // ── Cell click (inline edit) ──────────────────────────────────────────────
  const handleCellClick = async (internId, day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${padDate(month + 1)}-${padDate(day)}`;
    const existing = getScheduleForDate(internId, day);

    if (existing) {
      const nextType = CYCLE[existing.shift_type];
      if (nextType === null) {
        try {
          await api.delete(`/schedules/${existing.id}`);
          toast.success('Jadwal dihapus (OFF)');
          await fetchSchedules();
        } catch {
          toast.error('Gagal menghapus jadwal');
        }
      } else {
        try {
          await api.put(`/schedules/${existing.id}`, { shift_type: nextType });
          toast.success(`Diubah ke ${SHIFT_CONFIG[nextType].label}`);
          await fetchSchedules();
        } catch {
          toast.error('Gagal update jadwal');
        }
      }
    } else {
      try {
        await api.post('/schedules', { user_id: internId, shift_date: dateStr, shift_type: 'morning' });
        toast.success('Jadwal dibuat (Morning)');
        await fetchSchedules();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal membuat jadwal');
      }
    }
  };

  // ── Bulk modal ────────────────────────────────────────────────────────────
  const openBulkModal = () => {
    setSelectedIntern('');
    setBulkSchedules({});
    setShowBulkModal(true);
  };

  const loadBulkForIntern = (internId) => {
    if (!internId) { setBulkSchedules({}); return; }
    const { daysInMonth } = getDaysInMonth(currentMonth);
    const init = {};
    for (let d = 1; d <= daysInMonth; d++) {
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
    const { daysInMonth } = getDaysInMonth(currentMonth);
    const next = {};
    for (let d = 1; d <= daysInMonth; d++) next[d] = type;
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
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const op of ops) {
        try {
          if (op.type === 'delete') {
            await api.delete(`/schedules/${op.id}`);
          } else if (op.type === 'update') {
            await api.put(`/schedules/${op.id}`, { shift_type: op.shift_type });
          } else if (op.type === 'create') {
            await api.post('/schedules', {
              user_id: op.user_id,
              shift_date: op.shift_date,
              shift_type: op.shift_type,
            });
          }
          successCount++;
        } catch (err) {
          const status = err.response?.status;
          const msg = err.response?.data?.message || '';
          if (status === 400 && msg.includes('sudah ada')) {
            successCount++; 
          } else {
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        toast.success(`${successCount} jadwal berhasil disimpan`, { id: tid });
      } else {
        toast.success(`${successCount} berhasil, ${errorCount} gagal`, { id: tid });
      }

      setShowBulkModal(false);
      await fetchSchedules();
    } catch (error) {
      toast.error('Gagal menyimpan jadwal', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const { daysInMonth } = getDaysInMonth(currentMonth);
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
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth))}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <i className="fa-solid fa-arrows-rotate mr-2"></i> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">

      {/* ================================================================= */}
      {/* HERO SECTION (DEEP BLUE NAVY)                                     */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-b from-[#162447] to-[#1a3a6c] rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-blue-400/20 shadow-2xl relative overflow-hidden text-white mb-6">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white shrink-0 shadow-lg">
                <i className="fa-solid fa-calendar-days text-xl"></i>
              </div>
              <span className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">
                Schedule Management
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-white">
              Calendar Center.
            </h1>
            <p className="text-blue-100/70 text-sm font-medium leading-relaxed max-w-lg">
              Kelola jadwal shift intern untuk 1 bulan penuh. Klik langsung pada tanggal di kalender untuk mengubah shift.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0 mt-6 md:mt-0 w-full sm:w-72">
            
            {/* Navigasi Bulan (Di Atas) */}
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl w-full shadow-sm">
              <button onClick={previousMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0">
                <i className="fa-solid fa-chevron-left text-sm"></i>
              </button>
              
              <h2 className="text-[12px] font-black text-white text-center uppercase tracking-widest flex-1 truncate px-1">
                {monthName}
              </h2>
              
              <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0">
                <i className="fa-solid fa-chevron-right text-sm"></i>
              </button>

              <div className="w-px h-6 bg-white/20 mx-1 shrink-0"></div>
              
              <button
                onClick={() => { fetchSchedules(); fetchInterns(); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"
                title="Refresh data"
              >
                <i className="fa-solid fa-arrows-rotate text-sm"></i>
              </button>
            </div>

            {/* Tombol Atur Jadwal (Di Bawah) */}
            <button
              onClick={openBulkModal}
              className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 border border-blue-500"
            >
              <i className="fa-solid fa-calendar-plus text-lg"></i>
              Atur Jadwal Bulanan
            </button>

          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* LEGEND WIDGET                                                       */}
      {/* ================================================================= */}
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
          <span className="text-blue-500 italic lowercase tracking-normal ml-auto hidden md:block">
            <i className="fa-solid fa-circle-info mr-1"></i> Klik kotak kalender: M → MD → A → C → OFF
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CALENDAR GRID                                                       */}
      {/* ================================================================= */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 min-w-[220px]">
                  Intern Profile
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
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
                  <td colSpan={daysInMonth + 2} className="text-center py-16">
                    <i className="fa-solid fa-users text-4xl mb-3 text-slate-200 block"></i>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada intern di divisi ini</p>
                  </td>
                </tr>
              ) : interns.map((intern) => {
                let totalDays = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                  if (getScheduleForDate(intern.id, day)) totalDays++;
                }
                return (
                  <tr key={intern.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">
                          {intern.full_name?.charAt(0) || 'I'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-800 text-sm truncate">{intern.full_name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate mt-0.5">{intern.division?.name || 'No Division'}</div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const schedule = getScheduleForDate(intern.id, day);
                      const badge = getShiftBadge(schedule?.shift_type);
                      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(intern.id, day)}
                          className={`px-1.5 py-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors ${isWeekend ? 'bg-rose-50/20' : ''}`}
                          title={`${intern.full_name} - ${day} ${monthName} | ${badge.label}`}
                        >
                          <div className={`w-8 h-8 ${badge.bg} rounded-lg flex items-center justify-center ${badge.color} font-black text-[10px] mx-auto shadow-sm`}>
                            {badge.text}
                          </div>
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

      {/* ================================================================= */}
      {/* BULK SCHEDULE MODAL                                                 */}
      {/* ================================================================= */}
      {showBulkModal && createPortal(
        <div className="fixed inset-0 bg-[#0b1437]/80 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">

            {/* Modal Header */}
            <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-calendar-plus text-blue-500"></i> Atur Jadwal Bulanan
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{monthName}</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto flex-1 p-8 space-y-6 custom-scrollbar">
              {/* Step 1: Select Intern */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  1. Pilih Intern <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedIntern}
                  onChange={(e) => {
                    setSelectedIntern(e.target.value);
                    loadBulkForIntern(e.target.value);
                  }}
                  className="w-full px-5 py-4 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none"
                >
                  <option value="">-- Pilih Intern --</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.full_name} — {intern.division?.name || 'No Division'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Set schedules */}
              {selectedIntern ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">2. Atur Jadwal Per Hari</p>

                  {/* Quick fill buttons */}
                  <div className="flex gap-2 flex-wrap mb-5">
                    {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setAllBulk(key)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${cfg.light} ${cfg.text.replace('text-white', '')} ${cfg.border} hover:opacity-80 flex items-center gap-1.5`}
                        style={{ color: key === 'morning' ? '#10b981' : key === 'afternoon' ? '#f43f5e' : key === 'middle' ? '#f59e0b' : '#a855f7' }}
                      >
                        <div className={`w-2 h-2 rounded-full ${cfg.bg}`}></div> Semua {cfg.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setAllBulk(null)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors text-[10px] font-black uppercase tracking-wider border border-slate-200 shadow-sm ml-auto"
                    >
                      <i className="fa-solid fa-eraser mr-1"></i> Kosongkan
                    </button>
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const currentShift = bulkSchedules[day] ?? null;
                      const badge = getShiftBadge(currentShift);
                      return (
                        <div
                          key={day}
                          onClick={() => cycleBulkDay(day)}
                          className={`p-3 border-2 rounded-2xl cursor-pointer hover:border-blue-400 transition-all select-none flex flex-col items-center justify-center ${
                            isWeekend ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>{day} {dayName}</div>
                          <div className={`w-full h-10 ${badge.bg} rounded-xl flex items-center justify-center ${badge.color} font-black text-sm shadow-sm`}>
                            {badge.text}
                          </div>
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

            {/* Modal Footer — sticky */}
            <div className="border-t border-slate-100 px-8 py-6 flex gap-3 shrink-0 bg-white rounded-b-[2.5rem] shadow-[0_-10px_15px_rgba(0,0,0,0.02)]">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-4 bg-slate-100 text-slate-500 font-black text-sm rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest"
              >
                Batal
              </button>
              <button
                onClick={saveBulkSchedules}
                disabled={!selectedIntern || saving}
                className="flex-1 px-4 py-4 bg-[#162447] hover:bg-[#1a3a6c] text-white font-black text-sm rounded-xl shadow-lg shadow-[#162447]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest"
              >
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