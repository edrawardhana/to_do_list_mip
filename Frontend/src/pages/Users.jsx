import { useState } from "react";

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      full_name: "Ahmad Subardjo",
      email: "ahmad@example.com",
      role: "Intern",
      division: "UI/UX",
      shift: "Pagi",
      status: "Active",
      is_locked: false,
    },
    {
      id: 2,
      full_name: "Siti Aminah",
      email: "siti@example.com",
      role: "Admin",
      division: "Media",
      shift: "Pagi",
      status: "Active",
      is_locked: false,
    },
    {
      id: 3,
      full_name: "Budi Santoso",
      email: "budi@example.com",
      role: "Intern",
      division: "Marketing",
      shift: "Sore",
      status: "Active",
      is_locked: true,
    },
  ]);

  const toggleLock = (id) => {
    setUsers(
      users.map((u) => (u.id === id ? { ...u, is_locked: !u.is_locked } : u)),
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Nama
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Divisi
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Shift
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">
                  {user.full_name}
                </td>
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      user.role === "SuperAdmin"
                        ? "bg-purple-100 text-purple-600"
                        : user.role === "Admin"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{user.division}</td>
                <td className="px-6 py-4 text-sm">{user.shift}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      user.status === "Active"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleLock(user.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold mr-2 ${
                      user.is_locked
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                    }`}
                  >
                    {user.is_locked ? "Unlock" : "Lock"}
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-800 mr-2">
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
    </div>
  );
};

export default Users;
