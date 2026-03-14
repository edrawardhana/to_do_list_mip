import React, { useState } from "react";

const Approval = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Data dummy sesuai desain Figma
  const dailyTasks = [
    {
      id: 1,
      name: "Nabil P",
      task: "Menghidupkan TV",
      time: "08.21",
      img: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Nabil P + 4 Org",
      task: "Menghidupkan CPG",
      time: "08.06",
      img: "https://via.placeholder.com/150",
    },
  ];

  const permissions = [
    {
      id: 1,
      name: "Nabil P",
      date: "01/03/2026",
      type: "Sakit",
      color: "bg-red-500",
    },
    {
      id: 2,
      name: "Bagas",
      date: "01/03/2026",
      type: "Izin",
      color: "bg-orange-500",
    },
    {
      id: 3,
      name: "Edra",
      date: "01/03/2026",
      type: "SWAP_SHIFT",
      color: "bg-sky-500",
    },
  ];

  const handleVerify = (item) => {
    setSelectedTask(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* JUDUL HALAMAN */}
      <h2 className="text-4xl font-black text-slate-400/20 text-center uppercase tracking-tighter">
        Approval
      </h2>

      {/* TABEL 1: PENGAJUAN DAILY TASK */}
      <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-white">
        <h3 className="text-[#434f8b] font-black mb-8 text-lg uppercase tracking-tight">
          Pengajuan Daily Task
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-300 italic text-xs border-b border-slate-50 uppercase">
              <tr>
                <th className="pb-4 px-4 font-medium">Intern</th>
                <th className="pb-4 px-4 font-medium">Tugas</th>
                <th className="pb-4 px-4 text-center font-medium">
                  Waktu Upload
                </th>
                <th className="pb-4 px-4 text-center font-medium">
                  Bukti Foto
                </th>
                <th className="pb-4 px-4 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[#1b254b] text-xs font-bold">
              {dailyTasks.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-6 px-4">{row.name}</td>
                  <td className="py-6 px-4 font-semibold text-slate-500 italic">
                    {row.task}
                  </td>
                  <td className="py-6 px-4 text-center font-normal text-slate-400">
                    {row.time}
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button className="text-sky-400 italic underline underline-offset-4 hover:text-sky-600">
                      Lihat Foto
                    </button>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button
                      onClick={() => handleVerify(row)}
                      className="bg-[#0b1437] text-white px-8 py-2 rounded-full text-[10px] font-black uppercase hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL 2: IZIN/SAKIT */}
      <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-white">
        <h3 className="text-[#434f8b] font-black mb-8 text-lg uppercase tracking-tight">
          Pengajuan Izin/Sakit/Swap Shift
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="text-slate-300 italic border-b border-slate-50 uppercase">
              <tr>
                <th className="pb-4 px-4 font-medium">Intern</th>
                <th className="pb-4 px-4 font-medium">Tanggal</th>
                <th className="pb-4 px-4 font-medium">Pengajuan</th>
                <th className="pb-4 px-4 text-center font-medium">
                  Bukti Foto
                </th>
                <th className="pb-4 px-4 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="py-6 px-4">{row.name}</td>
                  <td className="py-6 px-4 font-normal text-slate-400">
                    {row.date}
                  </td>
                  <td className="py-6 px-4">
                    <span
                      className={`${row.color} text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center text-sky-400 underline italic cursor-pointer">
                    Lihat Foto
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button
                      onClick={() => handleVerify(row)}
                      className="bg-[#0b1437] text-white px-8 py-2 rounded-full text-[10px] font-black uppercase"
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VERIFIKASI (Sesuai Desain Figma Pop-up) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 flex justify-between items-center border-b border-slate-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <h4 className="text-xl font-black text-[#1b254b] uppercase tracking-tighter">
                Verifikasi Daily Task
              </h4>
              <div className="w-6"></div> {/* Spacer */}
            </div>

            <div className="p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2">
                <img
                  src="https://via.placeholder.com/300x200"
                  alt="Bukti"
                  className="w-full h-48 object-cover rounded-3xl border border-slate-100 shadow-inner"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase">
                  Alasan
                </label>
                <textarea
                  className="w-full h-32 bg-slate-50 rounded-2xl p-4 text-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Tambahkan catatan jika perlu..."
                ></textarea>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 flex gap-4">
              <button className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
                Approve
              </button>
              <button className="flex-1 bg-orange-500 text-white py-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
