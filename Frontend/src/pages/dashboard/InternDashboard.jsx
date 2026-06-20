import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import useUIStore from "../../store/useUIStore";
import api from "../../api/axios";

const InternDashboard = () => {
  const { user } = useAuth();
  
  // ZUSTAND: Panggil state UI untuk sapaan
  const greeting = useUIStore((state) => state.greeting);
  const updateGreeting = useUIStore((state) => state.updateGreeting);

  useEffect(() => {
    updateGreeting();
  }, [updateGreeting]);

  // TANSTACK QUERY: Fetch Dashboard Data
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ["internDashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard/intern");
      return response.data?.data || response.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // TANSTACK QUERY: Fetch Schedules
  const { data: schedulesData, isLoading: scheduleLoading } = useQuery({
    queryKey: ["internSchedules"],
    queryFn: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const response = await api.get("/schedules");
      const allSchedules = response.data.data || [];

      return allSchedules.filter((s) => {
        const d = s.shift_date ? s.shift_date.substring(0, 10) : "";
        return d >= startDate && d <= endDate;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const progress = dashboardData?.progress || { percentage: 0, completed: 0, total: 0 };
  const shiftInfo = dashboardData?.shiftInfo || { pagi: [], middle: [], siang: [], full: [], libur: [] };
  const todayTasks = dashboardData?.todayTasks || [];
  const schedules = schedulesData || [];

  // --- LOGIC KALENDER ---
  const date = new Date();
  const currentDay = date.getDate();
  const monthName = date.toLocaleDateString("id-ID", { month: "long" });
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  
  // 🔥 FIX 1: Ini yang bikin meledak kemaren lupa ditaruh
  const HOLIDAYS = ['2026-01-01', '2026-02-14', '2026-03-20', '2026-03-21', '2026-04-03', '2026-05-01', '2026-05-14', '2026-06-01', '2026-08-17', '2026-12-25'];
  
  const isPaidDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return new Date(year, month, d).getDay() === 0 || HOLIDAYS.includes(dateStr);
  };

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Shift config for calendar coloring
  const shiftStyle = {
  morning: { bg: "bg-emerald-50/80 border border-emerald-100", text: "text-emerald-600", hover: "hover:bg-emerald-100" },
  middle: { bg: "bg-yellow-50/80 border border-yellow-100", text: "text-yellow-600", hover: "hover:bg-yellow-100" },
  afternoon: { bg: "bg-orange-50/80 border border-orange-100", text: "text-orange-600", hover: "hover:bg-orange-100" },
  off: { bg: "bg-rose-50/80 border border-rose-100", text: "text-rose-600", hover: "hover:bg-rose-100" }
};

  const getScheduleForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.find((s) => (s.shift_date ? s.shift_date.substring(0, 10) : "") === dateStr);
  };

  const todaySchedule = getScheduleForDay(currentDay);
  const todayShiftLabel = todaySchedule
    ? { morning: "Pagi", middle: "Middle", afternoon: "Sore", full: "Cuti" }[todaySchedule.shift_type] || todaySchedule.shift_type
    : "Libur";
  const todayShiftTime = todaySchedule
    ? { morning: "08:00 - 15:00", middle: "10:00 - 17:00", afternoon: "15:00 - 22:00", full: "Hari Cuti" }[todaySchedule.shift_type] || "-"
    : "-";

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push({ day: null, schedule: null });
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push({ day: i, schedule: getScheduleForDay(i) });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* HERO SECTION */}
      <div className="py-2 text-black dark:text-slate-800 transition-all duration-300">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {greeting},{" "}
            <span className="text-slate-700 dark:text-blue-600">
              {user?.nickname || user?.full_name?.split(" ")[0] || "Tim"}! 👋
            </span>
          </h1>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-500 mt-2 max-w-2xl leading-relaxed font-medium">   
          Pantau jadwal shift, status rekan, dan selesaikan progres tugas harianmu di sini. Tetap fokus dan produktif!
        </p>
      </div>

      {/* TOP WIDGET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* WIDGET 1: DIVISI */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50/70 p-5 md:p-7 rounded-[2rem] border border-blue-100/50 shadow-lg shadow-blue-500/5 flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200">
          <i className="fa-solid fa-layer-group absolute -bottom-8 -right-6 text-[7rem] md:text-[8rem] text-blue-600/[0.03] group-hover:text-blue-600/[0.06] transition-all duration-500 -rotate-12 group-hover:-rotate-6 group-hover:scale-110 pointer-events-none"></i>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                <i className="fa-solid fa-layer-group text-lg md:text-xl"></i>
              </div>
              <span className="bg-emerald-50/80 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100/50 shadow-sm backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                ON DUTY
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Penempatan Divisi</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{user?.division_name || "IT Support"}</h2>
          </div>
          <div className="mt-8 pt-5 md:pt-6 border-t border-blue-900/5 relative z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Jadwal Shift Hari Ini
              </p>
              {scheduleLoading ? (
                <p className="text-sm text-slate-400 font-bold">
                  <i className="fa-solid fa-spinner fa-spin mr-1" /> Memuat...
                </p>
              ) : todaySchedule ? (
                <p className="text-[13px] md:text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 bg-white rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      todaySchedule.status === 'pending_sakit' ? "text-rose-600 border-rose-300 animate-pulse bg-rose-100" :
                      todaySchedule.status === 'pending_izin' ? "text-amber-600 border-amber-300 animate-pulse bg-amber-100" :
                      todaySchedule.shift_type === "morning" ? "text-emerald-600 border-emerald-100" : 
                      todaySchedule.shift_type === "middle" ? "text-yellow-600 border-yellow-100" : 
                      todaySchedule.shift_type === "afternoon" ? "text-orange-600 border-orange-100" : 
                      "text-rose-600 border-rose-100 bg-rose-50"
                    }`}
                  >
                    {todaySchedule.status === 'pending_sakit' ? 'Sakit (Pending)' : 
                     todaySchedule.status === 'pending_izin' ? 'Izin (Pending)' : 
                     todaySchedule.shift_type === 'morning' ? 'Pagi' :
                     todaySchedule.shift_type === 'middle' ? 'Middle' :
                     todaySchedule.shift_type === 'afternoon' ? 'Sore' : 'Off'}
                  </span>
                  {/* Waktu otomatis menyesuaikan */}
                  <span className="font-medium text-slate-600">
                    {todaySchedule.status?.startsWith('pending') ? 'Menunggu ACC...' : 
                    (todaySchedule.shift_type === 'morning' ? '08:00 - 15:00' : 
                    todaySchedule.shift_type === 'middle' ? '10:00 - 17:00' : 
                    todaySchedule.shift_type === 'afternoon' ? '15:00 - 22:00' : 'Istirahat')}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-white text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100 shadow-sm">
                    Libur
                  </span>
                  Tidak ada jadwal
                </p>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 2: PROGRESS BAR */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-5 md:p-7 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 border border-blue-400 flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-300">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700 pointer-events-none"></div>
          <i className="fa-solid fa-bars-progress absolute -bottom-6 -right-6 text-[7rem] md:text-[8rem] text-white/[0.08] group-hover:text-white/[0.12] transition-all duration-500 -rotate-12 group-hover:-rotate-6 group-hover:scale-110 pointer-events-none"></i>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
                <i className="fa-solid fa-list-check text-lg md:text-xl"></i>
              </div>
              <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md shadow-sm">HARI INI</span>
            </div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">Penyelesaian Rutinitas</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl md:text-[3.5rem] leading-none font-black tracking-tighter text-white drop-shadow-lg">
                {loading ? "..." : progress.percentage}<span className="text-xl md:text-2xl text-white/80 ml-0.5">%</span>
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-white/80 mb-1.5 md:mb-2">({progress.completed}/{progress.total} Tugas)</p>
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/80 mb-2.5">
              <span>PROGRESS BAR</span><span className="text-white">ON GOING</span>
            </div>
            <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden border border-white/20 shadow-inner">
              <div className="h-full bg-gradient-to-r from-white via-cyan-200 to-white rounded-full relative shadow-[0_0_15px_rgba(255,255,255,0.35)] transition-all duration-1000" style={{ width: `${progress.percentage}%` }}>
                <div className="absolute top-0 right-0 w-6 h-full bg-white/50 rounded-full blur-[2px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3: PERIZINAN */}
        <div className="bg-white p-5 md:p-7 rounded-[2rem] border border-blue-100 shadow-sm text-center flex flex-col justify-center items-center group hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl md:text-2xl mb-4 md:mb-5 border border-blue-100 group-hover:scale-105 transition-all duration-300">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <h4 className="text-base md:text-lg font-extrabold text-slate-800 mb-2 tracking-tight">Butuh Izin Besok?</h4>
          <p className="text-xs md:text-[13px] text-slate-500 font-medium leading-relaxed mb-6 md:mb-8 px-2">Pengajuan izin sakit, keluarga, atau tukar shift maksimal H-1.</p>
          <Link to="/leave-request" className="w-full py-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl text-xs md:text-sm font-black hover:scale-[1.02] transition-all shadow-md shadow-blue-500/20 border border-blue-400">
            Ajukan Perizinan
          </Link>
        </div>
      </div>

      {/* SECTION: STATUS REKAN SHIFT */}
      <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
            <i className="fa-solid fa-users-viewfinder text-base md:text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-none">Rekan Shift Divisi</h3>
            <p className="text-xs md:text-[13px] font-medium text-slate-500 mt-1.5">Pantau rekan yang masuk dan libur hari ini.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
          {/* Pagi */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 md:p-5 hover:border-emerald-200 transition-colors group">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0"><i className="fa-solid fa-sun text-sm md:text-lg"></i></div>
              <div className="min-w-0"><h4 className="text-xs md:text-sm font-bold text-slate-900 leading-tight">Pagi</h4><p className="text-[9px] md:text-[10px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">08:00 - 15:00</p></div>
            </div>
            <div className="space-y-2 md:space-y-3">
              {shiftInfo.pagi?.length > 0 ? shiftInfo.pagi.map((nama, i) => (<div key={i} className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-slate-700 font-bold hover:text-emerald-600 transition-colors cursor-default"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0"></div><span className="truncate">{nama}</span></div>)) : <div className="text-[10px] md:text-[11px] text-slate-400 font-bold italic">Tidak ada</div>}
            </div>
          </div>
          {/* Middle */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 md:p-5 hover:border-yellow-200 transition-colors group">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center group-hover:bg-yellow-100 transition-colors shrink-0"><i className="fa-solid fa-hourglass-half text-sm md:text-lg"></i></div>
              <div className="min-w-0"><h4 className="text-xs md:text-sm font-bold text-slate-900 leading-tight">Middle</h4><p className="text-[9px] md:text-[10px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">10:00 - 17:00</p></div>
            </div>
            <div className="space-y-2 md:space-y-3">
              {shiftInfo.middle?.length > 0 ? shiftInfo.middle.map((nama, i) => (<div key={i} className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-slate-700 font-bold hover:text-yellow-600 transition-colors cursor-default"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] shrink-0"></div><span className="truncate">{nama}</span></div>)) : <div className="text-[10px] md:text-[11px] text-slate-400 font-bold italic">Tidak ada</div>}
            </div>
          </div>
          {/* Sore */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 md:p-5 hover:border-amber-200 transition-colors group">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0"><i className="fa-solid fa-cloud-sun text-sm md:text-lg"></i></div>
              <div className="min-w-0"><h4 className="text-xs md:text-sm font-bold text-slate-900 leading-tight">Sore</h4><p className="text-[9px] md:text-[10px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">15:00 - 22:00</p></div>
            </div>
            <div className="space-y-2 md:space-y-3">
              {shiftInfo.siang?.length > 0 ? shiftInfo.siang.map((nama, i) => (<div key={i} className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-slate-700 font-bold hover:text-amber-600 transition-colors cursor-default"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0"></div><span className="truncate">{nama}</span></div>)) : <div className="text-[10px] md:text-[11px] text-slate-400 font-bold italic">Tidak ada</div>}
            </div>
          </div>
            {/* Libur / Off (Gabungan Cuti & Libur) */}
            <div className="col-span-2 md:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 md:p-5 hover:border-rose-200 transition-colors group">
              <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-100 transition-colors shrink-0">
                  <i className="fa-solid fa-bed text-sm md:text-lg"></i>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 leading-tight">Off</h4>
                  <p className="text-[9px] md:text-[10px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">Libur / Cuti / Izin</p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                {[...(shiftInfo.libur || []), ...(shiftInfo.full || [])].length > 0 ? (
                  [...(shiftInfo.libur || []), ...(shiftInfo.full || [])].map((nama, i) => (
                    <div key={i} className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-slate-700 font-bold hover:text-rose-600 transition-colors cursor-default">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)] shrink-0"></div>
                      <span className="truncate">{nama}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] md:text-[11px] text-slate-400 font-bold italic">Tidak ada</div>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* SECTION BAWAH: TUGAS & KALENDER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* TUGAS HARI INI */}
        <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Tugas Hari Ini</h3>
            <Link to="/logbook" className="text-[9px] md:text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors uppercase tracking-widest">Kerjakan <i className="fa-solid fa-arrow-right ml-1" /></Link>
          </div>
          <div className="space-y-3 md:space-y-4 flex-1">
            {loading ? (
              <p className="text-center text-slate-400 text-sm font-bold py-8 mt-4"><i className="fa-solid fa-spinner fa-spin mr-2" /> Memuat Tugas...</p>
            ) : todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <Link to="/logbook" key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 md:p-5 bg-white rounded-xl md:rounded-[1.5rem] border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-5 w-full">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[14px] flex items-center justify-center shrink-0 transition-colors ${task.status === "approved" ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : task.status === "rejected" ? "bg-rose-50 text-rose-500 group-hover:bg-rose-100" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                      <i className={`fa-solid ${task.status === "approved" ? "fa-check-circle" : task.status === "rejected" ? "fa-rotate-left" : "fa-list-check"} text-base md:text-xl`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] md:text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{task.title}</h4>
                      <p className="text-[11px] md:text-[13px] font-medium text-slate-500 mt-0.5 truncate">{task.location}</p>
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border shrink-0 ${task.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : task.status === "rejected" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {task.status === "approved" ? "ACC ✓" : task.status === "rejected" ? "Revisi" : "Pending"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-6 md:py-8">
                <i className="fa-solid fa-mug-hot text-3xl md:text-4xl mb-3 text-slate-200"></i>
                <p className="text-xs md:text-sm font-bold">Tidak ada tugas hari ini. Santai dulu brok!</p>
              </div>
            )}
          </div>
        </div>

        {/* KALENDER */}
        <div className="bg-white p-5 md:p-7 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
            <p className="text-base md:text-lg font-black text-slate-900 tracking-widest uppercase">{monthName} {year}</p>
            <Link to="/my-schedule" className="text-[9px] md:text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-widest">Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (<div key={day} className="text-center text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 pb-2">{day}</div>))}
          </div>
          {scheduleLoading ? (
            <div className="flex-1 flex items-center justify-center py-8"><i className="fa-solid fa-spinner fa-spin text-slate-300 text-xl md:text-2xl"></i></div>
          ) : (
            <div className="grid grid-cols-7 gap-1 md:gap-1.5 flex-1">
              {calendarDays.map((d, i) => {
                if (!d.day) return <div key={i} className="bg-transparent" />;
                
                // 🔥 FIX: Logic Inline biar kaga ngerusak shiftStyle yang cuma 4
                let styleObj = shiftStyle['off'];
                let extraClass = "";

                if (d.schedule) {
                  if (d.schedule.status === 'pending_sakit') {
                    styleObj = { bg: "bg-rose-100", text: "text-rose-700 font-black", hover: "hover:bg-rose-200" };
                    extraClass = "animate-pulse border border-rose-300 shadow-sm shadow-rose-500/20";
                  } else if (d.schedule.status === 'pending_izin') {
                    styleObj = { bg: "bg-amber-100", text: "text-amber-700 font-black", hover: "hover:bg-amber-200" };
                    extraClass = "animate-pulse border border-amber-300 shadow-sm shadow-amber-500/20";
                  } else if (shiftStyle[d.schedule.shift_type]) {
                    styleObj = shiftStyle[d.schedule.shift_type];
                  }
                } else if (isPaidDay(d.day)) {
                  // Otomatis biru kalau tanggal merah nasional/minggu
                  styleObj = { bg: "bg-blue-50/80", text: "text-blue-600", hover: "hover:bg-blue-100" };
                  extraClass = "border border-blue-100";
                }

                const isToday = d.day === currentDay;
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-lg md:rounded-xl flex items-center justify-center text-[11px] md:text-[13px] font-bold transition-all cursor-default hover:scale-105 ${isToday ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : `${styleObj.bg} ${styleObj.text} ${styleObj.hover} ${extraClass}`}`} 
                    title={d.schedule ? `${d.day} ${monthName}: ${{ morning: "Pagi 08:00-15:00", middle: "Middle 10:00-17:00", afternoon: "Sore 15:00-22:00", off: "Libur" }[d.schedule.shift_type] || "Libur"}` : `${d.day} ${monthName}: Libur`}
                  >
                    {d.day}
                  </div>
                );
              })}
            </div>
          )}
          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-2 gap-y-1 justify-center">
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 inline-block"></span>Pagi</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-yellow-600"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-yellow-500 inline-block"></span>Middle</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-orange-600"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 inline-block"></span>Afternoon</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-rose-600"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-500 inline-block"></span>Off</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-blue-600"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 inline-block"></span>Paid Day</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-rose-700 animate-pulse"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-600 inline-block"></span>Izin Sakit (Pending)</span>
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-amber-700 animate-pulse"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-600 inline-block"></span>Izin Keperluan (Pending)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;