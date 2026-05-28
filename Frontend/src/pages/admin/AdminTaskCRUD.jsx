import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const AdminTaskCRUD = () => {
  const { user } = useAuth();
  const myDivisionId = user?.division_id || user?.division?.id;
  const myDivisionName = user?.division?.name || user?.division_name || "IT Support";

  const canManageAll = false; 

  const [activeTab, setActiveTab] = useState("template"); 

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Kunci Scroll saat Modal buka
  useEffect(() => {
    if (showAddModal || showSuccessModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showAddModal, showSuccessModal]);

  // Form State
  const [taskName, setTaskName] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [taskDivisionId, setTaskDivisionId] = useState(myDivisionId || "");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("15:00");
  const [reminderTime, setReminderTime] = useState("14:30");

  const [taskTemplates, setTaskTemplates] = useState([]);
  const [liveTasks, setLiveTasks] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [filterDivision, setFilterDivision] = useState(myDivisionId || myDivisionName);
  const [loading, setLoading] = useState(true);
  const [editTaskId, setEditTaskId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

      const [tplRes, tasksRes, profRes, schedRes] = await Promise.all([
        api.get("/task-templates"),
        api.get("/daily-tasks"),
        api.get("/profiles"),
        api.get("/schedules", { params: { date: todayStr } }),
      ]);

      setTaskTemplates(tplRes.data?.data || tplRes.data || []);

      const allTasks = tasksRes.data?.data || tasksRes.data || [];
      // Tampilkan tugas hari ini yang tidak punya template di tab Tugas Dadakan
      setLiveTasks(allTasks.filter((t) => t.template_id === null && t.task_date === todayStr));

      const allProfiles = profRes.data?.data || profRes.data || [];
      setInterns(allProfiles.filter((p) => p.role === "intern"));

      setTodaySchedules(schedRes.data?.data || schedRes.data || []);
    } catch (error) {
      console.error("Gagal memuat data tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data berdasarkan divisi
  const filteredTemplates = useMemo(() => {
    return taskTemplates.filter((t) => t.division_id === myDivisionId || t.division?.name === myDivisionName);
  }, [taskTemplates, myDivisionId, myDivisionName]);

  const filteredLiveTasks = useMemo(() => {
    return liveTasks.filter((t) => t.division_id === myDivisionId || t.division?.name === myDivisionName);
  }, [liveTasks, myDivisionId, myDivisionName]);

  // Filter interns untuk dropdown form penugasan
  const modalInterns = useMemo(() => {
    return interns.filter((i) => {
      const internDivId = i.division_id || i.division?.id;
      if (activeTab === "live") {
        const isOnShift = todaySchedules.some((s) => s.user_id === i.id);
        if (!isOnShift) return false;
      }
      return internDivId === myDivisionId || i.division?.name === myDivisionName || i.division === myDivisionName;
    });
  }, [interns, myDivisionId, myDivisionName, activeTab, todaySchedules]);

  const handleOpenAddModal = (tab) => {
    setActiveTab(tab);
    setEditTaskId(null);
    setTaskName("");
    setTaskDetail("");
    setAssignee("");
    setDueDate("");
    setAssignNote("");
    setStartTime("08:00");
    setEndTime("15:00");
    setReminderTime("14:30");
    setShowAddModal(true);
  };

  const handleEditTask = (task, isLive) => {
    setActiveTab(isLive ? "live" : "template");
    setEditTaskId(task.id);
    setTaskName(task.title || task.description || "");
    setTaskDetail(task.description || "");
    setTaskDivisionId(task.division_id || myDivisionId || "");
    setStartTime(task.start_time || "08:00");
    setEndTime(task.end_time || "15:00");
    setReminderTime(task.reminder_time || "14:30");

    if (isLive) {
      setAssignee(task.uploader_id || "");
      setDueDate(task.due_date || task.task_date || "");
      setAssignNote(task.assign_note || "");
    }
    setShowAddModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === "template") {
        const payload = {
          title: taskName,
          description: taskDetail,
          start_time: startTime,
          end_time: endTime,
          reminder_time: reminderTime,
          division_id: myDivisionId,
        };
        if (editTaskId) await api.put(`/task-templates/${editTaskId}`, payload);
        else await api.post("/task-templates", payload);
      } else {
        const payload = {
          uploader_id: assignee,
          description: taskName,
          due_date: dueDate,
          assign_note: assignNote,
          start_time: startTime,
          end_time: endTime,
          reminder_time: reminderTime,
          division_id: myDivisionId,
        };
        if (editTaskId) await api.put(`/daily-tasks/${editTaskId}`, payload);
        else await api.post("/daily-tasks", payload);
      }
      setShowAddModal(false);
      setShowSuccessModal(true);
      fetchData();
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan tugas!");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Hapus blueprint ini secara permanen?")) {
      try {
        await api.delete(`/task-templates/${id}`);
        toast.success("Blueprint dihapus");
        fetchData();
      } catch (e) {
        toast.error("Gagal menghapus blueprint");
      }
    }
  };

  const handleDeleteLiveTask = async (id) => {
    if (window.confirm("Hapus tugas urgent ini?")) {
      try {
        await api.delete(`/daily-tasks/${id}`);
        toast.success("Tugas urgent dihapus");
        fetchData();
      } catch (e) {
        toast.error("Gagal menghapus tugas");
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      
      {/* ================================================================= */}
      {/* HERO SECTION + TABS (MURNI ADMIN DARK BLUE THEME)                 */}
      {/* ================================================================= */}
      <div className="rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none bg-blue-500/20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none bg-indigo-500/10" />

        {/* Content Top */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm bg-white/10 border-white/20 text-white">
                <i className="fa-solid fa-clipboard-list text-xl" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border text-blue-200 bg-white/10 border-white/10">
                Task Management
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              Logbook Center.
            </h1>
            <p className="text-sm font-medium leading-relaxed text-blue-100/70 max-w-xl">
              Kelola Blueprint tugas harian yang berjalan otomatis, atau berikan tugas dadakan untuk anak magang di divisi Anda.
            </p>
          </div>

          <div className="shrink-0 mt-4 md:mt-0">
            <button
              onClick={() => handleOpenAddModal(activeTab)}
              className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 border border-blue-500 group"
            >
              <i className="fa-solid fa-plus text-lg group-hover:rotate-90 transition-transform duration-300"></i>
              Buat {activeTab === "template" ? "Blueprint" : "Tugas Dadakan"}
            </button>
          </div>
        </div>

        {/* Tabs Bar (Menyatu di Bawah Hero) */}
        <div className="p-6 sm:p-8 relative z-10 bg-black/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            
            {/* Tabs Selector */}
            <div className="flex items-center gap-2 w-full overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab("template")}
                className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 shrink-0 border ${
                  activeTab === "template"
                    ? "bg-white text-[#162447] border-white shadow-lg"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                }`}
              >
                <i className="fa-solid fa-robot" /> Template Rutin (Sistem)
              </button>
              <button
                onClick={() => setActiveTab("live")}
                className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 shrink-0 border ${
                  activeTab === "live"
                    ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                }`}
              >
                <i className="fa-solid fa-bolt" /> Tugas Dadakan (Hari Ini)
              </button>
            </div>
            
            <button
              onClick={fetchData}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 shrink-0 bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              <i className="fa-solid fa-arrows-rotate" /> Refresh
            </button>

          </div>
        </div>
      </div>

      {/* Header Info List (Pemisah Gede) */}
      <div className={`px-4 sm:px-6 py-4 flex items-center gap-4 border border-slate-200 rounded-3xl ${activeTab === "template" ? "bg-blue-50/50" : "bg-rose-50/50"}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 ${activeTab === "template" ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-500"}`}>
          <i className={`fa-solid ${activeTab === "template" ? "fa-robot" : "fa-person-running"}`}></i>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800 leading-tight">
            {activeTab === "template" ? "Daftar Blueprint Otomatis (Akan Di-copy)" : "Daftar Tugas Urgent Hari Ini"}
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            {activeTab === "template"
              ? "Sistem otomatis membagikan tugas ini ke anak magang setiap jam 00:00."
              : "Tugas mendadak yang harus diselesaikan oleh intern hari ini juga."}
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DESAIN CARD LIST                                                    */}
      {/* ================================================================= */}
      <div className="space-y-6">
        {/* JIKA DATA KOSONG */}
        {(activeTab === "template" ? filteredTemplates : filteredLiveTasks).length === 0 && (
          <div className="p-16 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner border border-slate-100">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <p className="text-slate-500 font-bold text-sm mb-1">{loading ? "Memuat data..." : "Belum ada data."}</p>
            <p className="text-xs font-medium text-slate-400">Tekan tombol di Hero buat nambahin.</p>
          </div>
        )}

        {/* RENDER TEMPLATE */}
        {activeTab === "template" && filteredTemplates.map((task) => (
            <div key={task.id} className="bg-[#1a3a6c]/40 p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl hover:border-blue-400/50 transition-all group flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30">Rutin (Sistem)</span>
                    {task.division?.name && (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">{task.division?.name}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-[18px] leading-tight mb-1">{task.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditTask(task, false)} className="px-5 py-2.5 bg-[#162447] border border-blue-500/30 text-blue-200 hover:text-white hover:border-blue-400 rounded-xl text-xs font-bold transition-all">
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                  <button onClick={() => handleDeleteTemplate(task.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-rose-50">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Instruksi Detail */}
              <div className="bg-[#162447] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start gap-4 shadow-inner">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-list-check text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Instruksi Pelaksanaan</p>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed italic">"{task.description || "Tidak ada instruksi detail."}"</p>
                  
                  {(task.start_time || task.end_time || task.reminder_time) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {task.start_time && task.end_time && (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><i className="fa-regular fa-clock"></i> {task.start_time} – {task.end_time} WIB</span>
                      )}
                      {task.reminder_time && (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><i className="fa-solid fa-bell"></i> Reminder {task.reminder_time} WIB</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
        ))}

        {/* RENDER TUGAS URGENT */}
        {activeTab === "live" && filteredLiveTasks.map((task) => (
            <div key={task.id} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
              <span className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg bg-rose-500 animate-pulse"></span>

              <div className="flex flex-col sm:flex-row sm:items-start lg:items-center gap-5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 shadow-inner">
                  <i className="fa-solid fa-bolt animate-pulse"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-[18px] leading-tight mb-1.5">{task.description || "Tugas Urgent"}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">Dibuat: {new Date(task.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString("id-ID") : "Hari Ini"}</span>
                  </div>
                  {task.assign_note && <p className="text-[11px] mt-2 text-slate-500 italic">"{task.assign_note}"</p>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl shadow-inner w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-slate-300 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0 border border-white">
                    {(task.uploader?.full_name || "I").charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Ditugaskan Ke</p>
                    <span className="text-[12px] font-black text-slate-800 truncate block max-w-[150px]">{task.uploader?.full_name || "Intern"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button onClick={() => handleEditTask(task, true)} className="w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-300 rounded-2xl text-sm font-bold shadow-sm transition-all sm:opacity-0 group-hover:opacity-100 shrink-0">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDeleteLiveTask(task.id)} className="w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-300 rounded-2xl text-sm font-bold shadow-sm transition-all sm:opacity-0 group-hover:opacity-100 shrink-0">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* MODAL FORM: BUILDER TEMPLATE & URGENT                             */}
      {/* ================================================================= */}
      {showAddModal && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-[#0b1437]/90 backdrop-blur-md animate-in fade-in m-0">
            <div className="bg-[#1a3a6c] border border-blue-400/20 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className={`px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center shrink-0 ${activeTab === "template" ? "bg-blue-50/50" : "bg-rose-50/50"}`}>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
                  {activeTab === "template" ? (
                    <><div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner border border-blue-200"><i className="fa-solid fa-robot text-sm"></i></div> {editTaskId ? "Edit Blueprint" : "Setup Blueprint"}</>
                  ) : (
                    <><div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner border border-rose-200"><i className="fa-solid fa-bolt text-sm"></i></div> {editTaskId ? "Edit Tugas Urgent" : "Tambah Urgent"}</>
                  )}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="bg-blue-900/50 text-white rounded-full w-8 h-8 hover:bg-rose-600 transition-colors flex items-center justify-center">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Body Form Modal */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
                <form id="taskForm" onSubmit={handleSubmitTask} className="space-y-6">
                  
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                      {activeTab === "template" ? "Judul Blueprint Rutinitas" : "Judul Tugas Urgent Hari Ini"} <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" required value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder={activeTab === "template" ? "Misal: Cek Suhu Ruang Server..." : "Misal: Angkat Proyektor ke Lantai 4..."} />
                  </div>

                  {/* TEMPLATE RUTIN (Automation Setup) */}
                  {activeTab === "template" && (
                    <>
                      <div className="bg-blue-50 border border-blue-100 p-4 sm:p-5 rounded-xl flex gap-3.5 items-start">
                        <i className="fa-solid fa-circle-info text-blue-500 text-sm mt-0.5"></i>
                        <p className="text-blue-800 text-[11px] sm:text-xs font-medium leading-relaxed">Isian di bawah ini akan digunakan oleh sistem untuk meng-copy tugas otomatis setiap hari besok.</p>
                      </div>
                      
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest flex justify-between">Instruksi Detail <span className="text-slate-400 font-medium normal-case tracking-normal">Opsional</span></label>
                        <textarea value={taskDetail} onChange={(e) => setTaskDetail(e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" placeholder="Contoh: Pastikan matikan PC sebelum pulang."></textarea>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 space-y-4">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2"><i className="fa-solid fa-clock"></i> Konfigurasi Jam Kerja</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Mulai</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Selesai</label>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Pengingat</label>
                            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TUGAS URGENT (Live Assign) */}
                  {activeTab === "live" && (
                    <>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Tugaskan Kepada <span className="text-rose-500">*</span></label>
                        <select required value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                          <option value="">Pilih Intern (Yang Sedang Aktif)...</option>
                          {modalInterns.map((intern) => (
                            <option key={intern.id} value={intern.id}>{intern.full_name || intern.username}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Due Date <span className="text-rose-500">*</span></label>
                        <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest flex justify-between">Catatan Tambahan <span className="text-slate-400 font-medium normal-case tracking-normal">Opsional</span></label>
                        <textarea value={assignNote} onChange={(e) => setAssignNote(e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" placeholder="Contoh: Pastikan bawa kabel HDMI cadangan."></textarea>
                      </div>

                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sm:p-5 space-y-4">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2"><i className="fa-solid fa-clock"></i> Konfigurasi Jam Kerja</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Mulai</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border border-rose-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Selesai</label>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white border border-rose-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">Pengingat</label>
                            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full bg-white border border-rose-200 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* Footer Modal */}
              <div className="p-4 sm:p-6 border-t border-slate-100 shrink-0 bg-white shadow-[0_-10px_15px_rgba(0,0,0,0.02)]">
                <button form="taskForm" type="submit" className={`w-full py-4 rounded-xl text-white font-black shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${activeTab === "template" ? "bg-[#162447] hover:bg-[#1a3a6c] shadow-[#162447]/30" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"}`}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Simpan ke Sistem
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================================================================= */}
      {/* MODAL SUCCESS AFTER-EFFECT                                        */}
      {/* ================================================================= */}
      {showSuccessModal && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#0b1437]/70 backdrop-blur-md animate-in fade-in m-0">
            <div className="bg-white rounded-[3rem] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-75 slide-in-from-bottom-10 duration-300 border-[8px] border-white ring-1 ring-slate-100 max-w-sm w-full">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl sm:text-5xl mb-6 shadow-inner animate-bounce border-4 border-white ring-4 ring-emerald-50">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 tracking-tight">Data Tersimpan!</h2>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                {activeTab === "template" ? "Sistem automation berhasil di-update." : "Tugas urgent telah dikirim ke target!"}
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminTaskCRUD;