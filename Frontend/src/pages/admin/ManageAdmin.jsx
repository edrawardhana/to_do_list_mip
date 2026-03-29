import React, { useState } from "react";
import { updateUserLockStatus } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";

const ManageAdmin = () => {
  const { user: currentUser } = useAuth();

  // Data dummy - Sebagai Admin, kamu hanya fokus melihat & mengelola INTERN
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Nabil P",
      email: "nabil@mip.com",
      role: "intern",
      division: "IT Support",
      is_locked: false,
    },
    {
      id: 2,
      name: "Bagas",
      email: "bagas@mip.com",
      role: "intern",
      division: "IT Support",
      is_locked: false,
    },
    {
      id: 3,
      name: "Edra",
      email: "edra@mip.com",
      role: "intern",
      division: "IT Support",
      is_locked: true,
    },
    {
      id: 4,
      name: "Siti Aminah",
      email: "siti@mip.com",
      role: "intern",
      division: "UI/UX Designer",
      is_locked: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState({
    id: null,
    name: "",
    email: "",
    role: "intern",
    division: "",
  });

  // --- HANDLERS ---
  const handleToggleLock = async (targetUser) => {
    // Sebagai Admin, kamu HANYA boleh mengunci role intern
    if (targetUser.role !== "intern") return;

    const actionText = targetUser.is_locked ? "membuka kunci" : "mengunci";
    if (!window.confirm(`Yakin ingin ${actionText} akun ${targetUser.name}?`))
      return;

    const loadingToast = toast.loading("Memperbarui status akses...");

    const result = await updateUserLockStatus(
      targetUser.id,
      targetUser.is_locked,
      currentUser.id,
      currentUser.role,
    );

    if (result.success) {
      setUsers(
        users.map((u) =>
          u.id === targetUser.id
            ? { ...u, is_locked: !targetUser.is_locked }
            : u,
        ),
      );
      toast.success(`Akses ${targetUser.name} berhasil diperbarui!`, {
        id: loadingToast,
      });
    } else {
      toast.error("Gagal: " + result.error, { id: loadingToast });
    }
  };

  const openModal = (
    user = { id: null, name: "", email: "", role: "intern", division: "" },
  ) => {
    setCurrentUserData(user);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header - Navy matching your sidebar #1b254b */}
      <div className="flex justify-between items-center bg-[#1b254b] p-8 rounded-[2rem] shadow-xl shadow-indigo-100/10">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Internship Access Control
          </h2>
          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Admin Panel • Management System
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-white text-[#1b254b] px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-lg active:scale-95"
        >
          + Registrasi Intern Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-300 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="pb-6 px-4">Intern Details</th>
                <th className="pb-6 px-4">Division</th>
                <th className="pb-6 px-4 text-center">Status</th>
                <th className="pb-6 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#1b254b] text-sm font-bold">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors"
                >
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] shadow-sm ${user.is_locked ? "bg-rose-50 text-rose-400" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-[#1b254b] leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {user.division}
                    </span>
                  </td>

                  {/* INDICATOR LOGIN STATUS */}
                  <td className="py-5 px-4 text-center">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        user.is_locked
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}
                    >
                      {user.is_locked ? "Locked" : "Active"}
                    </span>
                  </td>

                  <td className="py-5 px-4 text-center">
                    <div className="flex justify-center items-center gap-3">
                      {/* TOMBOL LOCK/UNLOCK ADMIN */}
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm border ${
                          user.is_locked
                            ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-white border-slate-200 text-[#1b254b] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                        }`}
                      >
                        <i
                          className={`fa-solid ${user.is_locked ? "fa-unlock" : "fa-user-lock"} text-xs`}
                        ></i>
                        {user.is_locked ? "Unlock" : "Lock Account"}
                      </button>

                      <button
                        onClick={() => openModal(user)}
                        className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#1b254b] hover:text-white transition-all shadow-sm"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
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
