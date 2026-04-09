import React, { useState } from "react";
import InternTaskCard from "../../components/ui/InternTaskCard";
import LiveCameraModal from "../../components/ui/LiveCameraModal";
import { useAuth } from "../../contexts/AuthContext";

const InternTasks = () => {
  const { user } = useAuth();
  
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.user_metadata?.division || "IT Support"
  } : { id: "1", name: "Kiel", division: "IT Support" };

  const [selectedTask, setSelectedTask] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // DUMMY DATA KOMPLIT SEMUA SKENARIO (Termasuk yang udah selesai & yang nunggu konfirmasi)
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: "Update Software PC Admin", 
      location: "Lantai 2 - MCC", 
      status: "completed", // CONTOH SELESAI
      admin_notes: "", 
      is_urgent: false, 
      photo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200", 
      tagged_users: [] 
    },
    { 
      id: 2, 
      title: "Cek Jaringan Router Lantai 3", 
      location: "Lantai 3 - MCC", 
      status: "waiting_confirmation", // CONTOH DI-TAG TEMEN
      admin_notes: "", 
      is_urgent: false, 
      photo: null, 
      inviter_name: "Edra Maulana", 
      tagged_users: [{ id: "1", has_confirmed: false }] // ID "1" itu Kiel (User saat ini)
    },
    { 
      id: 3, 
      title: "Setup Proyektor Ruang Rapat", 
      location: "Lantai 4 - MCC", 
      status: "revision", // CONTOH REVISI
      admin_notes: "Foto kurang terang dek, tolong jepret ulang bagian kabel HDMI-nya ya.", 
      is_urgent: false, 
      photo: null, 
      tagged_users: [] 
    },
    { 
      id: 4, 
      title: "Bantu Angkat Server Baru", 
      location: "Ruang Server", 
      status: "todo", // CONTOH URGENT
      admin_notes: "", 
      is_urgent: true, 
      photo: null, 
      tagged_users: [] 
    },
  ]);

  const regularTasks = tasks.filter(t => !t.is_urgent);
  const urgentTasks = tasks.filter(t => t.is_urgent);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 0;

  const handleOpenCamera = (task) => {
    setSelectedTask(task);
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setSelectedTask(null);
  };

  // LOGIC SUBMIT & ROLLBACK
  const handleSubmitReport = async (formData) => {
    const taskId = parseInt(formData.get("task_id"));
    const taggedIds = JSON.parse(formData.get("tagged_user_ids"));
    
    // Anggap foto kekirim ke backend, kita simpen lokal sbg objectURL
    const fakePhotoUrl = URL.createObjectURL(formData.get("photo"));

    // Ubah ke waiting_confirmation
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { 
        ...t, 
        status: "waiting_confirmation", 
        inviter_name: currentUser.name,
        photo: fakePhotoUrl,
        tagged_users: taggedIds.map(id => ({ id, has_confirmed: id === currentUser.id })) // Inviter otomatis true
      } : t
    ));

    handleCloseCamera();

    // ROLLBACK SIMULATOR (Dibuat 10 detik buat ngetes, aslinya 600000ms / 10 menit)
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId && t.status === "waiting_confirmation") {
          // Kalo setelah timeout statusnya masih nunggu, balikin ke TODO
          console.log(`Rollback Tugas ${t.id} karena rekan tidak konfirmasi.`);
          return { ...t, status: "todo", photo: null, tagged_users: [] };
        }
        return t;
      }));
    }, 10000); 
  };

  // LOGIC ACC TEMEN YANG DI-TAG
  const handleConfirmTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newTags = t.tagged_users.map(u => 
          u.id === currentUser.id ? { ...u, has_confirmed: true } : u
        );
        const allConfirmed = newTags.every(u => u.has_confirmed === true);
        return { 
          ...t, 
          tagged_users: newTags, 
          status: allConfirmed ? "pending" : "waiting_confirmation" 
        };
      }
      return t;
    }));
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
                <p className="text-xs font-medium text-slate-400">Total {totalTasks} Tugas</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-sky-400">
                <i className="fa-solid fa-chart-pie"></i>
              </div>
            </div>
            <div className="relative z-10 flex items-end gap-2 mb-4">
               <h3 className="text-6xl font-black text-sky-400 leading-none tracking-tighter drop-shadow-md">{progressPercent}%</h3>
            </div>
            <div className="relative z-10 w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-sky-500 to-sky-300 rounded-full relative transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}>
                <div className="absolute top-0 right-0 w-4 h-full bg-white/50 rounded-full blur-[2px]"></div>
              </div>
            </div>
            <p className="relative z-10 text-[11px] font-medium text-white/60 mt-4 text-right">
              <span className="font-bold text-white">{completedTasks}</span> dari {totalTasks} Selesai
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
          {regularTasks.map((task, index) => (
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

      {/* PAPAN TUGAS URGENT */}
      {urgentTasks.length > 0 && (
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