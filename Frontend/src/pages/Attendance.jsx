import React, { useState, useEffect } from "react";

const Attendance = () => {
  // 1. STATE MANAGEMENT
  const [attendance, setAttendance] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    subStatus: "",
    file: null,
  });

  // Ambil data dari LocalStorage saat halaman di-load
  useEffect(() => {
    const savedData = localStorage.getItem("user_attendance");
    if (savedData) setAttendance(JSON.parse(savedData));
  }, []);

  // 2. HANDLER FUNCTIONS
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.status) return alert("Pilih status kehadiran dulu!");

    // Validasi: Jika Sakit wajib ada file
    if (formData.subStatus === "Sakit" && !formData.file) {
      return alert("Bre, wajib upload surat dokter!");
    }

    const payload = {
      ...formData,
      timestamp: new Date().toLocaleString(),
      isLocked: ["Sakit", "Izin", "Libur"].includes(formData.subStatus),
    };

    localStorage.setItem("user_attendance", JSON.stringify(payload));
    setAttendance(payload);
  };

  const handleReset = () => {
    localStorage.removeItem("user_attendance");
    setAttendance(null);
    setFormData({ status: "", subStatus: "", file: null });
  };

  // --- UI 1: LOCK SCREEN (Berdasarkan Desain Figma Lo) ---
  if (attendance?.isLocked) {
    return (
      <div className="fixed inset-0 bg-[#000814] flex flex-col items-center justify-center z-50 p-6 text-center">
        {/* Glow Effect & Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
          <svg
            className="w-32 h-32 text-yellow-500 relative z-10"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-sm md:text-base tracking-[0.2em] font-bold uppercase">
            AKUN TERKUNCI: Anda sedang dalam masa {attendance.subStatus}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm tracking-wide">
            Hubungi Admin untuk membuka akses kembali.
          </p>
        </div>

        {/* Tombol Rahasia buat Dev/Testing */}
        <button
          onClick={handleReset}
          className="mt-12 text-[10px] text-slate-700 hover:text-slate-500 underline transition"
        >
          (Bypass Lock - Dev Only)
        </button>
      </div>
    );
  }

  // --- UI 2: HALAMAN NORMAL ---
  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Presensi & Perizinan
      </h1>
      <p className="text-slate-600 mb-8">
        Halaman ini menampilkan riwayat presensi dan form izin.
      </p>

      {/* FORM SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Main Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status Kehadiran
            </label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="">-- Pilih Status --</option>
              <option value="masuk">Masuk Kerja</option>
              <option value="tidak_masuk">
                Tidak Masuk (Izin/Sakit/Libur)
              </option>
            </select>
          </div>

          {/* Sub Status (Muncul jika tidak masuk) */}
          {formData.status === "tidak_masuk" && (
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 animate-in slide-in-from-top-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                Alasan Tidak Masuk
              </label>
              <div className="flex justify-center gap-6">
                {["Sakit", "Izin", "Libur"].map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="subStatus"
                      value={item}
                      className="w-4 h-4 text-blue-600"
                      onChange={(e) =>
                        setFormData({ ...formData, subStatus: e.target.value })
                      }
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Logic File Upload Khusus Sakit */}
          {formData.subStatus === "Sakit" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-red-500 uppercase tracking-wider">
                * Wajib Unggah Surat Dokter
              </label>
              <input
                type="file"
                onChange={(e) =>
                  setFormData({ ...formData, file: e.target.files[0]?.name })
                }
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98]"
          >
            Kirim Presensi
          </button>
        </form>
      </div>

      {/* DUMMY HISTORY TABLE */}
      <div className="mt-10 opacity-50 grayscale">
        <h2 className="text-lg font-bold mb-4">Riwayat Terakhir</h2>
        <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 italic">
          Belum ada data riwayat...
        </div>
      </div>
    </div>
  );
};

export default Attendance;
