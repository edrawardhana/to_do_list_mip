import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

// ── Client-side image compression ────────────────────────────────────────────
const compressImage = (file, maxSizeMB = 2, quality = 0.8) => {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') { resolve(file); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > 1920) {
          height = Math.round((height * 1920) / width);
          width = 1920;
        }

        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        const tryCompress = (q) => {
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.4) {
              tryCompress(q - 0.15);
            } else {
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
              resolve(compressed);
            }
          }, 'image/jpeg', q);
        };

        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const LeaveRequest = () => {
  const { user, isDeveloper, isSuperAdmin } = useAuth();

  const currentUser = user ? {
    id: user.id,
    name: user.full_name || user.email?.split('@')[0] || "Anak Magang",
    division: user.division?.name || user.division_name || "IT Support"
  } : { id: "1", name: "Intern", division: "IT Support" };

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS (HERO SECTION)
  // ==========================================
  const isDeveloperTheme = isDeveloper;
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme;
  
  const theme = {
    heroBg: isDeveloperTheme ? "bg-[#09090b] border-zinc-800 shadow-emerald-900/10" : isPurpleTheme ? "bg-[#1d1633] border-[#342459] shadow-purple-900/20" : "bg-[#242b4d] border-[#303861] shadow-blue-900/20",
    blobTop: isDeveloperTheme ? "bg-zinc-500/10" : isPurpleTheme ? "bg-purple-500/20" : "bg-blue-500/20",
    blobBot: isDeveloperTheme ? "bg-sky-500/5" : isPurpleTheme ? "bg-fuchsia-500/10" : "bg-sky-500/10",
    iconBg: isDeveloperTheme ? "bg-zinc-800 border-zinc-700 text-zinc-300" : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-400" : "bg-blue-500/20 border-blue-400/30 text-blue-400",
    badgeBg: isDeveloperTheme ? "text-zinc-500 bg-zinc-900/60 border-zinc-800" : isPurpleTheme ? "text-purple-300 bg-purple-900/40 border-purple-700/50" : "text-blue-300 bg-blue-900/40 border-blue-700/50",
    title: "text-white",
    subtitle: isDeveloperTheme ? "text-zinc-500" : isPurpleTheme ? "text-purple-200/70" : "text-blue-200/70",
    widgetBg: isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800/60" : isPurpleTheme ? "bg-purple-900/30 border-purple-700/50" : "bg-blue-900/30 border-blue-700/50",
    progressIcon: isDeveloperTheme ? "text-emerald-400" : isPurpleTheme ? "text-purple-400" : "text-blue-400",
    
    // --- WHITESPACE FILLER BADGES ---
    heroBadge: isDeveloperTheme ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" : isPurpleTheme ? "bg-purple-900/50 border-purple-700/50 text-purple-200" : "bg-blue-900/50 border-blue-700/50 text-blue-200",
    heroBadgeActive: isDeveloperTheme ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : isPurpleTheme ? "bg-purple-500/20 border-purple-400/30 text-purple-300" : "bg-sky-500/20 border-sky-400/30 text-sky-300",
    dotActive: isDeveloperTheme ? "bg-emerald-400" : isPurpleTheme ? "bg-purple-400" : "bg-sky-400",

    // --- FORM & PANELS THEME ---
    panelBg: isDeveloperTheme ? "bg-[#09090b] border-[#27272a]" : "bg-white border-slate-200",
    panelHead: isDeveloperTheme ? "border-zinc-800/60 bg-[#141417]/50" : "border-slate-100 bg-slate-50/50",
    textPrimary: isDeveloperTheme ? "text-zinc-200" : "text-slate-800",
    textSecondary: isDeveloperTheme ? "text-zinc-500" : "text-slate-500",
    inputBg: isDeveloperTheme ? "bg-[#18181b] border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:ring-emerald-500" : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-blue-500",
    cardBg: isDeveloperTheme ? "bg-[#141417] border-zinc-800 hover:border-zinc-600" : "bg-white border-slate-100 hover:border-blue-200",
    btnSubmit: isDeveloperTheme ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20" : isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20",
    dropzone: isDeveloperTheme ? "border-zinc-700 bg-[#18181b] hover:border-emerald-500 hover:bg-emerald-500/5" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-slate-50",
  };

  const [leaveType, setLeaveType]           = useState("sakit");
  const [permissionDate, setPermissionDate] = useState("");
  const [replacementDate, setReplacementDate] = useState("");
  const [description, setDescription]       = useState("");
  const [evidence, setEvidence]             = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [compressing, setCompressing]       = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [history, setHistory]               = useState([]);

  useEffect(() => {
    return () => { if (evidencePreview) URL.revokeObjectURL(evidencePreview); };
  }, [evidencePreview]);

  const fetchHistory = async () => {
    try {
      const res  = await api.get('/exceptions');
      const data = res.data?.data || res.data || [];
      setHistory(data.map(item => ({
        id:      item.id,
        type:    item.type === 'swap_shift' ? 'Swap Shift'
               : item.type === 'tugas_luar' ? 'Tugas Luar'
               : item.type === 'izin'       ? 'Izin Biasa'
               : 'Sakit',
        rawType: item.type,
        status:  item.status,
        date:    new Date(item.permission_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }),
        note:    item.description,
        proof:   item.evidence_url,
      })));
    } catch (error) {
      console.error("Gagal memuat riwayat izin:", error);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const counts = useMemo(() => {
    return {
      pending: history.filter(h => h.status === 'pending').length,
      approved: history.filter(h => h.status === 'approved').length,
      rejected: history.filter(h => h.status === 'rejected').length,
      sisaCuti: 3 - history.filter(h => h.status === 'approved' && h.rawType === 'izin').length, // Simulasi sisa cuti (Maks 3)
    };
  }, [history]);

  const handleFileChange = async (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const maxRaw = 10 * 1024 * 1024; // 10MB raw limit

    if (file.size > maxRaw) {
      toast.error('File terlalu besar. Maksimal 10MB.');
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
      if (saved > 0) toast.success(`Foto dikompres: ${formatSize(file.size)} → ${formatSize(compressed.size)}`);
      else toast.success(`Foto dipilih: ${formatSize(compressed.size)}`);
    } catch {
      toast.error('Gagal memproses gambar.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (leaveType === 'sakit' && !evidence) {
      toast.error('Surat keterangan sakit wajib dilampirkan.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("type", leaveType);
    formData.append("permission_date", permissionDate);
    if (leaveType === "swap_shift") formData.append("replacement_date", replacementDate);
    formData.append("description", description);
    if (evidence) formData.append("evidence_url", evidence);

    try {
      await api.post('/exceptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success("Pengajuan berhasil dikirim!");
      setPermissionDate(""); setReplacementDate(""); setDescription("");
      setEvidence(null);
      if (evidencePreview) { URL.revokeObjectURL(evidencePreview); setEvidencePreview(null); }
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const removeEvidence = () => {
    setEvidence(null);
    if (evidencePreview) { URL.revokeObjectURL(evidencePreview); setEvidencePreview(null); }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 lg:px-8 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION (PERFECT HIERARCHY)                                    */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-700 ${theme.heroBg}`}>
        {/* Glow Effects */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobTop}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${theme.blobBot}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 pb-8 sm:pb-10">
          
          {/* KOLOM KIRI (Teks + Whitespace Fillers) */}
          <div className="lg:max-w-xl flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors duration-500 ${theme.iconBg}`}>
                <i className="fa-solid fa-envelope-open-text text-lg md:text-xl" />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] px-3 py-1.5 md:py-2 rounded-lg border transition-colors duration-500 ${theme.badgeBg}`}>
                Request System
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 leading-tight transition-colors duration-500 ${theme.title}`}>
              Leave & Exception.
            </h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed transition-colors duration-500 ${theme.subtitle}`}>
              Ajukan izin, tukar shift, atau permintaan buka akses (Unlock) jika Anda mendadak harus masuk di hari libur.
            </p>

            {/* 🔥 WHITESPACE FILLER: Ornamen Badges */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border transition-colors duration-500 ${theme.heroBadge}`}>
                <i className="fa-regular fa-calendar-check" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (Kotak Stats / Summary) */}
          <div className={`w-full lg:w-80 shrink-0 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-md flex flex-col justify-center gap-4 border transition-colors duration-500 ${theme.widgetBg}`}>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${theme.progressIcon}`}>Leave Summary</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400">Total {history.length} pengajuan</p>
              </div>
              <i className={`fa-solid fa-file-contract text-lg ${theme.progressIcon}`} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.progressIcon}`}>Sisa Izin</span>
                <span className="text-3xl sm:text-4xl font-black text-white leading-none">{counts.sisaCuti} <span className="text-sm font-bold text-slate-400">Hari</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Pending</span>
                <span className="text-3xl sm:text-4xl font-black text-white leading-none">{counts.pending} <span className="text-sm font-bold text-slate-400">Req</span></span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 mt-1 flex justify-between items-center text-[10px] sm:text-[11px] font-medium text-white/60">
              <span>Di-ACC: <strong className="text-emerald-400">{counts.approved}</strong></span>
              <span>Ditolak: <strong className="text-rose-400">{counts.rejected}</strong></span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ================================================================= */}
      {/* 2-COLUMN LAYOUT (FORM & HISTORY)                                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* KOLOM KIRI: FORM PENGAJUAN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className={`rounded-[2rem] border p-6 md:p-8 shadow-sm transition-colors duration-500 ${theme.panelBg}`}>
            <h3 className={`text-lg font-black mb-6 flex items-center gap-3 border-b pb-4 transition-colors duration-500 ${theme.textPrimary} ${isDeveloperTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
              <i className={`fa-solid fa-file-pen ${theme.progressIcon}`}></i> Form Pengajuan
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* TIPE IZIN */}
              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mb-1.5 ml-1 transition-colors ${theme.textSecondary}`}>Kategori Request</label>
                <div className="relative group">
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all appearance-none cursor-pointer border ${theme.inputBg}`}
                  >
                    <option value="sakit">Sakit (Wajib Bukti)</option>
                    <option value="izin">Izin Biasa</option>
                    <option value="swap_shift">Swap Shift (Tukar Hari)</option>
                    <option value="tugas_luar">Tugas Luar (Dinas/Kampus)</option>
                  </select>
                  <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${theme.textSecondary}`}></i>
                </div>
              </div>

              {/* TANGGAL PENGGANTI (Swap Shift) */}
              {leaveType === "swap_shift" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-rose-500 block mb-1.5 ml-1">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Tanggal Pengganti
                  </label>
                  <input type="date" value={replacementDate} onChange={e => setReplacementDate(e.target.value)} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none transition-colors ${
                      isDeveloperTheme ? "bg-rose-950/20 border-rose-900/50 text-rose-400 focus:border-rose-500 [color-scheme:dark]" : "bg-rose-50/50 border-rose-200 text-slate-700 focus:border-rose-400"
                    }`} required={leaveType === 'swap_shift'} />
                  <p className={`text-[10px] mt-2 ml-1 italic font-medium ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>*Jadwal lama akan otomatis terhapus jika di-ACC.</p>
                </div>
              )}

              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mb-1.5 ml-1 transition-colors ${theme.textSecondary}`}>Tanggal Izin / Sakit</label>
                <input type="date" value={permissionDate} onChange={e => setPermissionDate(e.target.value)} 
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors border ${theme.inputBg} ${isDeveloperTheme ? "[color-scheme:dark]" : ""}`} required />
              </div>

              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mb-1.5 ml-1 transition-colors ${theme.textSecondary}`}>Alasan</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="Jelaskan secara singkat..." 
                  className={`w-full rounded-xl p-4 text-sm font-medium outline-none resize-none transition-colors border ${theme.inputBg}`} required></textarea>
              </div>

              <div>
                <label className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mb-1.5 ml-1 transition-colors ${theme.textSecondary}`}>
                  Bukti Foto/Surat {leaveType === 'sakit' && <span className="text-rose-500">*</span>}
                </label>

                {/* Drop zone */}
                <label className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all group block ${
                  compressing ? (isDeveloperTheme ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-blue-300 bg-blue-50/50') :
                  evidence    ? (isDeveloperTheme ? 'border-emerald-500/80 bg-emerald-500/5' : 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50') :
                                theme.dropzone
                }`}>
                  {compressing ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <i className={`fa-solid fa-circle-notch fa-spin text-2xl ${theme.progressIcon}`} />
                      <p className={`text-xs font-bold ${theme.progressIcon}`}>Mengompres gambar...</p>
                    </div>
                  ) : evidence ? (
                    <div className="flex items-center gap-3 justify-center">
                      {evidencePreview ? (
                        <img src={evidencePreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-file-pdf text-2xl text-rose-500" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${theme.textPrimary}`}>{evidence.name}</p>
                        <p className={`text-[10px] font-medium mt-0.5 ${theme.textSecondary}`}>{formatSize(evidence.size)}</p>
                        <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${isDeveloperTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          <i className="fa-solid fa-check" />
                          {evidence.size <= 2 * 1024 * 1024 ? 'Ukuran OK (≤ 2MB)' : 'File siap dikirim'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className={`fa-solid fa-cloud-arrow-up text-2xl mb-2 block transition-colors ${theme.textSecondary} group-hover:${theme.progressIcon}`} />
                      <p className={`text-[11px] font-bold transition-colors ${theme.textSecondary} group-hover:${theme.textPrimary}`}>Klik untuk upload atau ambil foto</p>
                      <p className={`text-[10px] font-medium mt-1 opacity-70 ${theme.textSecondary}`}>JPG, PNG, WEBP, PDF (Max 10MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    capture="environment"
                    onChange={e => { if (e.target.files[0]) handleFileChange(e.target.files[0]); e.target.value = ''; }}
                  />
                </label>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <label className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold cursor-pointer transition-colors ${theme.progressIcon} hover:brightness-125`}>
                    <i className="fa-solid fa-images" /> Pilih dari galeri
                    <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={e => { if (e.target.files[0]) handleFileChange(e.target.files[0]); e.target.value = ''; }} />
                  </label>
                  {evidence && (
                    <button type="button" onClick={removeEvidence} className="text-[10px] sm:text-[11px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                      <i className="fa-solid fa-trash-can" /> Hapus
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-3.5 sm:py-4 mt-2 rounded-xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${theme.btnSubmit}`}
              >
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isLoading ? "Memproses..." : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: HISTORY */}
        <div className={`lg:col-span-7 rounded-[2rem] border shadow-sm flex flex-col h-full min-h-[500px] overflow-hidden transition-colors duration-500 ${theme.panelBg}`}>
          <div className={`px-6 py-5 border-b flex justify-between items-center transition-colors duration-500 ${theme.panelHead}`}>
            <h3 className={`font-black flex items-center gap-2.5 text-sm sm:text-base ${theme.textPrimary}`}>
              <i className={`fa-solid fa-clock-rotate-left ${theme.progressIcon}`}></i> My Exceptions
            </h3>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${isDeveloperTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-400'}`}>
              {history.length} Record
            </span>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3 sm:space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                  <i className={`fa-solid fa-envelope-open text-4xl mb-4 ${theme.textSecondary}`} />
                  <p className={`font-bold text-sm ${theme.textPrimary}`}>Belum ada riwayat pengajuan</p>
                  <p className={`text-xs font-medium mt-1 ${theme.textSecondary}`}>Pengajuan izin atau swap shift akan muncul di sini.</p>
                </div>
              ) : history.map((item) => {
                const iconMap = { 'Sakit': 'fa-house-medical', 'Swap Shift': 'fa-code-compare', 'Izin Biasa': 'fa-envelope-open-text', 'Tugas Luar': 'fa-briefcase' };
                
                // Styling Status Dinamis Support Dark/Light
                const st = item.status === 'approved' 
                  ? { box: isDeveloperTheme ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500', badge: isDeveloperTheme ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-600 border-emerald-200', text: '✓ Disetujui' }
                  : item.status === 'rejected'
                  ? { box: isDeveloperTheme ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-500', badge: isDeveloperTheme ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-100 text-rose-600 border-rose-200', text: '✗ Ditolak' }
                  : { box: isDeveloperTheme ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-500', badge: isDeveloperTheme ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-600 border-amber-200', text: '⏳ Pending' };

                return (
                  <div key={item.id} className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-colors group ${theme.cardBg}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex gap-3 sm:gap-4 items-start min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 ${st.box}`}>
                          <i className={`fa-solid ${iconMap[item.type] || 'fa-envelope'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-[13px] sm:text-sm font-black truncate ${theme.textPrimary}`}>{item.type}</h4>
                          <p className={`text-[10px] sm:text-[11px] font-medium mt-0.5 ${theme.textSecondary}`}>
                            <i className="fa-regular fa-calendar mr-1"></i>{item.date}
                          </p>
                          <p className={`text-[11px] sm:text-xs font-bold mt-1.5 italic line-clamp-2 ${isDeveloperTheme ? 'text-zinc-400' : 'text-slate-600'}`}>"{item.note}"</p>
                          
                          {item.proof && (
                            <a href={item.proof} target="_blank" rel="noreferrer" className={`text-[10px] font-black uppercase tracking-wider mt-2 inline-flex items-center gap-1.5 transition-colors ${theme.progressIcon} hover:brightness-125`}>
                              <i className="fa-solid fa-image" /> Lihat Bukti
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shrink-0 w-max sm:w-auto ${st.badge}`}>
                        {st.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveRequest;