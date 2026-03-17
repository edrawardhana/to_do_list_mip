import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Whitebook = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([
    {
      id: 1,
      title: "Standar Operasional CPG",
      description: "Langkah-langkah menghidupkan CPG",
      steps: ["Pastikan menyalakan proyektor sebelum....."],
      type: "SOP",
      borderColor: "border-indigo-900",
      tagBg: "bg-indigo-100 text-indigo-600",
    },
    {
      id: 2,
      title: "Tutorial Setup 2 PC 1 Monitor",
      description: "Langkah-langkah setup 1 monitor dengan 2 PC",
      steps: ["Pastikan menyalakan PC 1 dulu."],
      type: "TUTORIAL",
      borderColor: "border-orange-500",
      tagBg: "bg-orange-100 text-orange-600",
    },
  ]);

  // State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState({
    id: null,
    title: "",
    description: "",
    type: "SOP",
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // --- HANDLERS ---
  const openModal = (
    data = { id: null, title: "", description: "", type: "SOP" },
  ) => {
    setCurrentData(data);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus materi ini?")) {
      setMaterials(materials.filter((m) => m.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (currentData.id) {
      // Logic Edit
      setMaterials(
        materials.map((m) =>
          m.id === currentData.id ? { ...m, ...currentData } : m,
        ),
      );
    } else {
      // Logic Tambah
      const newMateri = {
        ...currentData,
        id: Date.now(),
        steps: ["Langkah default..."],
        borderColor:
          currentData.type === "SOP"
            ? "border-indigo-900"
            : "border-orange-500",
        tagBg:
          currentData.type === "SOP"
            ? "bg-indigo-100 text-indigo-600"
            : "bg-orange-100 text-orange-600",
      };
      setMaterials([...materials, newMateri]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 animate-in fade-in duration-500 relative">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black text-[#5e6681] uppercase tracking-tight">
          Whitebook
        </h1>
      </div>

      {isAdmin ? (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1b254b] uppercase tracking-tight">
                Manajemen Materi
              </h2>
              <button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2 rounded-xl text-sm transition-all active:scale-95"
              >
                + Tambah Materi
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4 px-2">Judul Materi</th>
                    <th className="pb-4 px-2">Tipe</th>
                    <th className="pb-4 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-[#1b254b]">
                  {materials.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-2">{item.title}</td>
                      <td className="py-4 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black ${item.tagBg}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openModal(item)}
                            className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-50 text-red-500 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tampilan Intern (Sama seperti sebelumnya) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {materials.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-[2rem] p-10 shadow-sm border-l-[14px] ${item.borderColor} relative transition-all hover:shadow-md`}
            >
              {/* Konten Kartu */}
              <h3 className="text-2xl font-black text-[#1b254b]">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm font-bold mt-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-[#1b254b] uppercase mb-6">
              {currentData.id ? "Edit Materi" : "Tambah Materi"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">
                  Judul
                </label>
                <input
                  type="text"
                  required
                  value={currentData.title}
                  onChange={(e) =>
                    setCurrentData({ ...currentData, title: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">
                  Tipe
                </label>
                <select
                  value={currentData.type}
                  onChange={(e) =>
                    setCurrentData({ ...currentData, type: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SOP">SOP</option>
                  <option value="TUTORIAL">TUTORIAL</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-3 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whitebook;
