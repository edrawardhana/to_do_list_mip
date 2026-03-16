import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Whitebook = () => {
  const { user } = useAuth();

  // Cek apakah user adalah Admin/Super Admin
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const materials = [
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
      steps: [
        "Pastikan menyalakan PC 1 dulu.",
        "Tunggu PC nyala dan masuk ke aplikasi......",
      ],
      type: "TUTORIAL",
      borderColor: "border-orange-500",
      tagBg: "bg-orange-100 text-orange-600",
    },
    {
      id: 3,
      title: "Tutorial Setup VR",
      description: "Langkah-langkah setup VR",
      steps: [
        "Pastikan menyalakan TV dulu.",
        "Nyalakan VR, pastikan baterai..........",
      ],
      type: "TUTORIAL",
      borderColor: "border-orange-500",
      tagBg: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black text-[#5e6681] uppercase tracking-tight">
          Whitebook
        </h1>
      </div>

      {isAdmin ? (
        /* ================= TAMPILAN ADMIN ================= */
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1b254b] uppercase tracking-tight">
                Manajemen Materi Belajar
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2 rounded-xl shadow-lg shadow-blue-200 transition-all text-sm">
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
                      <td className="py-4 px-2 text-center flex justify-center gap-2">
                        <button className="text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button className="text-red-500 hover:underline">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAMPILAN INTERN ================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {materials.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-[2rem] p-10 shadow-sm border-l-[14px] ${item.borderColor} relative transition-all hover:shadow-md`}
            >
              <div className="absolute top-8 right-8">
                <span
                  className={`${item.tagBg} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}
                >
                  {item.type}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1b254b] leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm font-bold mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {item.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 text-sm text-slate-500 font-medium leading-relaxed"
                    >
                      <span className="font-bold text-[#1b254b]">
                        {idx + 1}.
                      </span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button className="text-[#1b254b] text-xs font-black underline hover:opacity-70 transition-opacity">
                    Baca Selengkapnya...
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Whitebook;
