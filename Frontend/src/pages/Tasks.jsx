import React from "react";

const Tasks = () => {
  // Data dummy sesuai dengan desain di gambar
  const taskList = [
    {
      id: 1,
      name: "Menyalakan CPG",
      status: "Completed",
      proofImg: "https://via.placeholder.com/150", // Ganti dengan path gambar asli
      hasDescription: true,
      descText: "anfdskjfdasknfjkdsf",
    },
    {
      id: 2,
      name: "Menyalakan TV",
      status: "On Progress",
      proofImg: null,
      hasDescription: false,
    },
    {
      id: 3,
      name: "Menyalakan Didesign",
      status: "Share Task (Bagas)",
      proofImg: "https://via.placeholder.com/150",
      hasDescription: false,
      isShared: true,
    },
    {
      id: 4,
      name: "Menyalakan Didesign",
      status: "On Progress",
      proofImg: "https://via.placeholder.com/150",
      hasDescription: false,
      isRejected: true,
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-12 px-8 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
        <div className="col-span-1">No</div>
        <div className="col-span-3">Task Name</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-3 text-center">Proof Image</div>
        <div className="col-span-3 text-center">Deskripsi</div>
      </div>

      {/* Task Rows */}
      {taskList.map((task, index) => (
        <div
          key={task.id}
          className="grid grid-cols-12 items-center bg-white px-8 py-4 rounded-full shadow-sm border border-slate-50 hover:shadow-md transition-all duration-300"
        >
          {/* No */}
          <div className="col-span-1 text-slate-500 font-bold">
            {index + 1}.
          </div>

          {/* Task Name */}
          <div className="col-span-3 text-[#1b254b] font-black text-sm">
            {task.name}
          </div>

          {/* Status Section */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            {task.status === "Completed" ? (
              <>
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <i className="fa-solid fa-check text-[10px]"></i>
                </div>
                <span className="text-[8px] font-black text-emerald-500 mt-1 uppercase">
                  Completed
                </span>
              </>
            ) : task.isShared ? (
              <>
                <div className="w-6 h-6 bg-sky-400 rounded-full flex items-center justify-center text-white">
                  <i className="fa-solid fa-users text-[10px]"></i>
                </div>
                <span className="text-[8px] font-black text-sky-400 mt-1 uppercase text-center">
                  Share Task (Bagas)
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </div>
                <span className="text-[8px] font-black text-orange-500 mt-1 uppercase">
                  On Progress
                </span>
              </>
            )}
          </div>

          {/* Proof Image Section */}
          <div className="col-span-3 flex items-center justify-center gap-4">
            {task.proofImg ? (
              <div className="relative group">
                <img
                  src={task.proofImg}
                  alt="proof"
                  className="w-14 h-9 object-cover rounded-lg border border-slate-100 shadow-sm"
                />
                {task.isRejected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                )}
              </div>
            ) : (
              <div className="w-14 h-9 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <i className="fa-regular fa-image text-sm"></i>
              </div>
            )}

            <div className="flex gap-1">
              <button className="w-8 h-8 bg-[#f4f7fe] text-[#4318ff] rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors">
                <i className="fa-solid fa-camera text-xs"></i>
              </button>
              <button className="w-8 h-8 bg-[#f4f7fe] text-red-500 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                <i className="fa-solid fa-rotate text-xs"></i>
              </button>
            </div>
          </div>

          {/* Deskripsi Section */}
          <div className="col-span-3 flex items-center justify-center">
            {task.hasDescription ? (
              <div className="bg-white border-2 border-slate-800 px-6 py-2 rounded-full text-[10px] font-black text-[#1b254b] max-w-full truncate">
                {task.descText}
              </div>
            ) : (
              <button className="w-10 h-10 text-slate-400 hover:text-[#1b254b] transition-colors">
                <i className="fa-solid fa-pen-to-square text-lg"></i>
              </button>
            )}
          </div>

          {/* Label Error jika ditolak */}
          {task.isRejected && (
            <div className="absolute left-1/2 -bottom-2 translate-y-full">
              <p className="text-[8px] text-red-500 font-black italic uppercase">
                Laporan Ditolak!, Perbaiki!
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Tasks;
