import React, { useState } from "react";

const ManageAdmin = () => {
  // 1. State untuk daftar Admin
  const [admins, setAdmins] = useState([
    {
      id: 1,
      name: "Super User",
      email: "admin@mip.com",
      role: "super_admin",
      division: "IT Center",
    },
    {
      id: 2,
      name: "Admin IT",
      email: "staff@mip.com",
      role: "admin",
      division: "IT Support",
    },
  ]);

  // 2. State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState({
    id: null,
    name: "",
    email: "",
    role: "admin",
    division: "",
  });

  // --- HANDLERS ---

  const openModal = (
    admin = { id: null, name: "", email: "", role: "admin", division: "" },
  ) => {
    setCurrentAdmin(admin);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus akses admin ini?")) {
      setAdmins(admins.filter((a) => a.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (currentAdmin.id) {
      // Logic Update (Edit)
      setAdmins(
        admins.map((a) => (a.id === currentAdmin.id ? currentAdmin : a)),
      );
    } else {
      // Logic Create (Tambah Baru)
      setAdmins([...admins, { ...currentAdmin, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#1b254b] uppercase tracking-tight">
          Manage Admin
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          + Add New Admin
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-300 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="pb-4 px-4">Name</th>
                <th className="pb-4 px-4">Role</th>
                <th className="pb-4 px-4">Division</th>
                <th className="pb-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[#1b254b] text-sm font-bold">
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-5 px-4">
                    <div>
                      <p className="font-black">{admin.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {admin.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black ${admin.role === "super_admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {admin.role.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-slate-500">{admin.division}</td>
                  <td className="py-6 px-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                      {/* TOMBOL EDIT - BESAR & JELAS */}
                      <button
                        onClick={() => openModal(admin)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-90 transition-all shadow-xl shadow-blue-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="text-sm font-black uppercase tracking-widest">
                          Edit Admin
                        </span>
                      </button>

                      {/* TOMBOL DELETE - BESAR & JELAS */}
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 active:scale-90 transition-all shadow-xl shadow-red-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="text-sm font-black uppercase tracking-widest">
                          Hapus
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL FORM ADMIN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1b254b]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-[#1b254b] uppercase mb-8 tracking-tight">
              {currentAdmin.id ? "Edit Admin" : "Add New Admin"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={currentAdmin.name}
                  onChange={(e) =>
                    setCurrentAdmin({ ...currentAdmin, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={currentAdmin.email}
                  onChange={(e) =>
                    setCurrentAdmin({ ...currentAdmin, email: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Role
                  </label>
                  <select
                    value={currentAdmin.role}
                    onChange={(e) =>
                      setCurrentAdmin({ ...currentAdmin, role: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="admin">ADMIN</option>
                    <option value="super_admin">SUPER ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Division
                  </label>
                  <input
                    type="text"
                    required
                    value={currentAdmin.division}
                    onChange={(e) =>
                      setCurrentAdmin({
                        ...currentAdmin,
                        division: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase text-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmin;
