// Pages/Tasks.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import CameraModal from "../components/CameraModal";
import toast from "react-hot-toast"; // 1. Import toast

const Tasks = ({ allowCamera = true }) => {
  const { user, isIntern, loading } = useAuth();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fungsi untuk membuka modal kamera
  const handleOpenCamera = (task) => {
    // Cek status tugas sebelum buka kamera
    if (task.status === "Success") {
      return toast.error("Tugas ini sudah selesai!", {
        icon: "✅",
        style: { borderRadius: "12px", background: "#1b254b", color: "#fff" },
      });
    }

    setSelectedTask(task);
    setIsCameraOpen(true);
    toast.success(`Membuka kamera untuk: ${task.name}`, {
      duration: 2000,
      style: {
        borderRadius: "12px",
        background: "#1b254b",
        color: "#fff",
        fontSize: "12px",
      },
    });
  };

  // Data Dummy
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
      proofImg: null, // ← ganti dari via.placeholder.com/150 ke null
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
      <div className="p-4 text-center animate-pulse text-[#1b254b] font-bold">
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
          className="grid grid-cols-12 items-center bg-white px-8 py-4 rounded-full shadow-sm border border-slate-50 relative group hover:border-indigo-100 transition-all mb-3"
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
              className={`text-[10px] font-black uppercase px-4 py-1 rounded-full italic tracking-tighter ${
                task.status === "Success"
                  ? "bg-emerald-50 text-emerald-500"
                  : task.status === "Error"
                    ? "bg-red-50 text-red-500"
                    : "bg-orange-50 text-orange-400"
              }`}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {(isIntern || user?.role === "intern") && allowCamera && (
              <div className="flex animate-in fade-in zoom-in duration-300">
                <button
                  type="button"
                  onClick={() => handleOpenCamera(task)}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                    Open Kamera
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="col-span-3 text-center">
            <span className="text-xs text-slate-400 italic">
              No Description
            </span>
          </div>
        </div>
      ))}

      {isCameraOpen && (
        <CameraModal
          task={selectedTask}
          onClose={() => setIsCameraOpen(false)}
          onRefresh={() => {
            toast.success("Halaman diperbarui!");
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Tasks;
