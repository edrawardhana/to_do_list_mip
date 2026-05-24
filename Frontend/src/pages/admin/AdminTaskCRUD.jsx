import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const AdminTaskCRUD = () => {
  const { user, isSuperAdmin } = useAuth();
  const canManageAll = isSuperAdmin;
  const myDivisionId = user?.division_id || user?.division?.id;
  const myDivisionName =
    user?.division?.name || user?.division_name || "IT Support";

  const [activeTab, setActiveTab] = useState("template"); // 'template' atau 'live'

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
  const [divisions, setDivisions] = useState([]);
  const [filterDivision, setFilterDivision] = useState(
    canManageAll ? "Semua" : myDivisionId || myDivisionName,
  );
  const [loading, setLoading] = useState(true);
  const [editTaskId, setEditTaskId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayDate = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
      );
      const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

      const [tplRes, tasksRes, profRes, divRes, schedRes] = await Promise.all([
        api.get("/task-templates"),
        api.get("/daily-tasks"),
        api.get("/profiles"),
        canManageAll ? api.get("/divisions") : Promise.resolve({ data: [] }),
        api.get("/schedules", { params: { date: todayStr } }),
      ]);

      setTaskTemplates(tplRes.data?.data || tplRes.data || []);

      const allTasks = tasksRes.data?.data || tasksRes.data || [];
      // Tampilkan tugas hari ini yang tidak punya template di tab Tugas Dadakan
      setLiveTasks(
        allTasks.filter(
          (t) => t.template_id === null && t.task_date === todayStr,
        ),
      );

      const allProfiles = profRes.data?.data || profRes.data || [];
      setInterns(allProfiles.filter((p) => p.role === "intern"));

      if (canManageAll) {
        setDivisions(divRes.data?.data || divRes.data || []);
      }
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
    let data = taskTemplates;
    if (canManageAll && filterDivision !== "Semua") {
      data = data.filter((t) => t.division_id === filterDivision);
    } else if (!canManageAll) {
      data = data.filter(
        (t) =>
          t.division_id === myDivisionId || t.division?.name === myDivisionName,
      );
    }
    return data;
  }, [
    taskTemplates,
    filterDivision,
    canManageAll,
    myDivisionId,
    myDivisionName,
  ]);

  const filteredLiveTasks = useMemo(() => {
    let data = liveTasks;
    if (canManageAll && filterDivision !== "Semua") {
      data = data.filter((t) => t.division_id === filterDivision);
    } else if (!canManageAll) {
      data = data.filter(
        (t) =>
          t.division_id === myDivisionId || t.division?.name === myDivisionName,
      );
    }
    return data;
  }, [liveTasks, filterDivision, canManageAll, myDivisionId, myDivisionName]);

  // Filter interns untuk dropdown form penugasan
  const modalInterns = useMemo(() => {
    return interns.filter((i) => {
      const internDivId = i.division_id || i.division?.id;

      if (activeTab === "live") {
        const isOnShift = todaySchedules.some((s) => s.user_id === i.id);
        if (!isOnShift) return false;
      }

      if (canManageAll) {
        return taskDivisionId ? internDivId === taskDivisionId : true;
      }
      return (
        internDivId === myDivisionId ||
        i.division?.name === myDivisionName ||
        i.division === myDivisionName
      );
    });
  }, [
    interns,
    taskDivisionId,
    canManageAll,
    myDivisionId,
    myDivisionName,
    activeTab,
    todaySchedules,
  ]);

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

  // Handler Submit
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
          division_id: canManageAll ? taskDivisionId : myDivisionId,
        };
        if (editTaskId) {
          await api.put(`/task-templates/${editTaskId}`, payload);
        } else {
          await api.post("/task-templates", payload);
        }
      } else {
        const payload = {
          uploader_id: assignee,
          description: taskName,
          due_date: dueDate,
          assign_note: assignNote,
          start_time: startTime,
          end_time: endTime,
          reminder_time: reminderTime,
          division_id: canManageAll ? taskDivisionId : myDivisionId,
        };
        if (editTaskId) {
          await api.put(`/daily-tasks/${editTaskId}`, payload);
        } else {
          await api.post("/daily-tasks", payload);
        }
      }
      setShowAddModal(false);
      setShowSuccessModal(true);
      fetchData();
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error("Gagal menyimpan tugas:", error.response?.data || error);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto relative">
      {/* ================================================================= */}
      {/* HERO SECTION + FILTER TABS (BLUE-950 THEME)                       */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-r border-blue-400/20 shadow-2xl rounded-[2.5rem] text-white relative overflow-hidden group flex flex-col mb-6">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Info Hero & CTA */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-sky-400 shrink-0 shadow-lg">
                <i className="fa-solid fa-clipboard-list text-xl relative z-10"></i>
              </div>
              <span className="text-sky-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                Task Management
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white drop-shadow-sm">
              Logbook Center.
            </h1>

            {/* ========================================================== */}
            {/* VISUAL WIDGET (PENGGANTI TEKS DESKRIPSI BIAR LEBIH KEREN)  */}
            {/* ========================================================== */}
            <div className="flex items-center gap-5 mt-2">
              {/* 1. Animated Progress Ring */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <path
                    strokeDasharray="75, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-[spin_3s_linear_infinite]"
                  />
                </svg>
                <i className="fa-solid fa-bolt text-sky-400 text-[10px] absolute animate-pulse"></i>
              </div>

              {/* Garis Pemisah */}
              <div className="h-8 w-px bg-white/10 rounded-full"></div>

              {/* 2. Visual Activity Graph (Equalizer) */}
              <div className="flex items-end gap-1.5 h-7">
                <div className="w-1.5 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div
                  className="w-1.5 h-5 bg-sky-400 rounded-full animate-pulse"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-7 bg-emerald-400 rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <div
                  className="w-1.5 h-4 bg-indigo-400 rounded-full animate-pulse"
                  style={{ animationDelay: "450ms" }}
                ></div>
                <div
                  className="w-1.5 h-2 bg-blue-300 rounded-full animate-pulse"
                  style={{ animationDelay: "600ms" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="shrink-0 mt-4 md:mt-0">
            <button
              onClick={() => handleOpenAddModal(activeTab)}
              className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 border border-blue-500 group"
            >
              <i className="fa-solid fa-plus text-lg group-hover:rotate-90 transition-transform duration-300"></i>
              Buat {activeTab === "template" ? "Blueprint" : "Tugas Dadakan"}
            </button>
          </div>
        </div>

        {/* Tabs Dock */}
        <div className="relative z-10 bg-white/5 border-t border-white/10 px-8 py-5 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setActiveTab("template")}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === "template"
                ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20 scale-105"
                : "bg-blue-950/50 text-blue-200 border-white/10 hover:bg-white/10"
            }`}
          >
            <i className="fa-solid fa-calendar-check"></i> Template Rutin
            (Sistem)
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === "live"
                ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/20 scale-105"
                : "bg-blue-950/50 text-blue-200 border-white/10 hover:bg-white/10"
            }`}
          >
            <i className="fa-solid fa-bolt"></i> Tugas Dadakan (Hari Ini)
          </button>
        </div>
      </div>

      {/* FILTER DIVISI KHUSUS VVIP */}
      {canManageAll && (
        <div className="flex justify-end mb-4 px-2">
          <div className="relative w-full sm:w-64">
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm"
            >
              <option value="Semua">Semua Divisi</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          </div>
        </div>
      )}

      {/* Header Info List (Pemisah Gede) */}
      <div
        className={`px-4 sm:px-6 py-4 flex items-center gap-4 border border-slate-200 rounded-3xl ${activeTab === "template" ? "bg-blue-50/50" : "bg-rose-50/50"}`}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 ${activeTab === "template" ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-500"}`}
        >
          <i
            className={`fa-solid ${activeTab === "template" ? "fa-robot" : "fa-person-running"}`}
          ></i>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800 leading-tight">
            {activeTab === "template"
              ? "Daftar Blueprint Otomatis (Akan Di-copy)"
              : "Daftar Tugas Urgent Hari Ini"}
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            {activeTab === "template"
              ? "Sistem otomatis membuat tugas ini setiap jam 00:00."
              : "Tugas mendadak yang harus diselesaikan oleh intern hari ini juga."}
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DESAIN CARD LIST (Nggak Flat, kayak Template Terstruktur)          */}
      {/* ================================================================= */}
      <div className="space-y-6">
        {/* JIKA DATA KOSONG */}
        {(activeTab === "template" ? filteredTemplates : filteredLiveTasks)
          .length === 0 && (
          <div className="p-16 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner border border-slate-100">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <p className="text-slate-500 font-bold text-sm mb-1">
              {loading ? "Memuat data..." : "Belum ada data."}
            </p>
            <p className="text-xs font-medium text-slate-400">
              Tekan tombol di Hero buat nambahin.
            </p>
          </div>
        )}

        {/* RENDER TEMPLATE SEBAGAI SEBUAH CARD UTUH (Nggak Flat) */}
        {activeTab === "template" &&
          filteredTemplates.map((task) => (
            <div
              key={task.id}
              className="bg-[#1a3a6c]/40 p-7 md:p-8 rounded-[2rem] border border-white/10 shadow-xl hover:border-blue-400/50 transition-all group flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                      Rutin (Sistem)
                    </span>
                    {canManageAll && task.division?.name && (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {task.division?.name}
                      </span>
                    )}
                    <p className="text-xs font-black text-blue-200/50 uppercase tracking-widest leading-none mt-0.5">
                      Blueprint Rutin
                    </p>
                  </div>
                  <h3 className="font-bold text-white text-[18px] leading-tight mb-1">
                    {task.title}
                  </h3>
                </div>

                {/* Aksi Edit/Delete di Pojok Kanan Atas Card */}
                <div className="flex items-center gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditTask(task, false)}
                    className="px-5 py-2.5 bg-[#162447] border border-blue-500/30 text-blue-200 hover:text-white hover:border-blue-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(task.id)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-rose-50"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Bagian Bawah Card Instruksi Detail Inner Card */}
              <div className="bg-[#162447] p-5 rounded-2xl border border-white/5 flex items-start gap-4 shadow-inner">
                <div className="text-xs font-medium text-slate-300 leading-relaxed italic shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <i className="fa-solid fa-list-check text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Instruksi Pelaksanaan
                  </p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    "{task.description || "Tidak ada instruksi detail."}"
                  </p>
                  {/* ── TAMPILKAN JAM KERJA TEMPLATE ── */}
                  {(task.start_time || task.end_time || task.reminder_time) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {task.start_time && task.end_time && (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-regular fa-clock"></i>
                          {task.start_time} – {task.end_time} WIB
                        </span>
                      )}
                      {task.reminder_time && (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-solid fa-bell"></i>
                          Reminder {task.reminder_time} WIB
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

        {/* RENDER TUGAS URGENT SEBAGAI SEBUAH CARD UTUH (Nggak Flat) */}
        {activeTab === "live" &&
          filteredLiveTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-7 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
            >
              {/* Ping Accent */}
              <span className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg bg-rose-500 animate-pulse"></span>

              <div className="flex flex-col md:flex-row md:items-center gap-5 fle-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 shadow-inner">
                  <i className="fa-solid fa-bolt animate-pulse"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-[18px] leading-tight mb-1.5">
                    {task.description || "Tugas Urgent"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">
                      Dibuat Jam:{" "}
                      {new Date(task.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </span>
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      Due:{" "}
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("id-ID")
                        : "Hari Ini"}
                    </span>
                    {canManageAll && task.division?.name && (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {task.division?.name}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-none mt-0.5">
                      Tugas Urgent (Dadakan)
                    </span>
                  </div>
                  {task.assign_note && (
                    <p className="text-[11px] mt-2 text-slate-500 italic">
                      "{task.assign_note}"
                    </p>
                  )}
                  {/* ── TAMPILKAN JAM KERJA TUGAS URGENT ── */}
                  {(task.start_time || task.end_time || task.reminder_time) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {task.start_time && task.end_time && (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-regular fa-clock"></i>
                          {task.start_time} – {task.end_time} WIB
                        </span>
                      )}
                      {task.reminder_time && (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-solid fa-bell"></i>
                          Reminder {task.reminder_time} WIB
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0 pl-16 md:pl-0 w-full md:w-auto">
                {/* Assignee Badge */}
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl shadow-inner w-full sm:w-auto">
                  <div className="w-7 h-7 rounded-lg bg-slate-300 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0 border border-white">
                    {(task.uploader?.full_name || "I").charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Ditugaskan Ke
                    </p>
                    <span className="text-[13px] font-black text-slate-800">
                      {task.uploader?.full_name || "Intern"}
                    </span>
                  </div>
                </div>

                {/* Aksi Hapus Urgent */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTask(task, true)}
                    className="w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-300 rounded-2xl text-sm font-bold shadow-sm transition-all md:opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteLiveTask(task.id)}
                    className="w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-300 rounded-2xl text-sm font-bold shadow-sm transition-all md:opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* ================================================================= */}
      {/* MODAL FORM: BUILDER TEMPLATE & URGENT (Proper Builder)            */}
      {/* ================================================================= */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6 bg-[#0b1437]/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#1a3a6c] border border-blue-400/20 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div
                className={`px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0 ${activeTab === "template" ? "bg-blue-50/50" : "bg-rose-50/50"}`}
              >
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  {activeTab === "template" ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner border border-blue-200">
                        <i className="fa-solid fa-robot text-sm"></i>
                      </div>{" "}
                      {editTaskId ? "Edit Blueprint" : "Setup Blueprint"}
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner border border-rose-200">
                        <i className="fa-solid fa-bolt text-sm"></i>
                      </div>{" "}
                      {editTaskId ? "Edit Tugas Urgent" : "Tambah Urgent"}
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-blue-900/50 text-white rounded-full w-8 h-8 hover:bg-rose-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Body Form Modal */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form
                  id="taskForm"
                  onSubmit={handleSubmitTask}
                  className="space-y-6"
                >
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                      {activeTab === "template"
                        ? "Judul Blueprint Rutinitas"
                        : "Judul Tugas Urgent Hari Ini"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder={
                        activeTab === "template"
                          ? "Misal: Cek Suhu Ruang Server..."
                          : "Misal: Angkat Proyektor ke Lantai 4..."
                      }
                    />
                  </div>

                  {/* PILIH DIVISI KHUSUS VVIP */}
                  {canManageAll && (
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                        Untuk Divisi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={taskDivisionId}
                        onChange={(e) => setTaskDivisionId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="">Pilih Divisi...</option>
                        {divisions.map((div) => (
                          <option key={div.id} value={div.id}>
                            {div.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* FORM KHUSUS TEMPLATE RUTIN (Automation Setup) */}
                  {activeTab === "template" && (
                    <>
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex gap-3.5 items-start">
                        <i className="fa-solid fa-circle-info text-blue-500 text-sm mt-0.5"></i>
                        <p className="text-blue-800 text-xs font-medium leading-relaxed">
                          Isian di bawah ini akan digunakan oleh sistem untuk
                          meng-copy tugas otomatis setiap hari besok.
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest flex justify-between">
                          Instruksi Detail{" "}
                          <span className="text-slate-400 font-medium normal-case tracking-normal">
                            Gak wajib, biar intern jelas aja
                          </span>
                        </label>
                        <textarea
                          value={taskDetail}
                          onChange={(e) => setTaskDetail(e.target.value)}
                          rows="3"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          placeholder="Contoh: Pastikan matikan PC sebelum pulang, cabut kabel router di lantai 2 jika shift sore."
                        ></textarea>
                      </div>

                      {/* ── JAM KERJA TEMPLATE ── */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                          <i className="fa-solid fa-clock"></i> Konfigurasi Jam
                          Kerja & Pengingat
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Mulai
                            </label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Selesai
                            </label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Pengingat
                            </label>
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-blue-500 font-medium">
                          <i className="fa-solid fa-circle-info mr-1"></i>
                          Intern hanya bisa submit laporan antara Jam Mulai -
                          Jam Selesai. Notifikasi pengingat otomatis dikirim
                          pada Jam Pengingat.
                        </p>
                      </div>
                    </>
                  )}

                  {/* FORM KHUSUS TUGAS URGENT (Live Assign) */}
                  {activeTab === "live" && (
                    <>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                          Tugaskan Kepada{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="">
                            Pilih Intern (Yang Sedang Aktif)...
                          </option>
                          {modalInterns.map((intern) => (
                            <option key={intern.id} value={intern.id}>
                              {intern.full_name || intern.username}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                          Tenggat Waktu (Due Date){" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest flex justify-between">
                          Catatan Penugasan{" "}
                          <span className="text-slate-400 font-medium normal-case tracking-normal">
                            Opsional
                          </span>
                        </label>
                        <textarea
                          value={assignNote}
                          onChange={(e) => setAssignNote(e.target.value)}
                          rows="3"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          placeholder="Contoh: Pastikan bawa kabel HDMI cadangan."
                        ></textarea>
                      </div>

                      {/* ── JAM KERJA TUGAS URGENT ── */}
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                          <i className="fa-solid fa-clock"></i> Konfigurasi Jam
                          Kerja & Pengingat
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Mulai
                            </label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Selesai
                            </label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 tracking-widest">
                              Jam Pengingat
                            </label>
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-rose-500 font-medium">
                          <i className="fa-solid fa-circle-info mr-1"></i>
                          Intern hanya bisa submit laporan antara Jam Mulai -
                          Jam Selesai. Notifikasi pengingat otomatis dikirim
                          pada Jam Pengingat.
                        </p>
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-slate-100 shrink-0 bg-white shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                <button
                  form="taskForm"
                  type="submit"
                  className={`w-full py-4 rounded-xl text-white font-black shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${
                    activeTab === "template"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
                  }`}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> Simpan ke
                  Sistem
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ================================================================= */}
      {/* MODAL SUCCESS AFTER-EFFECT                                        */}
      {/* ================================================================= */}
      {showSuccessModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0b1437]/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-75 slide-in-from-bottom-10 duration-300 border-[8px] border-white ring-1 ring-slate-100 max-w-sm w-full">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-bounce border-4 border-white ring-4 ring-emerald-50">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
                Data Tersimpan!
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                {activeTab === "template"
                  ? "Sistem automation berhasil di-update."
                  : "Tugas urgent telah dikirim ke target!"}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default AdminTaskCRUD;
