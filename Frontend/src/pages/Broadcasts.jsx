import { useState } from "react";

const Broadcasts = () => {
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 1,
      message: "Evaluasi bulanan intern Jumat ini pukul 10.00 WIB",
      target: "Semua Divisi",
      date: "2024-03-04",
      author: "Admin",
    },
    {
      id: 2,
      message: "Pengingat pengisian logbook harian",
      target: "Divisi UI/UX",
      date: "2024-03-03",
      author: "SuperAdmin",
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ message: "", target: "all" });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulasi tambah broadcast
    const newBroadcast = {
      id: broadcasts.length + 1,
      message: form.message,
      target: form.target === "all" ? "Semua Divisi" : `Divisi ${form.target}`,
      date: new Date().toISOString().split("T")[0],
      author: "Admin",
    };
    setBroadcasts([newBroadcast, ...broadcasts]);
    setShowModal(false);
    setForm({ message: "", target: "all" });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Broadcast</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Buat Broadcast
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Pesan
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Target
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Tanggal
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Penulis
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {broadcasts.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm">{item.message}</td>
                <td className="px-6 py-4 text-sm">{item.target}</td>
                <td className="px-6 py-4 text-sm">{item.date}</td>
                <td className="px-6 py-4 text-sm">{item.author}</td>
                <td className="px-6 py-4">
                  <button className="text-indigo-600 hover:text-indigo-800 mr-3">
                    <i className="fa-regular fa-pen-to-square"></i>
                  </button>
                  <button className="text-rose-600 hover:text-rose-800">
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Broadcast */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Buat Broadcast Baru
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Pesan
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  rows="4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Tulis pesan broadcast..."
                  required
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Target
                </label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">Semua Divisi</option>
                  <option value="UI/UX">Divisi UI/UX</option>
                  <option value="Media">Divisi Media</option>
                  <option value="Marketing">Divisi Marketing</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Kirim
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
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

export default Broadcasts;
