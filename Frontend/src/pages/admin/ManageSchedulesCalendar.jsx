import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

// Shift config — single source of truth
const SHIFT_CONFIG = {
  morning: {
    bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-200',
    text: 'M', color: 'text-white', label: 'Morning', time: '08:00 - 15:00',
    badgeClass: 'bg-green-500 text-white',
  },
  afternoon: {
    bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200',
    text: 'A', color: 'text-white', label: 'Afternoon', time: '15:00 - 22:00',
    badgeClass: 'bg-orange-500 text-white',
  },
  full: {
    bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200',
    text: 'C', color: 'text-white', label: 'Cuti', time: 'Hari Cuti',
    badgeClass: 'bg-purple-500 text-white',
  },
};

const OFF_BADGE = { bg: 'bg-gray-100', text: 'OFF', color: 'text-gray-500', label: 'Day Off' };

const CYCLE = { morning: 'afternoon', afternoon: 'full', full: null };

export default function ManageSchedulesCalendar() {
  const [schedules, setSchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
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
      toast.error('Gagal memuat jadwal');
    }
  };

  const fetchInterns = async () => {
    try {
      const response = await api.get('/profiles');
      const allProfiles = response.data.data || [];
      const internList = allProfiles.filter(u => u.role === 'intern' || u.role === 'user');
      setInterns(internList);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast.error('Gagal memuat data intern');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchInterns()]);
      setLoading(false);
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
      const promises = [];

      for (const [day, shiftType] of Object.entries(bulkSchedules)) {
        const dateStr = `${year}-${padDate(month + 1)}-${padDate(parseInt(day))}`;
        const existing = getScheduleForDate(selectedIntern, parseInt(day));

        if (shiftType === null && existing) {
          promises.push(api.delete(`/schedules/${existing.id}`));
        } else if (shiftType && existing) {
          if (existing.shift_type !== shiftType)
            promises.push(api.put(`/schedules/${existing.id}`, { shift_type: shiftType }));
        } else if (shiftType && !existing) {
          promises.push(api.post('/schedules', { user_id: selectedIntern, shift_date: dateStr, shift_type: shiftType }));
        }
      }

      await Promise.all(promises);
      toast.success('Jadwal berhasil disimpan', { id: tid });
      setShowBulkModal(false);
      await fetchSchedules();
    } catch (error) {
      console.error('Error saving bulk schedules:', error);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">📅 Schedule Calendar</h1>
          <p className="text-slate-600">Kelola jadwal shift intern untuk 1 bulan penuh</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <button onClick={previousMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <i className="fa-solid fa-chevron-left text-slate-600"></i>
              </button>
              <h2 className="text-xl font-bold text-slate-800 min-w-[200px] text-center">{monthName}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <i className="fa-solid fa-chevron-right text-slate-600"></i>
              </button>
            </div>

            {/* Bulk Schedule Button — always clickable, intern selection is inside modal */}
            <button
              onClick={openBulkModal}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-calendar-plus"></i>
              Atur Jadwal Bulanan
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center text-sm">
            {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-8 h-8 ${cfg.bg} rounded flex items-center justify-center text-white font-bold`}>{cfg.text}</div>
                <span className="text-slate-700">{cfg.label} {cfg.time !== 'Hari Cuti' ? `(${cfg.time})` : ''}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500 font-bold text-xs">OFF</div>
              <span className="text-slate-700">Day Off</span>
            </div>
            <span className="text-slate-400 italic text-xs">💡 Klik cell: M → A → C → OFF</span>
          </div>
        </div>

        {/* Calendar Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200 min-w-[200px]">
                    Intern
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={day} className={`px-2 py-3 text-center text-xs font-bold uppercase border-r border-slate-200 min-w-[50px] ${isWeekend ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}>
                        <div>{day}</div>
                        <div className="text-[10px] font-normal">{dayName}</div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase min-w-[100px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {interns.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 2} className="text-center py-12 text-slate-400">
                      <i className="fa-solid fa-users text-3xl mb-2 block"></i>
                      Belum ada intern di divisi ini
                    </td>
                  </tr>
                ) : interns.map((intern) => {
                  let totalDays = 0;
                  for (let day = 1; day <= daysInMonth; day++) {
                    if (getScheduleForDate(intern.id, day)) totalDays++;
                  }
                  return (
                    <tr key={intern.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {intern.full_name?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{intern.full_name}</div>
                            <div className="text-xs text-slate-500">{intern.division?.name || 'No Division'}</div>
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
                            className={`px-2 py-3 text-center border-r border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors ${isWeekend ? 'bg-red-50/30' : ''}`}
                            title={`${intern.full_name} - ${day} ${monthName} | ${badge.label}\nKlik untuk ubah`}
                          >
                            <div className={`w-8 h-8 ${badge.bg} rounded flex items-center justify-center ${badge.color} font-bold text-xs mx-auto`}>
                              {badge.text}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{totalDays}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Bulk Schedule Modal ─────────────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">📅 Atur Jadwal Bulanan</h2>
                <p className="text-sm text-slate-500 mt-0.5">{monthName}</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Step 1: Select Intern */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  1. Pilih Intern <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedIntern}
                  onChange={(e) => {
                    setSelectedIntern(e.target.value);
                    loadBulkForIntern(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">-- Pilih Intern --</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.full_name} — {intern.division?.name || 'No Division'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Set schedules (only shown after intern selected) */}
              {selectedIntern ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">2. Atur Jadwal Per Hari</p>

                    {/* Quick fill buttons */}
                    <div className="flex gap-2 flex-wrap mb-4">
                      {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setAllBulk(key)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${cfg.light} ${cfg.text.replace('text-white', '')} border ${cfg.border} hover:opacity-80`}
                          style={{ color: key === 'morning' ? '#15803d' : key === 'afternoon' ? '#c2410c' : '#7e22ce' }}
                        >
                          Semua {cfg.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setAllBulk(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold border border-gray-200"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-2">
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
                            className={`p-2 border-2 rounded-xl cursor-pointer hover:border-blue-400 transition-all select-none ${
                              isWeekend ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-slate-500 mb-1 text-center">{day} {dayName}</div>
                            <div className={`w-full h-9 ${badge.bg} rounded-lg flex items-center justify-center ${badge.color} font-bold text-sm`}>
                              {badge.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <i className="fa-solid fa-arrow-up text-2xl mb-3 animate-bounce"></i>
                  <p className="text-sm font-semibold">Pilih intern di atas untuk mulai mengatur jadwal</p>
                </div>
              )}
            </div>

            {/* Modal Footer — sticky */}
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveBulkSchedules}
                disabled={!selectedIntern || saving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</> : <><i className="fa-solid fa-floppy-disk"></i> Simpan Jadwal</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
