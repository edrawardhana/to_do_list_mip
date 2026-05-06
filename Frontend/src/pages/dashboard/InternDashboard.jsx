import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";

const InternDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0 });
  const [shiftInfo, setShiftInfo] = useState({ pagi: [], siang: [], full: [], libur: [] });
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/intern');
        const data = response.data?.data || response.data || {};
        setProgress(data.progress || { percentage: 0, completed: 0, total: 0 });
        setShiftInfo(data.shiftInfo || { pagi: [], siang: [], full: [], libur: [] });
        setTodayTasks(data.todayTasks || []);
      } catch (error) {
        console.error("Gagal memuat data intern:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch real schedule data for calendar
  useEffect(() => {
    const fetchSchedules = async () => {
      setScheduleLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const response = await api.get('/schedules');
        const allSchedules = response.data.data || [];

        // Filter for current month only
        const monthSchedules = allSchedules.filter(s => {
          const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
          return d >= startDate && d <= endDate;
        });

        setSchedules(monthSchedules);
      } catch (error) {
        console.error("Gagal memuat jadwal:", error);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  // Logic Sapaan Waktu
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 19) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  // --- LOGIC KALENDER (Real Data) ---
  const date = new Date();
  const currentDay = date.getDate();
  const monthName = date.toLocaleDateString("id-ID", { month: "long" });
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Shift config for calendar coloring
  const shiftStyle = {
    morning:   { bg: 'bg-emerald-50/80', text: 'text-emerald-600', hover: 'hover:bg-emerald-100', dot: 'bg-emerald-500' },
    afternoon: { bg: 'bg-amber-50/80',   text: 'text-amber-600',   hover: 'hover:bg-amber-100',   dot: 'bg-amber-500' },
    full:      { bg: 'bg-purple-50/80',  text: 'text-purple-600',  hover: 'hover:bg-purple-100',  dot: 'bg-purple-500' },
  };

  // Get schedule for a specific day
  const getScheduleForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.find(s => {
      const d = s.shift_date ? s.shift_date.substring(0, 10) : '';
      return d === dateStr;
    });
  };

  // Today's shift
  const todaySchedule = getScheduleForDay(currentDay);
  const todayShiftLabel = todaySchedule
    ? { morning: 'Pagi', afternoon: 'Siang', full: 'Cuti' }[todaySchedule.shift_type] || todaySchedule.shift_type
    : 'Libur';
  const todayShiftTime = todaySchedule
    ? { morning: '08:00 - 15:00', afternoon: '15:00 - 22:00', full: 'Hari Cuti' }[todaySchedule.shift_type] || '-'
    : '-';

  // Build calendar days
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ day: null, schedule: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, schedule: getScheduleForDay(i) });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* HERO SECTION (Sapaan Dinamis) */}
      <div className="px-8 py-8 rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {greeting}, <span className="text-blue-600">{user?.nickname || user?.full_name?.split(" ")[0] || "Tim"}! 👋</span>
          </h1>
        </div>
        <p className="text-base text-slate-500 mt-3 max-w-2xl leading-relaxed font-medium">
          Pantau jadwal shift, status rekan, dan selesaikan progres tugas harianmu di sini. Tetap fokus dan produktif!
        </p>
      </div>
  
      {/* TOP WIDGET GRID (Divisi, Progress, Izin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* WIDGET 1: DIVISI */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50/70 p-7 rounded-[2rem] border border-blue-100/50 shadow-lg shadow-blue-500/5 flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200">
          <i className="fa-solid fa-layer-group absolute -bottom-8 -right-6 text-[8rem] text-blue-600/[0.03] group-hover:text-blue-600/[0.06] transition-all duration-500 -rotate-12 group-hover:-rotate-6 group-hover:scale-110 pointer-events-none"></i>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                <i className="fa-solid fa-layer-group text-xl"></i>
              </div>
              <span className="bg-emerald-50/80 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100/50 shadow-sm backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                ON DUTY
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Penempatan Divisi</p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {user?.division_name || "IT Support"}
            </h2>
          </div>

          <div className="mt-8 pt-6 border-t border-blue-900/5 relative z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jadwal Shift Hari Ini</p>
              {scheduleLoading ? (
                <p className="text-sm text-slate-400 font-bold"><i className="fa-solid fa-spinner fa-spin mr-1" /> Memuat...</p>
              ) : todaySchedule ? (
                <p className="text-[15px] font-bold text-slate-900 flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 bg-white rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                    todaySchedule.shift_type === 'morning' ? 'text-emerald-600 border-emerald-100' :
                    todaySchedule.shift_type === 'afternoon' ? 'text-amber-600 border-amber-100' :
                    'text-purple-600 border-purple-100'
                  }`}>{todayShiftLabel}</span>
                  {todayShiftTime}
                </p>
              ) : (
                <p className="text-[15px] font-bold text-slate-500 flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-white text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100 shadow-sm">Libur</span>
                  Tidak ada jadwal
                </p>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 2: PROGRESS BAR */}
        <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-7 rounded-[2rem] text-white shadow-xl shadow-sky-900/20 border border-white/5 flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-sky-500/20 hover:border-white/10">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl group-hover:bg-sky-400/30 transition-colors duration-700 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>
          <i className="fa-solid fa-bars-progress absolute -bottom-6 -right-6 text-[8rem] text-white/[0.02] group-hover:text-white/[0.04] transition-all duration-500 -rotate-12 group-hover:-rotate-6 group-hover:scale-110 pointer-events-none"></i>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/[0.05] text-sky-400 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 group-hover:bg-sky-500/10 transition-all duration-300">
                <i className="fa-solid fa-list-check text-xl"></i>
              </div>
              <span className="bg-white/[0.05] text-white/90 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-sm">
                HARI INI
              </span>
            </div>
            <p className="text-[10px] font-bold text-sky-200/50 uppercase tracking-widest mb-1">Penyelesaian Rutinitas</p>
            <div className="flex items-end gap-2">
              <h3 className="text-[3.5rem] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-100 drop-shadow-sm">
                {loading ? "..." : progress.percentage}<span className="text-2xl text-slate-400 ml-0.5">%</span>
              </h3>
              <p className="text-xs font-bold text-sky-400 mb-2"> ({progress.completed}/{progress.total} Tugas)</p>
            </div>
          </div>

          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
              <span>PROGRESS BAR</span>
              <span className="text-sky-300">ON GOING</span>
            </div>
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-sky-500 to-sky-300 rounded-full relative shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-1000" style={{ width: `${progress.percentage}%` }}>
                <div className="absolute top-0 right-0 w-6 h-full bg-white/50 rounded-full blur-[2px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3: PERIZINAN */}
        <div className="bg-gradient-to-b from-white to-slate-50 p-7 rounded-[2rem] border border-slate-200 shadow-sm text-center flex flex-col justify-center items-center group hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300">
          <div className="w-16 h-16 bg-blue-50/50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-blue-100/50 group-hover:-translate-y-1 group-hover:bg-blue-100 group-hover:shadow-sm transition-all duration-300">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <h4 className="text-lg font-extrabold text-slate-900 mb-2 tracking-tight">Butuh Izin Besok?</h4>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-8 px-2">
            Pengajuan izin sakit, keluarga, atau tukar shift maksimal H-1.
          </p>
          <Link to="/leave-request" className="w-full py-3.5 bg-[#0b1437] text-white rounded-xl text-sm font-bold hover:bg-sky-500 transition-colors shadow-md hover:shadow-lg">
            Ajukan Perizinan
          </Link>
        </div>

      </div>

      {/* SECTION: STATUS REKAN SHIFT */}
      <div className="bg-white p-7 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-12 h-12 bg-slate-50/80 text-slate-500 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
            <i className="fa-solid fa-users-viewfinder text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Rekan Shift Divisi</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">Pantau rekan yang masuk dan libur hari ini.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Pagi */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:border-emerald-200 transition-colors group">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <i className="fa-solid fa-sun text-[15px]"></i>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900">Pagi</h4>
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">08:00 - 15:00</span>
            </div>
            <div className="space-y-3.5">
              {shiftInfo.pagi?.length > 0 ? shiftInfo.pagi.map((nama, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-bold hover:text-emerald-600 transition-colors cursor-default">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                  {nama}
                </div>
              )) : (
                <div className="text-xs text-slate-400 font-bold italic">Tidak ada</div>
              )}
            </div>
          </div>

          {/* Siang */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:border-amber-200 transition-colors group">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <i className="fa-solid fa-cloud-sun text-[15px]"></i>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900">Siang</h4>
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">15:00 - 22:00</span>
            </div>
            <div className="space-y-3.5">
              {shiftInfo.siang?.length > 0 ? shiftInfo.siang.map((nama, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-bold hover:text-amber-600 transition-colors cursor-default">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></div>
                  {nama}
                </div>
              )) : (
                <div className="text-xs text-slate-400 font-bold italic">Tidak ada</div>
              )}
            </div>
          </div>

          {/* Full Day → Cuti */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:border-purple-200 transition-colors group">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <i className="fa-solid fa-umbrella-beach text-[15px]"></i>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900">Cuti</h4>
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">HARI CUTI</span>
            </div>
            <div className="space-y-3.5">
              {shiftInfo.full?.length > 0 ? shiftInfo.full.map((nama, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-bold hover:text-purple-600 transition-colors cursor-default">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]"></div>
                  {nama}
                </div>
              )) : (
                <div className="text-xs text-slate-400 font-bold italic">Tidak ada</div>
              )}
            </div>
          </div>

          {/* Libur */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:border-rose-200 transition-colors group">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <i className="fa-solid fa-bed text-[15px]"></i>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900">Libur</h4>
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">ISTIRAHAT</span>
            </div>
            <div className="space-y-3.5">
              {shiftInfo.libur?.length > 0 ? shiftInfo.libur.map((nama, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-bold hover:text-rose-600 transition-colors cursor-default">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"></div>
                  {nama}
                </div>
              )) : (
                <div className="text-xs text-slate-400 font-bold italic">Tidak ada</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION BAWAH: TUGAS & KALENDER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TUGAS HARI INI (Logic Data Baru) */}
        <div className="lg:col-span-2 bg-white p-7 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tugas Hari Ini</h3>
            <Link to="/logbook" className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl transition-colors uppercase tracking-widest">
              Kerjakan <i className="fa-solid fa-arrow-right ml-1" />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {loading ? <p className="text-center text-slate-400 text-sm font-bold py-8 mt-4"><i className="fa-solid fa-spinner fa-spin mr-2" /> Memuat Tugas...</p> : todayTasks.length > 0 ? todayTasks.map((task) => (
              <Link to="/logbook" key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white rounded-[1.5rem] border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group gap-4">
                <div className="flex items-center gap-4 sm:gap-5 w-full">
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-colors ${
                    task.status === 'approved' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                    task.status === 'rejected' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' :
                    'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                  }`}>
                    <i className={`fa-solid ${task.status === 'approved' ? 'fa-check-circle' : task.status === 'rejected' ? 'fa-rotate-left' : 'fa-list-check'} text-xl`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{task.title}</h4>
                    <p className="text-[13px] font-medium text-slate-500 mt-0.5 line-clamp-1">{task.location}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border shrink-0 ${
                    task.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    task.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {task.status === 'approved' ? 'ACC ✓' : task.status === 'rejected' ? 'Revisi' : 'Pending'}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <i className="fa-solid fa-mug-hot text-4xl mb-3 text-slate-200"></i>
                <p className="text-sm font-bold">Tidak ada tugas hari ini. Santai dulu brok!</p>
              </div>
            )}
          </div>
        </div>

        {/* KALENDER */}
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
            <p className="text-lg font-black text-slate-900 tracking-widest uppercase">{monthName} {year}</p>
            <Link to="/my-schedule" className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest">
              Lihat Semua
            </Link>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 pb-2">{day}</div>
            ))}
          </div>
          
          {scheduleLoading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-slate-300 text-2xl"></i>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {calendarDays.map((d, i) => {
                if (!d.day) return <div key={i} className="bg-transparent" />;
                const style = d.schedule ? shiftStyle[d.schedule.shift_type] : null;
                const isToday = d.day === currentDay;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[13px] font-bold transition-all cursor-default hover:scale-105
                      ${isToday
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : style
                        ? `${style.bg} ${style.text} ${style.hover}`
                        : 'bg-slate-50/80 text-slate-400 hover:bg-slate-100'
                      }`}
                    title={d.schedule
                      ? `${d.day} ${monthName}: ${{ morning: 'Pagi 08:00-15:00', afternoon: 'Siang 15:00-22:00', full: 'Cuti' }[d.schedule.shift_type]}`
                      : `${d.day} ${monthName}: Libur`}
                  >
                    {d.day}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-center">
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Pagi</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Siang</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>Cuti</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>Libur</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InternDashboard;