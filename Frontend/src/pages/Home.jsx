import { useState, useEffect } from "react";
import api from "../api/axios"; // Gunakan axios instance kita, bukan supabase langsung
import CameraModal from "../components/CameraModal";

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data dari tabel daily_tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Panggil endpoint backend Laravel (otomatis bawa token JWT)
      const response = await api.get('/daily-tasks');
      
      // Sesuaikan dengan bentuk JSON dari backend (biasanya dibungkus dalam 'data')
      setTasks(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Gagal memuat tugas harian:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Fungsi untuk Admin mengevaluasi (Approve/Reject) tugas
  const handleEvaluate = async (taskId, newStatus) => {
    let reason = null;
    if (newStatus === 'rejected') {
      reason = prompt("Masukkan alasan penolakan (opsional):");
      if (reason === null) return; // Batal jika admin menekan 'Cancel'
    }

    try {
      await api.put(`/daily-tasks/${taskId}`, {
        status: newStatus,
        reject_reason: reason
      });
      fetchTasks(); // Refresh tabel setelah diupdate
    } catch (error) {
      console.error("Gagal mengevaluasi tugas:", error);
      alert("Gagal menyimpan evaluasi. Pastikan Anda memiliki hak akses Admin.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-[#0A065D] tracking-tight uppercase">
          MCC INTERNSHIP
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Widget Statistik Ringkas (Opsional) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
            Total Task
          </p>
          <p className="text-3xl font-black text-[#0A065D]">{tasks.length}</p>
        </div>
        {/* Tambahkan card lain di sini jika perlu */}
      </div>

      {/* Daily Task Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-[#0A065D]">Daily Task</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-slate-50 border-none rounded-full px-6 py-2 text-xs font-bold w-64 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-300 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="pb-4 text-left px-4">No</th>
                <th className="pb-4 text-left">Task Name</th>
                <th className="pb-4 text-center">Status</th>
                <th className="pb-4 text-left">Progress</th>
                <th className="pb-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-600">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">Belum ada tugas hari ini.</td>
                </tr>
              ) : (
                tasks.map((task, index) => (
                  <tr key={task.id} className="border-b border-slate-50">
                    <td className="py-6 px-4">{index + 1}.</td>
                    <td>
                      <div className="font-black text-slate-800 text-sm mb-1">
                        {task.task_name || task.template?.title || task.template?.task_name || task.description || "Tugas Harian"}
                      </div>
                      
                      {/* Catatan / Instruksi Tugas dari Admin */}
                      {(task.assign_note || task.template?.description) && (
                        <div className="text-[10px] text-slate-500 font-medium italic leading-relaxed max-w-xs mt-1">
                          "{task.assign_note || task.template?.description}"
                        </div>
                      )}
                      
                      {/* Label Indikator Tugas Urgent (Dadakan) */}
                      {task.template_id === null && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-black">
                            <i className="fa-solid fa-bolt mr-1"></i> Urgent
                          </span>
                          {task.due_date && (
                            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                              Due: {new Date(task.due_date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-center">
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          task.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          task.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                         {task.status}
                       </span>
                       
                       {/* Tampilkan Alasan Reject jika ada */}
                       {task.status === 'rejected' && task.reject_reason && (
                         <div className="text-[9px] text-rose-500 mt-1 italic max-w-[120px] mx-auto leading-tight">
                           "{task.reject_reason}"
                         </div>
                       )}
                    </td>
                    <td>
                      {task.evidence_url ? (
                        <a href={task.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors">
                          <i className="fa-solid fa-image"></i> Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-slate-400">Menunggu</span>
                      )}
                    </td>
                    <td className="text-center">
                      {/* Tampilkan tombol Kamera HANYA JIKA belum ada bukti foto (untuk Intern) */}
                      {!task.evidence_url && (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowCamera(true);
                          }}
                          title="Upload Bukti"
                          className="w-10 h-10 rounded-2xl bg-[#0A065D] text-white flex items-center justify-center mx-auto transition-transform hover:scale-105"
                        >
                          <i className="fa-solid fa-camera"></i>
                        </button>
                      )}
                      
                      {/* Tampilkan tombol Approve/Reject JIKA sudah ada bukti foto & status masih pending (untuk Admin) */}
                      {task.evidence_url && task.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEvaluate(task.id, 'approved')} title="Approve Tugas" className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform hover:scale-110 hover:bg-emerald-500 hover:text-white">
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button onClick={() => handleEvaluate(task.id, 'rejected')} title="Reject Tugas" className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center transition-transform hover:scale-110 hover:bg-rose-500 hover:text-white">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      )}

                      {/* Indikator Terkunci jika tugas sudah selesai dievaluasi */}
                      {task.evidence_url && task.status !== 'pending' && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Evaluated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Camera Modal */}
      {showCamera && (
        <CameraModal
          task={selectedTask}
          onClose={() => setShowCamera(false)}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
};

export default Home;
