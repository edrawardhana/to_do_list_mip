import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const ManageSchedulesCalendar = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const canManageAll = isSuperAdmin || isDeveloper;
  const myDivisionId = user?.division_id || user?.division?.id;
  const myDivisionName = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (ADMIN DEEP NAVY)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;

  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" 
      : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" 
      : "bg-[#0b1437] border-white/5 shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/10",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-emerald-400" 
      : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" 
      : "bg-white/10 border-white/10 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" 
      : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" 
      : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-100/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" 
      : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" 
      : "bg-blue-900/30 border-blue-700/50",
    
    // Toolbar
    toolbarBorder: isDeveloperTheme ? "border-zinc-800/50" : isPurpleTheme ? "border-purple-700/30" : "border-blue-700/30",
    toolbarBg: isDeveloperTheme ? "bg-[#141417]" : isPurpleTheme ? "bg-[#281c47]" : "bg-[#1c2242]",
    btnNav: isDeveloperTheme ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700" : "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    btnPrimary: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 text-white" : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 shadow-purple-900/20 text-white" : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 text-white",

    // Panels & Table
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200",
    tableHeader: isDeveloperTheme ? "bg-[#141417] text-zinc-400 border-zinc-800" : "bg-slate-50 text-slate-500 border-slate-200",
    stickyColBg: isDeveloperTheme ? "bg-[#09090b]" : "bg-white",
    stickyHeaderBg: isDeveloperTheme ? "bg-[#141417]" : "bg-slate-50",
    cellBorder: isDeveloperTheme ? "border-zinc-800/60" : "border-slate-200",
    cellHover: isDeveloperTheme ? "hover:bg-zinc-800/40" : "hover:bg-blue-50/50",
    weekendBg: isDeveloperTheme ? "bg-rose-950/20 text-rose-500" : "bg-rose-50 text-rose-600",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    
    // Modal
    modalBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800" : "bg-white border-slate-200",
    inputField: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500",
  };

  const SHIFT_CONFIG = {
    morning: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'M', label: 'Morning', time: '08:00 - 15:00' },
    afternoon: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'A', label: 'Afternoon', time: '15:00 - 22:00' },
    full: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'C', label: 'Cuti', time: 'Hari Cuti' },
  };
  
  const OFF_BADGE = { 
    bg: isDeveloperTheme ? 'bg-zinc-800' : 'bg-slate-100', 
    border: isDeveloperTheme ? 'border-zinc-700' : 'border-slate-200',
    text: 'OFF', 
    color: isDeveloperTheme ? 'text-zinc-500' : 'text-slate-400', 
    label: 'Day Off' 
  };

  const CYCLE = { morning: 'afternoon', afternoon: 'full', full: null };

  const [schedules, setSchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [bulkSchedules, setBulkSchedules] = useState({});
  const [saving, setSaving] = useState(false);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      year,
      month,
    };
  };

  const padDate = (n) => String(n).padStart(2, '0');

  const getShiftBadge = (shiftType) => {
    const cfg = SHIFT_CONFIG[shiftType];
    if (!cfg) return OFF_BADGE;
    return { bg: cfg.bg, text: cfg.text, color: 'text-white', border: cfg.border, label: cfg.label };
  };

  const fetchSchedules = useCallback(async () => {
    try {
      const { year, month } = getDaysInMonth(currentMonth);
      const startDate = `${year}-${padDate(month + 1)}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDateStr = `${year}-${padDate(month + 1)}-${padDate(lastDay)}`;

      const response = await api.get('/schedules');
      const allSchedules = response.data.data || [];

      let monthSchedules = allSchedules.filter(s => {
        const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
        return d >= startDate && d <= endDateStr;
      });

      if (!canManageAll) {
        monthSchedules = monthSchedules.filter(s => s.user?.division_id === myDivisionId);
      }

      setSchedules(monthSchedules);
    } catch (error) {
      toast.error('Gagal memuat jadwal');
    }
  }, [currentMonth, canManageAll, myDivisionId]);

  const fetchInterns = useCallback(async () => {
    try {
      const response = await api.get('/profiles');
      let internList = (response.data?.data || response.data || []).filter(u => u.role === 'intern');
      if (!canManageAll) {
        internList = internList.filter(u => u.division_id === myDivisionId);
      }
      setInterns(internList);
    } catch (error) {
      toast.error('Gagal memuat data intern');
    }
  }, [canManageAll, myDivisionId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchInterns()]);
      setLoading(false);
    };
    loadData();
  }, [currentMonth, fetchSchedules, fetchInterns]);

  const getScheduleForDate = (internId, day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${padDate(month + 1)}-${padDate(day)}`;
    return schedules.find(s => s.user_id === internId && (s.shift_date || '').startsWith(dateStr));
  };

  const handleCellClick = async (internId, day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${padDate(month + 1)}-${padDate(day)}`;
    const existing = getScheduleForDate(internId, day);

    if (existing) {
      const nextType = CYCLE[existing.shift_type];
      if (nextType === null) {
        try {
          await api.delete(`/schedules/${existing.id}`);
          toast.success('Shift Dihapus (OFF)');
          await fetchSchedules();
        } catch { toast.error('Gagal menghapus shift'); }
      } else {
        try {
          await api.put(`/schedules/${existing.id}`, { shift_type: nextType });
          toast.success(`Diubah ke ${SHIFT_CONFIG[nextType].label}`);
          await fetchSchedules();
        } catch { toast.error('Gagal mengubah shift'); }
      }
    } else {
      try {
        await api.post('/schedules', { user_id: internId, shift_date: dateStr, shift_type: 'morning' });
        toast.success('Shift Dibuat (Morning)');
        await fetchSchedules();
      } catch (error) { toast.error('Gagal membuat shift'); }
    }
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
    if (!selectedIntern) { toast.error('Pilih intern terlebih dahulu!'); return; }
    setSaving(true);
    const tid = toast.loading('Memproses jadwal massal...');
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

      for (const op of ops) {
        try {
          if (op.type === 'delete') await api.delete(`/schedules/${op.id}`);
          else if (op.type === 'update') await api.put(`/schedules/${op.id}`, { shift_type: op.shift_type });
          else if (op.type === 'create') await api.post('/schedules', { user_id: op.user_id, shift_date: op.shift_date, shift_type: op.shift_type });
        } catch (e) { /* silent skip */ }
      }

      toast.success('Jadwal bulanan berhasil disimpan', { id: tid });
      setShowBulkModal(false);
      await fetchSchedules();
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const { daysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-[1400px] mx-auto">
      
      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8 pb-6 sm:pb-8">
          
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-calendar-week text-sm sm:text-lg md:text-xl" />
              </div>
              <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Mass Plotting Mode
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-2 sm:mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Calendar Matrix.
            </h1>
            <p className={`text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Kelola jadwal shift intern secara massal untuk satu bulan penuh. Klik sel tabel untuk mengubah shift.
            </p>

            <div className="mt-5 sm:mt-6 md:mt-8 flex flex-wrap items-center gap-2 sm:gap-4">
              {Object.entries(SHIFT_CONFIG).map(([k, cfg]) => (
                <div key={k} className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border backdrop-blur-sm ${isDeveloperTheme ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/10 border-white/20'}`}>
                   <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white ${cfg.bg}`}>{cfg.text}</span>
                   <span className={`text-[9px] sm:text-[10px] font-bold ${theme.title}`}>{cfg.label}</span>
                </div>
              ))}
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border backdrop-blur-sm ${isDeveloperTheme ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/10 border-white/20'}`}>
                 <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] flex items-center justify-center text-[8px] sm:text-[9px] font-black border ${OFF_BADGE.bg} ${OFF_BADGE.border} ${OFF_BADGE.color}`}>{OFF_BADGE.text}</span>
                 <span className={`text-[9px] sm:text-[10px] font-bold ${theme.title}`}>Day Off</span>
              </div>
            </div>
          </div>

          <div className={`w-full lg:w-80 shrink-0 h-fit lg:self-center rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md flex flex-col justify-center gap-3 sm:gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 sm:pb-3 mb-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Month Summary</span>
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 sm:py-1 rounded-md">{canManageAll ? "Global" : myDivisionName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-white/40 mb-0.5 sm:mb-1">Total Intern</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{interns.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-white/40 mb-0.5 sm:mb-1">Active Shifts</span>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{schedules.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR LANTAI HERO */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-sm ${theme.btnNav}`}>
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <h2 className={`text-xs sm:text-sm font-black uppercase tracking-widest min-w-[120px] sm:min-w-[150px] text-center ${theme.title}`}>
              {monthName}
            </h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-sm ${theme.btnNav}`}>
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <button onClick={() => { fetchSchedules(); fetchInterns(); }} className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-sm ${theme.btnNav}`} title="Refresh">
              <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => { setSelectedIntern(''); setBulkSchedules({}); setShowBulkModal(true); }} 
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-black transition-all active:scale-95 shadow-lg ${theme.btnPrimary}`}>
              <i className="fa-solid fa-calendar-plus" /> Atur Jadwal (Bulk)
            </button>
          </div>
        </div>
      </div>

      {/* ── MATRIX CALENDAR TABLE ───────────────────────────────────────── */}
      <div className={`rounded-[1.5rem] sm:rounded-[2rem] border shadow-xl relative overflow-hidden transition-all duration-500 ${theme.panelBg}`}>
        <div className="overflow-x-auto custom-scrollbar relative z-10 w-full max-h-[60vh] sm:max-h-[70vh]">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center">
              <i className={`fa-solid fa-circle-notch fa-spin text-4xl mb-4 ${theme.textSecondary}`} />
              <p className={`font-bold ${theme.textPrimary}`}>Memuat matriks jadwal...</p>
            </div>
          ) : interns.length === 0 ? (
            <div className="p-20 text-center opacity-40">
              <i className={`fa-solid fa-users-slash text-5xl mb-4 block ${theme.textSecondary}`} />
              <h3 className={`font-black text-lg ${theme.textPrimary}`}>Tidak Ada Intern</h3>
              <p className={`text-sm font-medium mt-1 ${theme.textSecondary}`}>Belum ada anak magang aktif di divisi ini.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-black ${theme.tableHeader}`}>
                  <th className={`sticky left-0 z-30 px-4 sm:px-6 py-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r ${theme.stickyHeaderBg} ${theme.cellBorder}`}>
                    Intern / Nama
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={day} className={`px-2 py-3 text-center border-r min-w-[45px] sm:min-w-[55px] ${theme.cellBorder} ${isWeekend ? theme.weekendBg : theme.textPrimary}`}>
                        <div className="text-xs sm:text-sm font-black">{day}</div>
                        <div className="text-[8px] sm:text-[9px] font-bold opacity-70 tracking-widest">{dayName}</div>
                      </th>
                    );
                  })}
                  <th className={`px-4 py-4 text-center border-l ${theme.cellBorder}`}>Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.cellBorder}`}>
                {interns.map((intern) => {
                  let totalDays = 0;
                  for (let day = 1; day <= daysInMonth; day++) {
                    if (getScheduleForDate(intern.id, day)) totalDays++;
                  }
                  return (
                    <tr key={intern.id} className={`group transition-colors ${theme.cellHover}`}>
                      <td className={`sticky left-0 z-20 px-4 sm:px-6 py-3 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-colors ${theme.stickyColBg} ${theme.cellBorder} group-hover:${theme.cellHover.split(':')[1]}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border shadow-inner ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {intern.full_name?.charAt(0) || 'I'}
                          </div>
                          <div className="min-w-[120px]">
                            <p className={`font-bold text-[11px] sm:text-xs truncate ${theme.textPrimary}`}>{intern.full_name}</p>
                            <p className={`text-[9px] font-medium truncate ${theme.textSecondary}`}>{intern.division?.name || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const schedule = getScheduleForDate(intern.id, day);
                        const badge = getShiftBadge(schedule?.shift_type);
                        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        
                        return (
                          <td key={day} onClick={() => handleCellClick(intern.id, day)}
                            className={`px-1.5 sm:px-2 py-2 text-center border-r cursor-pointer transition-all ${theme.cellBorder} ${isWeekend && !schedule ? (isDeveloperTheme ? 'bg-rose-950/10' : 'bg-rose-50/50') : ''} hover:brightness-90`}
                            title={`${intern.full_name} - ${day} ${monthName} | ${badge.label} (Klik ubah)`}
                          >
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-black mx-auto border shadow-sm ${badge.bg} ${badge.color} ${badge.border || 'border-transparent'}`}>
                              {badge.text}
                            </div>
                          </td>
                        );
                      })}
                      
                      <td className={`px-4 py-3 text-center border-l ${theme.cellBorder}`}>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black ${theme.badgeBg}`}>{totalDays}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL BULK PLOTTING ─────────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className={`w-full sm:max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh] ${theme.modalBg}`}>
            
            <div className={`px-5 sm:px-8 py-4 sm:py-5 border-b shrink-0 flex justify-between items-center ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div>
                <h2 className={`text-base sm:text-xl font-black flex items-center gap-2 ${theme.textPrimary}`}>
                  <i className="fa-solid fa-calendar-plus" /> Atur Jadwal Bulanan
                </h2>
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 ${theme.textSecondary}`}>{monthName}</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme.textSecondary} hover:bg-rose-500 hover:text-white`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 custom-scrollbar px-5 sm:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDeveloperTheme ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 sm:mb-3 ${theme.textSecondary}`}>
                  1. Pilih Intern <span className="text-rose-500">*</span>
                </label>
                <select value={selectedIntern} onChange={(e) => { setSelectedIntern(e.target.value); loadBulkForIntern(e.target.value); }}
                  className={`w-full p-3 sm:p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors cursor-pointer ${theme.inputField}`}>
                  <option value="">-- Pilih Intern yang akan diatur --</option>
                  {interns.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.division?.name || 'General'})</option>)}
                </select>
              </div>

              {selectedIntern ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>2. Klik Kotak Tanggal / Isi Cepat</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SHIFT_CONFIG).map(([k, cfg]) => (
                        <button key={k} onClick={() => setAllBulk(k)} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md text-white shadow-sm border hover:opacity-80 transition-opacity ${cfg.bg} ${cfg.border}`}>
                          Full {cfg.text}
                        </button>
                      ))}
                      <button onClick={() => setAllBulk(null)} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm border hover:opacity-80 transition-opacity ${OFF_BADGE.bg} ${OFF_BADGE.color} ${OFF_BADGE.border}`}>Clear</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const currentShift = bulkSchedules[day] ?? null;
                      const badge = getShiftBadge(currentShift);

                      return (
                        <div key={day} onClick={() => cycleBulkDay(day)} className={`p-2 border rounded-xl cursor-pointer transition-all select-none hover:brightness-110 flex flex-col items-center justify-center gap-1.5 ${isWeekend ? (isDeveloperTheme ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-200') : (isDeveloperTheme ? 'bg-[#141417] border-zinc-800' : 'bg-white border-slate-200')}`}>
                          <div className={`text-[9px] font-bold ${isWeekend ? 'text-rose-500' : theme.textSecondary}`}>{day} {dayName}</div>
                          <div className={`w-full h-8 sm:h-9 ${badge.bg} border ${badge.border || 'border-transparent'} rounded-lg flex items-center justify-center ${badge.color} font-black text-xs shadow-inner`}>
                            {badge.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <i className={`fa-solid fa-hand-pointer text-4xl mb-3 animate-bounce ${theme.textSecondary}`} />
                  <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Pilih intern untuk membuka matrix</p>
                </div>
              )}
            </div>

            <div className={`px-5 sm:px-8 py-4 sm:py-5 border-t shrink-0 flex gap-3 ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button type="button" onClick={() => setShowBulkModal(false)} className={`flex-1 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Batal</button>
              
              <button type="button" onClick={saveBulkSchedules} disabled={!selectedIntern || saving} className={`flex-1 py-3 sm:py-3.5 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme.btnPrimary}`}>
                <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
                <span>{saving ? "Menyimpan..." : "Simpan Bulan Ini"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageSchedulesCalendar;