import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

// ── Client-side image compression ────────────────────────────────────────────
const compressImage = (file, maxSizeMB = 2, quality = 0.8) => {
  return new Promise((resolve) => {
    // PDF: skip compression
    if (file.type === "application/pdf") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down jika lebar > 1920px
        if (width > 1920) {
          height = Math.round((height * 1920) / width);
          width = 1920;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        const tryCompress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              // Jika masih > maxSizeMB dan quality masih bisa diturunkan
              if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.4) {
                tryCompress(q - 0.15);
              } else {
                const compressed = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".jpg"),
                  { type: "image/jpeg" },
                );
                resolve(compressed);
              }
            },
            "image/jpeg",
            q,
          );
        };

        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const LeaveRequest = () => {
  const { user } = useAuth();

  const currentUser = user
    ? {
        id: user.id,
        name: user.full_name || user.email?.split("@")[0] || "Anak Magang",
        division: user.division?.name || user.division_name || "IT Support",
      }
    : { id: "1", name: "Kiel", division: "IT Support" };

  const [leaveType, setLeaveType] = useState("terlambat");
  const [permissionDate, setPermissionDate] = useState("");
  const [replacementDate, setReplacementDate] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState(null); // compressed File
  const [evidencePreview, setEvidencePreview] = useState(null); // object URL for preview
  const [compressing, setCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    };
  }, [evidencePreview]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/exceptions");
      const data = res.data?.data || res.data || [];
      setHistory(
        data.map((item) => ({
          id: item.id,
          type:
            item.type === "swap_shift"
              ? "Ganti Shift"
              : item.type === "tugas_luar"
                ? "Tugas Luar"
                : item.type === "izin"
                  ? "Sebab Lain (Izin)"
                  : item.type === "terlambat"
                    ? "Terlambat Masuk Kerja"
                    : item.type === "pulang_awal"
                      ? "Pulang Lebih Awal"
                      : "Sakit",
          rawType: item.type,
          status: item.status,
          date: new Date(item.permission_date).toLocaleDateString("id-ID", {
            dateStyle: "medium",
          }),
          note: item.description,
          proof: item.evidence_url,
        })),
      );
    } catch (error) {
      console.error("Gagal memuat riwayat izin:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle file selection + compress
  const handleFileChange = async (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const maxRaw = 10 * 1024 * 1024; // 10MB raw limit

    if (file.size > maxRaw) {
      toast.error("File terlalu besar. Maksimal 10MB.");
      return;
    }

    if (isPdf) {
      // PDF: langsung pakai, max 10MB (backend juga validasi)
      setEvidence(file);
      setEvidencePreview(null);
      toast.success(`PDF dipilih: ${formatSize(file.size)}`);
      return;
    }

    // Image: compress
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 2, 0.8);
      setEvidence(compressed);
      // Revoke old preview
      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
      setEvidencePreview(URL.createObjectURL(compressed));

      const saved = file.size - compressed.size;
      if (saved > 0) {
        toast.success(
          `Foto dikompres: ${formatSize(file.size)} → ${formatSize(compressed.size)}`,
        );
      } else {
        toast.success(`Foto dipilih: ${formatSize(compressed.size)}`);
      }
    } catch {
      toast.error("Gagal memproses gambar.");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (leaveType === "sakit" && !evidence) {
      toast.error("Surat keterangan sakit wajib dilampirkan.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("type", leaveType);
    formData.append("permission_date", permissionDate);
    if (leaveType === "swap_shift")
      formData.append("replacement_date", replacementDate);
    formData.append("description", description);
    if (evidence) formData.append("evidence_url", evidence);

    try {
      await api.post("/exceptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Pengajuan berhasil dikirim!");
      setPermissionDate("");
      setReplacementDate("");
      setDescription("");
      setEvidence(null);
      if (evidencePreview) {
        URL.revokeObjectURL(evidencePreview);
        setEvidencePreview(null);
      }
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const removeEvidence = () => {
    setEvidence(null);
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
      setEvidencePreview(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 md:pt-8 px-4 md:px-6 max-w-7xl mx-auto">
      
      {/* ── HERO SECTION ── */}
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 border border-sky-400/50 rounded-[2rem] p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                <i className="fa-solid fa-envelope-open-text text-base md:text-lg"></i>
              </div>
              <span className="text-sky-50 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                Request System
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 md:mb-3 text-white">
              Leave & Exception
            </h1>
            <p className="text-xs md:text-[14px] text-sky-50/90 font-medium max-w-xl leading-relaxed border-l-[3px] border-white/30 pl-3 md:pl-4">
              Ajukan izin, tukar shift, atau permintaan buka akses (Unlock) jika
              Anda mendadak harus masuk di hari libur.
            </p>
          </div>

          {/* WIDGET KANAN (Sekarang Tampil di HP & Bisa di-Swipe) */}
          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center text-center min-w-[120px] md:min-w-[130px] shadow-lg flex-1 lg:flex-none">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-2 md:mb-3 shadow-inner">
                <i className="fa-regular fa-calendar-check text-sm md:text-base"></i>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl md:text-3xl font-black text-white leading-none">
                  3
                </span>
                <span className="text-[10px] md:text-xs font-bold text-sky-100">Hari</span>
              </div>
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-sky-200 font-bold">
                Sisa Kuota Izin
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center text-center min-w-[120px] md:min-w-[130px] shadow-lg flex-1 lg:flex-none">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2 md:mb-3 shadow-inner">
                <i className="fa-solid fa-clock-rotate-left text-sm md:text-base"></i>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl md:text-3xl font-black text-white leading-none">
                  0
                </span>
                <span className="text-[10px] md:text-xs font-bold text-sky-100">Kali</span>
              </div>
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-sky-200 font-bold">
                Pending Request
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* ── KOLOM KIRI: FORM PENGAJUAN ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm">
            <h3 className="text-base md:text-lg font-black text-slate-800 mb-5 md:mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              Form Pengajuan
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* TIPE IZIN */}
              <div>
                <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">
                  Kategori Request
                </label>
                <div className="relative">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="terlambat">Terlambat Masuk Kerja</option>
                    <option value="sakit">Sakit (Wajib Bukti)</option>
                    <option value="pulang_awal">Pulang Lebih Awal</option>
                    <option value="swap_shift">Ganti Shift (Tukar Hari)</option>
                    <option value="izin">Sebab Lain (Izin)</option>
                    <option value="tugas_luar">Tugas Luar (Dinas)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              {/* TANGGAL PENGGANTI */}
              {leaveType === "swap_shift" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-rose-500 block mb-1.5 ml-1">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Tanggal
                    Pengganti
                  </label>
                  <input
                    type="date"
                    value={replacementDate}
                    onChange={(e) => setReplacementDate(e.target.value)}
                    className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-400"
                    required={leaveType === "swap_shift"}
                  />
                  <p className="text-[9px] md:text-[10px] text-slate-400 mt-2 ml-1 italic font-medium">
                    *Jadwal lama akan otomatis terhapus jika di-ACC.
                  </p>
                </div>
              )}

              {/* TANGGAL IZIN */}
              <div>
                <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">
                  Tanggal Izin / Sakit / Dinas
                </label>
                <input
                  type="date"
                  value={permissionDate}
                  onChange={(e) => setPermissionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* ALASAN */}
              <div>
                <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">
                  Alasan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="Jelaskan secara singkat..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs md:text-sm font-medium text-slate-700 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              {/* FILE UPLOAD */}
              <div>
                <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">
                  Bukti Foto / Surat{" "}
                  {leaveType === "sakit" && (
                    <span className="text-rose-500">*</span>
                  )}
                </label>

                <label
                  className={`w-full border-2 border-dashed rounded-xl p-4 md:p-5 text-center cursor-pointer transition-colors group block ${
                    compressing
                      ? "border-blue-300 bg-blue-50/50"
                      : evidence
                        ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50"
                        : "border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  }`}
                >
                  {compressing ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <i className="fa-solid fa-circle-notch fa-spin text-xl md:text-2xl text-blue-500" />
                      <p className="text-[10px] md:text-xs font-bold text-blue-600">
                        Mengompres gambar...
                      </p>
                    </div>
                  ) : evidence ? (
                    <div className="flex items-center gap-3 justify-center">
                      {evidencePreview ? (
                        <img
                          src={evidencePreview}
                          alt="preview"
                          className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-file-pdf text-xl md:text-2xl text-rose-500" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[11px] md:text-xs font-bold text-slate-700 truncate">
                          {evidence.name}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">
                          {formatSize(evidence.size)}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-emerald-600 font-bold mt-0.5">
                          <i className="fa-solid fa-check mr-1" />
                          Siap dikirim
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up text-xl md:text-2xl text-slate-300 group-hover:text-blue-500 mb-2 block transition-colors" />
                      <p className="text-[10px] md:text-[11px] font-bold text-slate-500">
                        Klik untuk upload / kamera
                      </p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 px-2">
                        JPG/PNG/PDF — Otomatis dikompres ≤ 2MB
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files[0]) handleFileChange(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>

                <div className="mt-3 flex items-center justify-between px-1">
                  <label className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                    <i className="fa-solid fa-images" /> Galeri
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileChange(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {evidence && (
                    <button
                      type="button"
                      onClick={removeEvidence}
                      className="text-[10px] md:text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash-can" /> Hapus
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 md:py-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl text-xs md:text-sm font-black border border-blue-400 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane"></i>
                )}
                {isLoading ? "Memproses..." : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        </div>

        {/* ── KOLOM KANAN: HISTORY ── */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px] md:min-h-[500px]">
          <div className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-[2rem]">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-base md:text-lg">
            My Exceptions
            </h3>
          </div>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3 md:space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center opacity-50">
                  <i className="fa-solid fa-envelope-open text-4xl text-slate-300 mb-3" />
                  <p className="text-slate-500 font-bold text-xs md:text-sm">
                    Belum ada riwayat pengajuan
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const iconMap = {
                    Sakit: "fa-house-medical",
                    "Swap Shift": "fa-code-compare",
                    "Izin Biasa": "fa-envelope-open-text",
                    "Tugas Luar": "fa-briefcase",
                  };
                  const statusStyle =
                    item.status === "approved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : item.status === "rejected"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-amber-50 text-amber-600 border-amber-200";

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:border-blue-200 transition-colors"
                    >
                      {/* Flex-col di HP biar badge gak nabrak teks, flex-row di Laptop */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                        
                        <div className="flex gap-3 md:gap-4 items-start flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-lg shrink-0 ${
                              item.status === "approved" ? "bg-emerald-50 text-emerald-500" : 
                              item.status === "rejected" ? "bg-rose-50 text-rose-500" : 
                              "bg-amber-50 text-amber-500"
                            }`}
                          >
                            <i className={`fa-solid ${iconMap[item.type] || "fa-envelope"}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-black text-slate-800 truncate">
                              {item.type}
                            </h4>
                            <p className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-0.5">
                              {item.date}
                            </p>
                            <p className="text-[11px] md:text-xs font-medium text-slate-600 mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              "{item.note}"
                            </p>
                            {item.proof && (
                              <a
                                href={item.proof}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-blue-50 text-[9px] md:text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <i className="fa-solid fa-image" /> Lihat Bukti
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`self-start sm:self-auto px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border shrink-0 ${statusStyle}`}
                        >
                          {item.status === "approved"
                            ? "✓ Disetujui"
                            : item.status === "rejected"
                              ? "✗ Ditolak"
                              : "⏳ Pending"}
                        </span>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
