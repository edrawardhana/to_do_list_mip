// Pages/Tasks.jsx
import React, { useEffect, useState } from "react"; // Tambahkan useState
import { useAuth } from "../contexts/AuthContext";
import CameraModal from "../components/CameraModal"; // Import komponen kamera Anda

const Tasks = ({ allowCamera = true }) => {
  const { user, isIntern, loading } = useAuth();

  // --- TAMBAHKAN STATE BARU DI SINI ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fungsi untuk membuka modal kamera
  const handleOpenCamera = (task) => {
    setSelectedTask(task);
    setIsCameraOpen(true);
  };

  // Data Dummy (Nanti bisa diganti dengan data dari Supabase)
  const taskList = [
    {
      id: 1,
      name: "Cek Kebersihan Lab",
      status: "Success",
      proofImg: null,
      hasDescription: true,
      descText: "Lab sudah dibersihkan",
      isRejected: false,
    },
    {
      id: 2,
      name: "Update Stok Kabel LAN",
      status: "In Progress",
      proofImg: "https://via.placeholder.com/150",
      hasDescription: false,
      descText: "",
      isRejected: false,
    },
    {
      id: 3,
      name: "Perbaikan PC Admin",
      status: "Error",
      proofImg: null,
      hasDescription: false,
      descText: "",
      isRejected: true,
    },
  ];

  if (loading)
    return (
      <div className="p-4 text-center animate-pulse">
        Menyiapkan daftar tugas...
      </div>
    );

  return (
    <div className="w-full space-y-4">
      {/* Header Tabel */}
      <div className="grid grid-cols-12 px-8 py-2 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
        <div className="col-span-1">No</div>
        <div className="col-span-3">Task Name</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-3 text-center">Proof Image</div>
        <div className="col-span-3 text-center">Deskripsi</div>
      </div>

      {/* Body Tabel */}
      {taskList.map((task, index) => (
        <div
          key={task.id}
          className="grid grid-cols-12 items-center bg-white px-8 py-4 rounded-full shadow-sm border border-slate-50 relative group hover:border-indigo-100 transition-all"
        >
          <div className="col-span-1 font-black text-[#1b254b]">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="col-span-3">
            <p className="font-bold text-[#1b254b] text-sm truncate pr-4">
              {task.name}
            </p>
          </div>
          <div className="col-span-2 flex justify-center">
            <span
              className={`text-[10px] font-black uppercase px-4 py-1 rounded-full italic tracking-tighter ${task.status === "Success" ? "bg-emerald-50 text-emerald-500" : task.status === "Error" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-400"}`}
            >
              {task.status}
            </span>
          </div>

          <div className="col-span-3 flex items-center justify-center gap-3">
            {task.proofImg ? (
              <img
                src={task.proofImg}
                alt="proof"
                className="w-14 h-9 object-cover rounded-lg border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-14 h-9 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <i className="fa-regular fa-image text-xs"></i>
              </div>
            )}

            {(isIntern || user?.role === "user") && allowCamera && (
              <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                <button
                  type="button"
                  // --- PERBAIKAN: Panggil fungsi handleOpenCamera, bukan alert ---
                  onClick={() => handleOpenCamera(task)}
                  className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                >
                  <i className="fa-solid fa-camera text-sm"></i>
                </button>
              </div>
            )}
          </div>

          {/* ... (Sisa kolom deskripsi tetap sama) ... */}
        </div>
      ))}

      {/* --- RENDER MODAL DI SINI (Di luar loop map) --- */}
      {isCameraOpen && (
        <CameraModal
          task={selectedTask}
          onClose={() => setIsCameraOpen(false)}
          onRefresh={() => window.location.reload()} // Refresh halaman setelah upload sukses
        />
      )}
    </div>
  );
};

export default Tasks;
