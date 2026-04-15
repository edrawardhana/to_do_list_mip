import React, { useState, useEffect } from "react";
import InternTaskCard from "../../components/ui/InternTaskCard";
import LiveCameraModal from "../../components/ui/LiveCameraModal";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const InternTasks = () => {
  const { user } = useAuth();
  
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.user_metadata?.division || "IT Support"
  } : { id: "1", name: "Kiel", division: "IT Support" };

  const [selectedTask, setSelectedTask] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/daily-tasks');
      const data = res.data?.data || res.data || [];
      
      setTasks(data.map(t => {
        let uiStatus = "todo";
        if (t.status === "approved" || t.status === "completed") uiStatus = "completed";
        else if (t.status === "rejected" || t.status === "revision") uiStatus = "revision";
        else if (t.evidence_url || t.status === "waiting_confirmation") uiStatus = "waiting_confirmation";
        
        return {
          id: t.id,
          title: t.template?.title || t.description || "Tugas Harian",
          location: "Kantor MCC",
          status: uiStatus,
          admin_notes: t.reject_reason || t.reviewer_notes || "",
          is_urgent: t.template_id === null, // Urgent jika tidak punya template (Dadakan)
          photo: t.evidence_url || null,
          inviter_name: t.assigner?.full_name || t.assigned_by?.full_name || t.uploader?.full_name || t.uploader?.nickname || "",
          tagged_users: Array.isArray(t.confirmed_participants) ? t.confirmed_participants : [],
          due_date: t.due_date,
          assign_note: t.assign_note
        };
      }));
    } catch (error) {
      console.error("Gagal memuat tugas harian:", error);
      toast.error("Gagal memuat logbook tugas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const regularTasks = tasks.filter(t => !t.is_urgent);
  const urgentTasks = tasks.filter(t => t.is_urgent);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleOpenCamera = (task) => {
    // Frontend lock menyesuaikan Trigger Database Supabase (Evidence Lock)
    if (task.photo && task.status !== "revision") {
      toast.error("Sistem Keamanan: Bukti foto tugas telah tersegel permanen oleh database.");
      return;
    }
    setSelectedTask(task);
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setSelectedTask(null);
  };

  // LOGIC SUBMIT API
  const handleSubmitReport = async (submittedData) => {
    // Menggunakan ID dari selectedTask lebih aman daripada extract dari parameter data
    const taskId = selectedTask?.id; 
    
    if (!taskId) {
      toast.error("Gagal mengirim laporan: ID tugas tidak ditemukan.");
      return;
    }

    // Otomatis konversi ke FormData jika data dari modal berupa Object literal
    let payload = submittedData;
    if (!(submittedData instanceof FormData)) {
      payload = new FormData();
      Object.keys(submittedData).forEach(key => payload.append(key, submittedData[key]));
    }
    
    // Spoofing method PUT untuk upload form-data khusus di Laravel
    if (!payload.has("_method")) {
      payload.append("_method", "PUT");
    }

    try {
      await api.post(`/daily-tasks/${taskId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Laporan tugas berhasil dikirim!");
      handleCloseCamera();
      fetchTasks();
    } catch (error) {
      console.error("Gagal mengirim laporan:", error);
      toast.error(error.response?.data?.message || "Gagal mengirim laporan tugas. Pastikan bukti belum pernah diunggah.");
    }
  };

  // LOGIC ACC TEMEN YANG DI-TAG API
  const handleConfirmTask = async (taskId) => {
    try {
      await api.put(`/daily-tasks/${taskId}/confirm`);
      toast.success("Berhasil konfirmasi tugas rekan!");
      fetchTasks();
    } catch (error) {
      console.error("Gagal konfirmasi:", error);
      toast.error("Gagal mengkonfirmasi tugas rekan.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-1 max-w-5xl mx-auto">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-sky-900/10 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          
          <div className="flex-1 relative z-10 flex flex-col justify-center py-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/50">
                <i className="fa-solid fa-clipboard-check text-xl"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest mb-0.5">Logbook Harian</span>
                <span className="text-white text-sm font-medium flex items-center gap-1.5">
                  Halo, {(currentUser?.name || "Brok").split(" ")[0]}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-sky-200 drop-shadow-sm">
              Tasks
            </h1>
            <div className="text-sky-100/80  border-l-[3px] border-sky-500/50">
              <p className="text-[14px] text-sky-100/80 font-medium max-w-xl leading-relaxed border-l-[3px] border-sky-500/50 pl-4">
                Selesaikan daftar tugas harian Anda dan lampirkan bukti pelaksanaan. Pastikan semua tugas tercatat dengan baik dalam logbook.
              </p>
            </div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-7 rounded-3xl w-full md:w-[340px] shrink-0 shadow-2xl relative overflow-hidden group hover:bg-white/[0.08] transition-colors duration-500">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest mb-1">Progress Harian</p>
                <p className="text-xs font-medium text-slate-400">Total {loading ? "..." : totalTasks} Tugas</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-sky-400">
                <i className="fa-solid fa-chart-pie"></i>
              </div>
            </div>
            <div className="relative z-10 flex items-end gap-2 mb-4">
               <h3 className="text-6xl font-black text-sky-400 leading-none tracking-tighter drop-shadow-md">{loading ? 0 : progressPercent}%</h3>
            </div>
            <div className="relative z-10 w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-sky-500 to-sky-300 rounded-full relative transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}>
                <div className="absolute top-0 right-0 w-4 h-full bg-white/50 rounded-full blur-[2px]"></div>
              </div>
            </div>
            <p className="relative z-10 text-[11px] font-medium text-white/60 mt-4 text-right">
              <span className="font-bold text-white">{loading ? "..." : completedTasks}</span> dari {loading ? "..." : totalTasks} Selesai
            </p>
          </div>
        </div>
      </div>

      {/* PAPAN TUGAS REGULER */}
      <div className="bg-slate-50/50 p-2 sm:p-4 rounded-[2rem] border border-slate-100 shadow-inner mb-8">
        <div className="flex items-center gap-3 mb-5 border-b border-slate-200/60 pb-3 pl-2 pt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-blue-500">
             <i className="fa-solid fa-desktop text-sm"></i>
          </div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Rutinitas Harian</h2>
        </div>
        <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-center text-sm font-bold text-slate-400 py-8"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memuat tugas harian...</p>
            ) : regularTasks.length === 0 ? (
              <p className="text-center text-sm font-bold text-slate-400 py-8">Belum ada tugas rutinitas hari ini.</p>
            ) : (
              regularTasks.map((task, index) => (
                <InternTaskCard 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  onOpenCameraModal={handleOpenCamera} 
                  onConfirmTask={handleConfirmTask}
                  currentUserId={currentUser.id}
                />
              ))
            )}
        </div>
      </div>

      {/* PAPAN TUGAS URGENT */}
        {!loading && urgentTasks.length > 0 && (
        <div className="bg-rose-50/30 p-2 sm:p-4 rounded-[2rem] border border-rose-100 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-4 border-b border-rose-200/60 pb-3 pl-2 pt-1">
            <i className="fa-solid fa-bolt text-rose-500 animate-pulse text-lg"></i>
            <h2 className="text-sm font-black text-rose-600 uppercase tracking-widest leading-none">Tugas Tambahan (Urgent)</h2>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
            {urgentTasks.map((task, index) => (
              <InternTaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onOpenCameraModal={handleOpenCamera} 
                onConfirmTask={handleConfirmTask}
                currentUserId={currentUser.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* RENDER MODAL KAMERA */}
      {isCameraOpen && selectedTask && (
        <LiveCameraModal task={selectedTask} currentUser={currentUser} onClose={handleCloseCamera} onSubmit={handleSubmitReport} />
      )}

    </div>
  );
};

export default InternTasks;