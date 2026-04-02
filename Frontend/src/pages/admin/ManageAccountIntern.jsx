import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ManageAccountIntern = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Ambil token JWT Laravel dari localStorage
  const getToken = () => localStorage.getItem("token");

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/profiles`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
          },
          params: {
            role: "intern", // filter intern
          },
        },
      );

      // Response: { status: 'success', data: [...] }
      const allProfiles = response.data.data || [];

      // Filter hanya role intern (jaga-jaga jika backend tidak filter)
      const internOnly = allProfiles.filter((p) => p.role === "intern");
      setInterns(internOnly);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(
        "Gagal memuat data: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const handleToggleLock = async (internId, currentStatus) => {
    setUpdatingId(internId);
    try {
      const newStatus = !currentStatus;

      await axios.put(
        `${import.meta.env.VITE_API_URL}/profiles/${internId}`,
        { is_locked: newStatus },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      setInterns((prevInterns) =>
        prevInterns.map((intern) =>
          intern.id === internId ? { ...intern, is_locked: newStatus } : intern,
        ),
      );

      toast.success(
        newStatus ? "Akun berhasil dikunci 🔒" : "Akses berhasil dibuka 🔓",
      );
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        "Gagal memperbarui status: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="bg-[#1b254b] p-10 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Manage Intern Accounts
            </h2>
            <p className="text-indigo-300 text-[10px] font-black uppercase mt-1">
              Otoritas Admin IT
            </p>
          </div>
          <button
            onClick={fetchInterns}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {loading ? "🔄 Loading..." : "⟳ Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-300 text-[10px] font-black uppercase border-b border-slate-50">
                <th className="pb-6 px-4">Intern Details</th>
                <th className="pb-6 px-4 text-center">Current Status</th>
                <th className="pb-6 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#1b254b] text-sm font-bold">
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b254b]"></div>
                      <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px]">
                        Memproses Database...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : interns.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-slate-400 font-medium">
                        Tidak ada data intern.
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Pastikan ada user dengan role "intern" di database
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                interns.map((intern) => (
                  <tr
                    key={intern.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-[11px] border-2 ${
                            intern.is_locked
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          }`}
                        >
                          {(intern.full_name || "??")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-base leading-tight">
                            {intern.full_name || "No Name"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium lowercase">
                            {intern.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span
                        className={`inline-block px-5 py-2 rounded-full text-[9px] font-black uppercase border ${
                          intern.is_locked
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        {intern.is_locked ? "🔒 Locked" : "✅ Active"}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <button
                        onClick={() =>
                          handleToggleLock(intern.id, intern.is_locked)
                        }
                        disabled={updatingId === intern.id}
                        className={`min-w-[140px] px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                          intern.is_locked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-[#1b254b] text-white hover:bg-rose-600"
                        }`}
                      >
                        {updatingId === intern.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⚡</span>
                            Processing...
                          </span>
                        ) : intern.is_locked ? (
                          "🔓 Unlock Access"
                        ) : (
                          "🔒 Lock Account"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && interns.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-right">
            <p className="text-[10px] text-slate-400 font-medium">
              Total Interns: {interns.length} | Active:{" "}
              {interns.filter((i) => !i.is_locked).length} | Locked:{" "}
              {interns.filter((i) => i.is_locked).length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAccountIntern;
