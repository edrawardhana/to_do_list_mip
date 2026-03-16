import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Whitebook = () => {
  const { user } = useAuth();

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
      {/* HEADER: Mengikuti warna dan gaya desain (Tanpa Italic) */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black text-[#5e6681] uppercase tracking-tight">
          Whitebook
        </h1>
      </div>

      {/* GRID DAFTAR MATERI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {materials.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-[2rem] p-10 shadow-sm border-l-[14px] ${item.borderColor} relative transition-all hover:shadow-md`}
          >
            {/* TAG KATEGORI */}
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
                    <span className="font-bold text-[#1b254b]">{idx + 1}.</span>
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
    </div>
  );
};

export default Whitebook;
