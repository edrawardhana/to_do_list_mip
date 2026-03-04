import { useState } from "react";

const Divisions = () => {
  const [divisions, setDivisions] = useState([
    {
      id: 1,
      name: "UI/UX",
      description: "Desain antarmuka dan pengalaman pengguna",
      memberCount: 8,
    },
    {
      id: 2,
      name: "Media",
      description: "Produksi konten visual dan video",
      memberCount: 5,
    },
    {
      id: 3,
      name: "Marketing",
      description: "Strategi pemasaran dan riset",
      memberCount: 6,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const handleOpenModal = (division = null) => {
    if (division) {
      setEditing(division);
      setForm({ name: division.name, description: division.description });
    } else {
      setEditing(null);
      setForm({ name: "", description: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      // Update
      setDivisions(
        divisions.map((d) => (d.id === editing.id ? { ...d, ...form } : d)),
      );
    } else {
      // Create
      const newDiv = {
        id: divisions.length + 1,
        ...form,
        memberCount: 0,
      };
      setDivisions([...divisions, newDiv]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Yakin ingin menghapus divisi ini?")) {
      setDivisions(divisions.filter((d) => d.id !== id));
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Divisi</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Tambah Divisi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((div) => (
          <div
            key={div.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800">{div.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(div)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <i className="fa-regular fa-pen-to-square"></i>
                </button>
                <button
                  onClick={() => handleDelete(div.id)}
                  className="text-rose-600 hover:text-rose-800"
                >
                  <i className="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">{div.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                <i className="fa-regular fa-user mr-1"></i> {div.memberCount}{" "}
                anggota
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form Divisi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {editing ? "Edit Divisi" : "Tambah Divisi Baru"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Nama Divisi
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  {editing ? "Update" : "Simpan"}
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

export default Divisions;
