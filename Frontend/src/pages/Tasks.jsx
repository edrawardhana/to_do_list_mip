// Pages/Tasks.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext"; // Import ini

const Tasks = ({ allowCamera = true }) => {
  // Tambahkan prop allowCamera
  const { user } = useAuth(); // Ambil data user
  const isIntern = user?.role === "user"; // Cek apakah dia intern

  const taskList = [
    // ... data dummy tetap sama ...
  ];

  return (
    <div className="w-full space-y-4">
      {/* Table Header tetap sama */}
      <div className="grid grid-cols-12 px-8 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
        <div className="col-span-1">No</div>
        <div className="col-span-3">Task Name</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-3 text-center">Proof Image</div>
        <div className="col-span-3 text-center">Deskripsi</div>
      </div>

      {taskList.map((task, index) => (
        <div
          key={task.id}
          className="grid grid-cols-12 items-center bg-white px-8 py-4 rounded-full shadow-sm border border-slate-50 relative"
        >
          {/* ... Bagian No, Name, Status tetap sama ... */}

          {/* Proof Image Section - BAGIAN YANG DIUBAH */}
          <div className="col-span-3 flex items-center justify-center gap-4">
            {task.proofImg ? (
              <div className="relative group">
                <img
                  src={task.proofImg}
                  alt="proof"
                  className="w-14 h-9 object-cover rounded-lg border border-slate-100 shadow-sm"
                />
              </div>
            ) : (
              <div className="w-14 h-9 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <i className="fa-regular fa-image text-sm"></i>
              </div>
            )}

            {/* LOGIKA PEMBATASAN TOMBOL KAMERA */}
            {isIntern && allowCamera && (
              <div className="flex gap-1">
                <button className="w-8 h-8 bg-[#f4f7fe] text-[#4318ff] rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors">
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
                <button className="w-8 h-8 bg-[#f4f7fe] text-red-500 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                  <i className="fa-solid fa-rotate text-xs"></i>
                </button>
              </div>
            )}
          </div>

          {/* Deskripsi Section - JUGA DIBATASI */}
          <div className="col-span-3 flex items-center justify-center">
            {task.hasDescription ? (
              <div className="bg-white border-2 border-slate-800 px-6 py-2 rounded-full text-[10px] font-black text-[#1b254b] max-w-full truncate">
                {task.descText}
              </div>
            ) : (
              // Tombol edit deskripsi hanya untuk Intern
              isIntern && (
                <button className="w-10 h-10 text-slate-400 hover:text-[#1b254b] transition-colors">
                  <i className="fa-solid fa-pen-to-square text-lg"></i>
                </button>
              )
            )}
          </div>

          {/* ... Label Error ditolak tetap sama ... */}
        </div>
      ))}
    </div>
  );
};

export default Tasks;
