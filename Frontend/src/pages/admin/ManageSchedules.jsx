import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const ManageSchedules = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  const canManageAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division?.name || user?.division_name || "IT Support";
  const myDivisionId = user?.division_id || user?.division?.id;

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
    inputBg: "bg-white/10 border border-white/20 focus:border-white/40 text-white placeholder:text-white/50",
    iconMuted: "text-white/60",
    btnAdd: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 text-white" : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 shadow-purple-900/20 text-white" : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 text-white",

    // Panels & Modal
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    cardBg: isDeveloperTheme ? "bg-[#141417] border-zinc-800 hover:border-zinc-600" : "bg-white border-slate-200 hover:border-blue-200",
    inputField: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500",
  };

  const [schedules, setSchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  const [selectedIntern, setSelectedIntern] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftType, setShiftType] = useState('morning');
  const [filterDate, setFilterDate] = useState('');
  const [searchIntern, setSearchIntern] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterDate ? { date: filterDate } : {};
      const response = await api.get('/schedules', { params });
      
      let data = response.data?.data || response.data || [];
      if (!canManageAll) {
        data = data.filter(s => s.user?.division_id === myDivisionId);
      }
      setSchedules(data);
    } catch (error) {
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  }, [filterDate, canManageAll, myDivisionId]);

  const fetchInterns = useCallback(async () => {
    try {
      const response = await api.get('/profiles');
      let internList = (response.data?.data || response.data || []).filter(u => u.role === 'intern');
      if (!canManageAll) {
        internList = internList.filter(u => u.division_id === myDivisionId);
      }
      setInterns(internList);
    } catch (error) {
      toast.error('Gagal memuat daftar intern');
    }
  }, [canManageAll, myDivisionId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => { fetchInterns(); }, [fetchInterns]);

  const filteredSchedules = useMemo(() => {
    if (!searchIntern) return schedules;
    const q = searchIntern.toLowerCase();
    return schedules.filter(s => s.user?.full_name?.toLowerCase().includes(q));
  }, [schedules, searchIntern]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedIntern || !shiftDate || !shiftType) {
      toast.error('Mohon lengkapi semua data');
      return;
    }

    try {
      const payload = {
        user_id: selectedIntern,
        shift_date: shiftDate,
        shift_type: shiftType
      };

      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, payload);
        toast.success('Jadwal berhasil diupdate');
      } else {
        await api.post('/schedules', payload);
        toast.success('Jadwal berhasil ditambahkan');
      }

      setShowModal(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan jadwal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jadwal ini?')) {
      try {
        await api.delete(`/schedules/${id}`);
        toast.success('Jadwal dihapus');
        fetchSchedules();
      } catch (error) {
        toast.error('Gagal menghapus jadwal');
      }
    }
  };

  const openEdit = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedIntern(schedule.user_id);
    setShiftDate(schedule.shift_date.split('T')[0]);
    setShiftType(schedule.shift_type);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setSelectedIntern('');
    setShiftDate('');
    setShiftType('morning');
  };

  const SHIFT_OPTS = [
    { value: 'morning', label: 'Morning Shift', time: '08:00 - 15:00', badge: isDeveloperTheme ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'afternoon', label: 'Afternoon Shift', time: '15:00 - 22:00', badge: isDeveloperTheme ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'off', label: 'Hari Libur / Off', time: 'Full Day', badge: isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">
      
      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <div className={`rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        <div className={`absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8 pb-6 sm:pb-8">
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-calendar-days text-sm sm:text-lg md:text-xl" />
              </div>
              <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Resource Management
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-2 sm:mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Schedule Manager.
            </h1>
            <p className={`text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Atur dan pantau jadwal shift operasional anak magang divisi Anda.
            </p>
          </div>

          <div className={`w-full lg:w-80 shrink-0 h-fit lg:self-center rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md flex flex-col justify-center gap-3 sm:gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 sm:pb-3 mb-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Schedule Status</span>
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 sm:py-1 rounded-md">{canManageAll ? "Global" : myDivision}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <span className={`text-[8px] sm:text-[9px] font-bold uppercase mb-0.5 sm:mb-1 ${isDeveloperTheme ? 'text-zinc-500' : 'text-white/40'}`}>Shift Ditemukan</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{schedules.length}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[8px] sm:text-[9px] font-bold uppercase mb-0.5 sm:mb-1 ${isDeveloperTheme ? 'text-zinc-500' : 'text-white/40'}`}>Filter Tanggal</span>
                <span className="text-[11px] sm:text-sm font-black text-white mt-1.5">{filterDate ? new Date(filterDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Semua Tanggal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR BAWAH: FILTER & SEARCH */}
        <div className={`relative z-10 border-t ${theme.toolbarBorder} px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 backdrop-blur-xl transition-colors duration-700 ${theme.toolbarBg}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <i className={`fa-solid fa-calendar absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full sm:w-auto pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-bold outline-none border transition-colors shadow-sm cursor-pointer ${theme.inputBg} ${isDeveloperTheme ? '[color-scheme:dark]' : ''}`} />
            </div>
            {filterDate && (
              <button onClick={() => setFilterDate('')} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-colors ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-white/10 text-white/70 hover:text-white'}`}>Clear Filter</button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-56 md:w-64">
              <i className={`fa-solid fa-magnifying-glass absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.iconMuted}`} />
              <input type="text" placeholder="Cari nama intern..." value={searchIntern} onChange={e => setSearchIntern(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium outline-none border transition-colors shadow-sm ${theme.inputBg}`} />
            </div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-black text-white transition-all active:scale-95 shadow-lg ${theme.btnAdd}`}>
              <i className="fa-solid fa-plus-circle" /> Set Jadwal
            </button>
          </div>
        </div>
      </div>

      {/* ── JADWAL LIST ─────────────────────────────────────────────────── */}
      <div className="pt-2 sm:pt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {[0,1,2,3].map(i => <div key={i} className={`h-28 sm:h-32 rounded-2xl sm:rounded-[2rem] border animate-pulse ${theme.cardBg}`} />)}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className={`border rounded-[2rem] p-16 sm:p-20 text-center mt-2 ${theme.panelBg}`}>
            <i className={`fa-regular fa-calendar-xmark text-4xl sm:text-5xl mb-3 sm:mb-4 block opacity-30 ${theme.textSecondary}`} />
            <h3 className={`font-black text-base sm:text-lg ${theme.textPrimary}`}>Tidak ada jadwal</h3>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textSecondary}`}>Silakan tambahkan jadwal baru atau ubah filter tanggal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredSchedules.map((schedule) => {
              const shift = SHIFT_OPTS.find(s => s.value === schedule.shift_type) || SHIFT_OPTS[0];
              return (
                <div key={schedule.id} className={`rounded-2xl sm:rounded-[2rem] border p-4 sm:p-5 flex flex-col group hover:shadow-lg transition-all duration-300 relative overflow-hidden ${theme.cardBg}`}>
                  <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 border shadow-inner ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {schedule.user?.full_name?.charAt(0) || 'I'}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-xs sm:text-sm truncate ${theme.textPrimary}`}>{schedule.user?.full_name}</p>
                        <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>{new Date(schedule.shift_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto relative z-10">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${shift.badge}`}>
                      {shift.label}
                    </span>
                  </div>

                  {/* Hover Actions */}
                  <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
                    <button onClick={() => openEdit(schedule)} className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button onClick={() => handleDelete(schedule.id)} className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL FORM ───────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className={`w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh] ${theme.panelBg}`}>
            
            <div className={`border-b pb-4 sm:pb-5 shrink-0 flex justify-between items-center ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-lg sm:text-xl font-black ${theme.textPrimary}`}>
                {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme.textSecondary} hover:bg-rose-500 hover:text-white`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 sm:space-y-5 mt-4 sm:mt-5 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Intern</label>
                <select required value={selectedIntern} onChange={(e) => setSelectedIntern(e.target.value)}
                  className={`w-full p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold cursor-pointer transition-colors ${theme.inputField}`}>
                  <option value="">-- Pilih Intern --</option>
                  {interns.map(intern => <option key={intern.id} value={intern.id}>{intern.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1 ${theme.textSecondary}`}>Tanggal Shift</label>
                <input type="date" required value={shiftDate} onChange={(e) => setShiftDate(e.target.value)}
                  className={`w-full p-3.5 rounded-xl border outline-none text-xs sm:text-sm font-bold transition-colors ${theme.inputField} ${isDeveloperTheme ? '[color-scheme:dark]' : ''}`} />
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ml-1 ${theme.textSecondary}`}>Tipe Shift</label>
                <div className="space-y-2">
                  {SHIFT_OPTS.map(shift => (
                    <label key={shift.value} className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${shiftType === shift.value ? (isDeveloperTheme ? 'bg-zinc-800 border-emerald-500' : 'bg-blue-50 border-blue-500') : (isDeveloperTheme ? 'bg-[#09090b] border-zinc-800 hover:bg-zinc-800/50' : 'bg-white border-slate-200 hover:bg-slate-50')}`}>
                      <input type="radio" name="shift" value={shift.value} checked={shiftType === shift.value} onChange={(e) => setShiftType(e.target.value)} className={`w-4 h-4 bg-transparent border-slate-400 focus:ring-offset-transparent ${isDeveloperTheme ? 'text-emerald-500 focus:ring-emerald-500' : 'text-blue-600 focus:ring-blue-600'}`} />
                      <div className="flex-1">
                        <div className={`font-bold text-xs sm:text-sm ${theme.textPrimary}`}>{shift.label}</div>
                        <div className={`text-[9px] sm:text-[10px] font-medium ${theme.textSecondary}`}>{shift.time}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className={`flex gap-3 pt-4 sm:pt-5 mt-2 border-t border-dashed shrink-0 ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-200'}`}>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className={`flex-1 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isDeveloperTheme ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  Batal
                </button>
                <button type="submit" className={`flex-1 py-3 sm:py-3.5 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${theme.btnAdd}`}>
                  {editingSchedule ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchedules;