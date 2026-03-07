import React, { useState, useEffect } from "react";

const Attendance = () => {
  // 1. STATE MANAGEMENT
  const [attendance, setAttendance] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    subStatus: "",
    targetDate: "",
    swapWith: "",
    file: null,
  });

  // Load data awal & cegah error JSON
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("user_attendance");
      if (savedData) setAttendance(JSON.parse(savedData));
    } catch (e) {
      console.error("Data error", e);
    }
  }, []);

  // 2. LOGIKA VALIDASI
  const validatePolicy = () => {
    const now = new Date();
    const selectedDate = new Date(formData.targetDate);
    const shiftStart = new Date(formData.targetDate || new Date());
    shiftStart.setHours(8, 0, 0, 0);

    // A. Validasi SAKIT (H-2 Jam)
    if (formData.subStatus === "Sakit") {
      if (!formData.file)
        return { valid: false, msg: "Wajib upload surat dokter!" };
      const isToday = new Date().toDateString() === selectedDate.toDateString();
      if (isToday) {
        const diffInHours = (shiftStart - now) / (1000 * 60 * 60);
        if (diffInHours < 2)
          return {
            valid: false,
            msg: "Sakit maksimal dilaporkan 2 jam sebelum shift!",
          };
      }
    }

    // B. Validasi IZIN & SWAP SHIFT (Wajib H-1)
    // "Libur" TIDAK ada di sini agar tidak kena cek H-1
    if (["Izin", "Swap Shift"].includes(formData.subStatus)) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (selectedDate < tomorrow) {
        return {
          valid: false,
          msg: `Pengajuan ${formData.subStatus} maksimal H-1 sebelum hari H!`,
        };
      }
    }

    return { valid: true };
  };

  // 3. HANDLER FUNCTIONS
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.status) return alert("Pilih status kehadiran!");
    if (!formData.targetDate) return alert("Pilih tanggal!");

    if (formData.status === "tidak_masuk") {
      const check = validatePolicy();
      if (!check.valid) return alert(check.msg);
    }

    // Tentukan apakah harus mengunci
    const shouldLock = ["Sakit", "Izin", "Libur", "Swap Shift"].includes(
      formData.subStatus,
    );

    const payload = {
      ...formData,
      timestamp: new Date().toLocaleString(),
      isLocked: shouldLock,
    };

    // Simpan & Update UI seketika
    localStorage.setItem("user_attendance", JSON.stringify(payload));
    setAttendance(payload);

    if (shouldLock) {
    }
  };

  const handleReset = () => {
    localStorage.removeItem("user_attendance");
    setAttendance(null);
    setFormData({
      status: "",
      subStatus: "",
      targetDate: "",
      swapWith: "",
      file: null,
    });
    window.location.reload();
  };

  // --- UI 1: OVERLAY LOCKING SCREEN (Sesuai Gambar Gembok Kuning) ---
  if (attendance?.isLocked) {
    return (
      <div className="fixed inset-0 bg-[#000d1a] flex flex-col items-center justify-center z-[9999] p-6 text-center">
        {/* Efek Glow Latar Belakang */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500 blur-[120px] opacity-20"></div>

        <div className="relative z-10 animate-in zoom-in duration-500">
          {/* Kotak Gembok Kuning */}
          <div className="bg-[#ffbd00] w-24 h-24 md:w-32 md:h-32 rounded-[30px] flex items-center justify-center shadow-[0_20px_50px_rgba(255,189,0,0.3)] mb-10 mx-auto">
            <i className="fa-solid fa-lock text-5xl md:text-6xl text-[#000d1a]"></i>
          </div>

          <div className="space-y-4">
            <h2 className="text-white text-base md:text-lg font-bold tracking-[0.3em] uppercase opacity-90">
              AKUN TERKUNCI
            </h2>
            <div className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
              <p>Anda sedang dalam masa {attendance.subStatus}.</p>
              <p>Hubungi Admin untuk akses kembali.</p>
            </div>
          </div>

          {/* Tombol Reset (Dev Only) */}
          <button
            onClick={handleReset}
            className="mt-24 text-[10px] text-slate-700 hover:text-slate-500 transition border-b border-transparent hover:border-slate-500"
          >
            (DEV MODE: RESET ACCESS)
          </button>
        </div>
      </div>
    );
  }

  // --- UI 2: HALAMAN NORMAL ---
  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 animate-in fade-in duration-700">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Presensi & Perizinan
        </h1>
        <p className="text-slate-500 text-sm">
          Kelola jadwal dan kehadiran harian Anda.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Tanggal */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Tanggal Pengajuan
            </label>
            <input
              type="date"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Status Kehadiran
            </label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="">-- Pilih Status --</option>
              <option value="masuk">Masuk Kerja (Clock In)</option>
              <option value="tidak_masuk">
                Tidak Masuk (Izin/Sakit/Libur/Swap)
              </option>
            </select>
          </div>

          {/* Pilihan Alasan */}
          {formData.status === "tidak_masuk" && (
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-top-4">
              <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-[0.2em] mb-4">
                Pilih Alasan
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Sakit", "Izin", "Libur", "Swap Shift"].map((item) => (
                  <label
                    key={item}
                    className="flex flex-col items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-sky-500 transition-colors group"
                  >
                    <input
                      type="radio"
                      name="subStatus"
                      value={item}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                      onChange={(e) =>
                        setFormData({ ...formData, subStatus: e.target.value })
                      }
                    />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-sky-600 uppercase">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Field Dinamis */}
          {formData.subStatus === "Swap Shift" && (
            <input
              type="text"
              placeholder="Swap dengan siapa? (Nama & Shift)"
              className="w-full p-4 bg-white border border-sky-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-sky-500/10"
              onChange={(e) =>
                setFormData({ ...formData, swapWith: e.target.value })
              }
            />
          )}

          {formData.subStatus === "Sakit" && (
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl">
              <input
                type="file"
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sky-50 file:text-sky-700"
                onChange={(e) =>
                  setFormData({ ...formData, file: e.target.files[0]?.name })
                }
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0085cc] hover:bg-sky-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-[0.98]"
          >
            KIRIM DATA PRESENSI
          </button>
        </form>
      </div>

      {/* Footer Rule Info */}
      <footer className="mt-10 grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
            Sakit
          </p>
          <p className="text-xs font-black text-slate-700">H-2 Jam</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
            Izin / Swap
          </p>
          <p className="text-xs font-black text-slate-700">H-1 Hari</p>
        </div>
        <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-sky-400 uppercase mb-1">
            Libur
          </p>
          <p className="text-xs font-black text-sky-600 uppercase">Auto-Lock</p>
        </div>
      </footer>
    </div>
  );
};

export default Attendance;
