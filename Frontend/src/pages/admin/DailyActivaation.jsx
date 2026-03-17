import React, { useState } from "react";

const DailyActivation = () => {
  // Mengubah ke state agar data bisa bertambah secara dinamis
  const [internTasks, setInternTasks] = useState([
    {
      id: 1,
      name: "Nabil P",
      division: "IT Support",
      shift: "MORNING",
      task: "Menyalakan CPG",
      progress: 100,
      status: "Done",
    },
    {
      id: 2,
      name: "Bagas",
      division: "IT Support",
      shift: "AFTERNOON",
      task: "Mematikan CPG",
      progress: 60,
      status: "In Progress",
    },
    {
      id: 3,
      name: "Edra",
      division: "IT Support",
      shift: "MORNING",
      task: "Menghidupkan TV",
      progress: 100,
      status: "Done",
    },
  ]);

  // State untuk kontrol Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    task: "",
    shift: "MORNING",
    division: "IT Support",
  });

  // Fungsi Tambah Task
  const handleSaveTask = (e) => {
    e.preventDefault();
    const taskToAdd = {
      id: Date.now(),
      ...newTask,
      progress: 0,
      status: "In Progress",
    };
    setInternTasks([taskToAdd, ...internTasks]);
    setIsModalOpen(false); // Tutup modal
    setNewTask({
      name: "",
      task: "",
      shift: "MORNING",
      division: "IT Support",
    }); // Reset form
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-[#1b254b] uppercase tracking-tight">
            Daily Task Monitoring
          </h2>
          {/* Tombol Tambah Task */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1b254b] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-800 transition-all active:scale-95 shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <span>+</span> Tambah Task
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="bg-white border border-slate-100 rounded-full py-2 px-10 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 shadow-sm"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-white p-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-300 italic text-[10px] uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="pb-4 px-4">No</th>
                <th className="pb-4 px-4">Intern Details</th>
                <th className="pb-4 px-4 text-center">Shift</th>
                <th className="pb-4 px-4">Task</th>
                <th className="pb-4 px-4">Progress</th>
                <th className="pb-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#1b254b] text-xs font-bold">
              {internTasks.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-6 px-4 text-slate-400">{index + 1}.</td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black">{item.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">
                          {item.division}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter shadow-sm ${
                        item.shift === "MORNING"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {item.shift}
                    </span>
                  </td>
                  <td className="py-6 px-4 font-medium text-slate-600 italic">
                    {item.task}
                  </td>
                  <td className="py-6 px-4 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${item.progress === 100 ? "bg-emerald-400" : "bg-amber-400"}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-500 transition-all border border-slate-100">
                      <i className="fa-solid fa-ellipsis"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL POPUP TAMBAH TASK --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1b254b]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 border border-white">
            <h2 className="text-2xl font-black text-[#1b254b] uppercase mb-8 tracking-tight">
              Assign New Task
            </h2>
            <form onSubmit={handleSaveTask} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Intern Name
                </label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Nabil P"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Task Description
                </label>
                <textarea
                  required
                  value={newTask.task}
                  onChange={(e) =>
                    setNewTask({ ...newTask, task: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Shift
                  </label>
                  <select
                    value={newTask.shift}
                    onChange={(e) =>
                      setNewTask({ ...newTask, shift: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none"
                  >
                    <option value="MORNING">MORNING</option>
                    <option value="AFTERNOON">AFTERNOON</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={newTask.division}
                    onChange={(e) =>
                      setNewTask({ ...newTask, division: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#1b254b] text-white font-black py-4 rounded-2xl hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
                >
                  SAVE TASK
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyActivation;
