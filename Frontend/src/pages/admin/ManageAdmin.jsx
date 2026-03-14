import React, { useState } from "react";

// Data Mock untuk daftar Admin
const MOCK_ADMINS = [
  {
    id: 1,
    name: "Bagas Satrio",
    email: "bagas@mcc.com",
    division: "IT Support",
    status: "active",
    lastLogin: "2 jam yang lalu",
  },
  {
    id: 2,
    name: "Siska Amelia",
    email: "siska@mcc.com",
    division: "Human Resources",
    status: "active",
    lastLogin: "1 hari yang lalu",
  },
  {
    id: 3,
    name: "Rizky Fauzi",
    email: "rizky@mcc.com",
    division: "Operation",
    status: "inactive",
    lastLogin: "5 hari yang lalu",
  },
];

const ManageAdmin = () => {
  const [admins, setAdmins] = useState(MOCK_ADMINS);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-4 lg:p-8 bg-[#f8faff] min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase">
            Manage Admin
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Control Center / Admin Management
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
          <i className="fa-solid fa-plus text-sm"></i>
          Add New Admin
        </button>
      </div>

      {/* Statistics Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Total Admin
          </p>
          <p className="text-3xl font-black text-indigo-950">{admins.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Active Now
          </p>
          <p className="text-3xl font-black text-emerald-500">2</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Pending Request
          </p>
          <p className="text-3xl font-black text-orange-400">0</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight text-center md:text-left">
            Admin List
          </h2>
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
            <input
              type="text"
              placeholder="Search admin name..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto p-4 md:p-8">
          <table className="w-full">
            <thead>
              <tr className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] text-left">
                <th className="pb-6 px-4">Name & Email</th>
                <th className="pb-6 px-4">Division</th>
                <th className="pb-6 px-4">Status</th>
                <th className="pb-6 px-4">Last Login</th>
                <th className="pb-6 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins
                .filter((a) =>
                  a.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((admin) => (
                  <tr
                    key={admin.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {admin.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                        {admin.division}
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${admin.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`}
                        ></div>
                        <p className="text-[10px] font-black uppercase text-slate-500">
                          {admin.status}
                        </p>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-[10px] font-bold text-slate-400 uppercase">
                      {admin.lastLogin}
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex justify-center gap-2">
                        <button className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <i className="fa-solid fa-trash-can text-xs"></i>
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
  );
};

export default ManageAdmin;
