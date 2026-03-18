import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Pastikan file ini sudah ada
import CameraModal from "../components/CameraModal";

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data dari tabel daily_tasks
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-[#0A065D] tracking-tight uppercase">
          MCC INTERNSHIP ADMINISTRATION
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
              {/* BARIS DUMMY UNTUK TEST */}
              <tr className="border-b border-slate-50">
                <td className="py-6 px-4">1.</td>
                <td className="font-black text-slate-800">
                  Tugas Uji Coba Kamera
                </td>
                <td className="text-center">New</td>
                <td>Progress 0%</td>
                <td className="text-center">
                  <button
                    onClick={() => {
                      setSelectedTask({
                        id: "dummy-1",
                        task_name: "Test",
                        created_at: new Date().toISOString(),
                      });
                      setShowCamera(true);
                    }}
                    className="w-10 h-10 rounded-2xl bg-[#0A065D] text-white flex items-center justify-center mx-auto"
                  >
                    <i className="fa-solid fa-camera"></i>
                  </button>
                </td>
              </tr>
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
