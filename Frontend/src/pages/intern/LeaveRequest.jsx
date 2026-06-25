import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

// ── Client-side image compression ────────────────────────────────────────────
const compressImage = (file, maxSizeMB = 2, quality = 0.8) => {
  return new Promise((resolve) => {
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
  const queryClient = useQueryClient(); // Alat tempur buat auto-refresh cache

  const currentUser = user
    ? {
        id: user.id,
        name: user.full_name || user.email?.split("@")[0] || "Anak Magang",
        division: user.division?.name || user.division_name || "IT Support",
      }
    : { id: "1", name: "Tim", division: "IT Support" };

  const [leaveType, setLeaveType] = useState("sakit");
  const [permissionDate, setPermissionDate] = useState("");
  const [replacementDate, setReplacementDate] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileHeroOpen, setIsMobileHeroOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    };
  }, [evidencePreview]);

  // ── TANSTACK QUERY: Fetch History Izin (Instan) ──
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: async () => {
      const res = await api.get("/exceptions");
      const data = res.data?.data || res.data || [];
      return data.map((item) => ({
        id: item.id,
        type: item.type === "swap_shift" ? "Swap Shift" : item.type === "tugas_luar" ? "Tugas Luar" : item.type === "izin" ? "Izin Biasa" : "Sakit",
        rawType: item.type,
        status: item.status,
        date: new Date(item.permission_date).toLocaleDateString("id-ID", { dateStyle: "medium" }),
        note: item.description,
        proof: item.evidence_url,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleFileChange = async (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const maxRaw = 10 * 1024 * 1024;

    if (file.size > maxRaw) {
      toast.error("File terlalu besar. Maksimal 10MB.");
      return;
    }

    if (isPdf) {
      setEvidence(file);
      setEvidencePreview(null);
      toast.success(`PDF dipilih: ${formatSize(file.size)}`);
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file, 2, 0.8);
      setEvidence(compressed);
      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
      setEvidencePreview(URL.createObjectURL(compressed));

      const saved = file.size - compressed.size;
      if (saved > 0) {
        toast.success(`Foto dikompres: ${formatSize(file.size)} → ${formatSize(compressed.size)}`);
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

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("type", leaveType);
    formData.append("permission_date", permissionDate);
    if (leaveType === "swap_shift") formData.append("replacement_date", replacementDate);
    formData.append("description", description);
    if (evidence) formData.append("evidence_url", evidence);

    try {
      await api.post("/exceptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Pengajuan berhasil dikirim!");
      
      // Reset Form
      setPermissionDate("");
      setReplacementDate("");
      setDescription("");
      setEvidence(null);
      if (evidencePreview) {
        URL.revokeObjectURL(evidencePreview);
        setEvidencePreview(null);
      }
      
      // Panggil Invalidate biar tabel kanan lgsg nge-refresh sendiri!
      queryClient.invalidateQueries(["exceptions"]);
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEvidence = () => {
    setEvidence(null);
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
      setEvidencePreview(null);
    }
  };

  // Hitung jumlah pending requests
  const pendingCount = history.filter(h => h.status === 'pending').length;

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 md:pt-8 px-3 md:px-6 max-w-7xl mx-auto">
      
      {/* ── HERO SECTION ── */}
     <div className="bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 border border-sky-400/50 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative mb-2 md:mb-0 transition-all duration-500">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="md:hidden flex items-center justify-between p-4 relative z-20 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
              <i className="fa-solid fa-envelope-open-text text-sm"></i>
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white">LEAVE REQUEST</h1>
          </div>
          <button 
            type="button"
            onClick={() => setIsMobileHeroOpen(!isMobileHeroOpen)}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <i className={`fa-solid fa-chevron-down text-sm transition-transform duration-300 ${isMobileHeroOpen ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        {/* 🔥 FIX 2B: Konten Hero (Animasi Buka-Tutup di HP, Selalu Buka di Desktop) */}
        <div className={`relative z-10 transition-all duration-500 ease-in-out overflow-hidden md:max-h-[500px] ${
          isMobileHeroOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-[500px] md:opacity-100"
        }`}>
          <div className="p-5 pt-3 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
            
            <div className="flex-1">
              <div className="hidden md:flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                  <i className="fa-solid fa-envelope-open-text text-sm md:text-lg"></i>
                </div>
                <span className="text-sky-50 text-[9px] md:text-[11px] font-black uppercase tracking-widest">
                  Request System
                </span>
              </div>
              <h1 className="hidden md:block text-2xl md:text-4xl font-black tracking-tight mb-1.5 md:mb-3 text-white">
                Leave & Exception
              </h1>
              <p className="text-[11px] md:text-[14px] text-sky-50/90 font-medium max-w-xl leading-relaxed border-l-[2px] md:border-l-[3px] border-white/30 pl-2.5 md:pl-4">
                Ajukan izin, tukar shift, atau tugas luar.
              </p>
            </div>

            <div className="flex items-center justify-start lg:justify-end shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col items-center justify-center text-center min-w-[100px] md:min-w-[130px] shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-clock-rotate-left text-amber-300 text-sm md:text-base"></i>
                  <span className="text-xl md:text-3xl font-black text-white leading-none">
                    {historyLoading ? "..." : pendingCount}
                  </span>
                </div>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-sky-200 font-bold mt-1">
                  Pending
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        
        {/* ── KOLOM KIRI: FORM PENGAJUAN ── */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-4 md:p-8 shadow-sm">
            <h3 className="text-sm md:text-lg font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 md:pb-4">
              Form Pengajuan
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
              <div>
                <label className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1 ml-1">
                  Kategori Request
                </label>
                <div className="relative">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 md:py-3.5 text-[11px] md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="sakit">Sakit (Wajib Bukti)</option>
                    <option value="izin">Izin Biasa</option>
                    <option value="swap_shift">Swap Shift (Tukar Hari)</option>
                    <option value="tugas_luar">Tugas Luar (Dinas)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              {leaveType === "swap_shift" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-rose-500 block mb-1 ml-1">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Tanggal Pengganti
                  </label>
                  <input
                    type="date"
                    value={replacementDate}
                    onChange={(e) => setReplacementDate(e.target.value)}
                    className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 md:py-3.5 text-[11px] md:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-400"
                    required={leaveType === "swap_shift"}
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1 ml-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={permissionDate}
                  onChange={(e) => setPermissionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 md:py-3.5 text-[11px] md:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1 ml-1">
                  Alasan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="Jelaskan singkat..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 text-[11px] md:text-sm font-medium text-slate-700 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div>
                <label className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1 ml-1">
                  Bukti Foto/PDF {leaveType === "sakit" && <span className="text-rose-500">*</span>}
                </label>
                <label
                  className={`w-full border-2 border-dashed rounded-xl p-3 md:p-5 text-center cursor-pointer transition-colors group block ${
                    compressing ? "border-blue-300 bg-blue-50/50" : evidence ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50" : "border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  }`}
                >
                  {compressing ? (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <i className="fa-solid fa-circle-notch fa-spin text-lg md:text-2xl text-blue-500" />
                      <p className="text-[9px] md:text-xs font-bold text-blue-600">Mengompres...</p>
                    </div>
                  ) : evidence ? (
                    <div className="flex items-center gap-3 justify-center">
                      {evidencePreview ? (
                        <img src={evidencePreview} alt="preview" className="w-10 h-10 md:w-16 md:h-16 object-cover rounded-xl border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 md:w-16 md:h-16 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-file-pdf text-lg md:text-2xl text-rose-500" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs font-bold text-slate-700 truncate">{evidence.name}</p>
                        <p className="text-[8px] md:text-[10px] text-emerald-600 font-bold mt-0.5"><i className="fa-solid fa-check" /> Siap dikirim</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-1">
                      <i className="fa-solid fa-cloud-arrow-up text-lg md:text-2xl text-slate-300 group-hover:text-blue-500 mb-1 block transition-colors" />
                      <p className="text-[9px] md:text-[11px] font-bold text-slate-500">Upload / Kamera</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf" capture="environment" onChange={(e) => { if (e.target.files[0]) handleFileChange(e.target.files[0]); e.target.value = ""; }} />
                </label>

                <div className="mt-2 flex items-center justify-between px-1">
                  <label className="flex items-center gap-1 text-[9px] md:text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                    <i className="fa-solid fa-images" /> Buka Galeri
                    <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf" onChange={(e) => { if (e.target.files[0]) handleFileChange(e.target.files[0]); e.target.value = ""; }} />
                  </label>
                  {evidence && (
                    <button type="button" onClick={removeEvidence} className="text-[9px] md:text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-trash-can" /> Hapus
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-3 md:py-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl text-[11px] md:text-sm font-black border border-blue-400 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isSubmitting ? "Proses..." : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        </div>

        {/* ── KOLOM KANAN: HISTORY ── */}
        <div className="lg:col-span-7 bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[400px] lg:h-full lg:min-h-[500px]">
          <div className="px-4 md:px-6 py-3 md:py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-[1.5rem] md:rounded-t-[2rem]">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-lg">
              My Exceptions
            </h3>
          </div>

          <div className="p-3 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {historyLoading ? (
                 <div className="flex justify-center py-10"><i className="fa-solid fa-spinner fa-spin text-blue-500 text-xl md:text-2xl"></i></div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center opacity-50">
                  <i className="fa-solid fa-envelope-open text-3xl md:text-4xl text-slate-300 mb-2 md:mb-3" />
                  <p className="text-slate-500 font-bold text-[10px] md:text-sm">Belum ada riwayat.</p>
                </div>
              ) : (
                history.map((item) => {
                  const iconMap = { Sakit: "fa-house-medical", "Swap Shift": "fa-code-compare", "Izin Biasa": "fa-envelope-open-text", "Tugas Luar": "fa-briefcase" };
                  const statusStyle =
                    item.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                    item.status === "rejected" ? "bg-rose-50 text-rose-600 border-rose-200" : 
                    "bg-amber-50 text-amber-600 border-amber-200";
                        
                  return (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-start gap-2 md:gap-4">
                        <div className="flex gap-2 md:gap-4 items-start flex-1 min-w-0">
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-lg shrink-0 ${item.status === "approved" ? "bg-emerald-50 text-emerald-500" : item.status === "rejected" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
                            <i className={`fa-solid ${iconMap[item.type] || "fa-envelope"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] md:text-sm font-black text-slate-800 truncate">{item.type}</h4>
                            <p className="text-[9px] md:text-[11px] font-medium text-slate-400 leading-none mt-0.5">{item.date}</p>
                            <p className="text-[10px] md:text-xs font-medium text-slate-600 mt-1.5 md:mt-2 italic line-clamp-2">"{item.note}"</p>
                            {item.proof && (
                              <a href={item.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded-md bg-blue-50 text-[8px] md:text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors">
                                <i className="fa-solid fa-image" /> Lihat Bukti
                              </a>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border shrink-0 ${statusStyle}`}>
                          {item.status === "approved" ? "✓ ACC" : item.status === "rejected" ? "✗ Tolak" : "⏳ Tunggu"}
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