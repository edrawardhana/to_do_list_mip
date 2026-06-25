import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

const SharedTaskTagging = ({ currentUser, onTagsChange }) => {
  const [search, setSearch]           = useState("");
  const [taggedUsers, setTaggedUsers] = useState([currentUser]);
  const [colleagues, setColleagues]   = useState([]);

  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        const res = await api.get("/profiles");
        const list = res.data?.data || res.data || [];
        setColleagues(
          list
            .filter(p => p.id !== currentUser.id && p.role === 'intern')
            .map(p => ({
              id:       p.id,
              name:     p.full_name || p.username || p.email?.split("@")[0] || "Intern",
              division: p.division?.name || "",
            }))
        );
      } catch {}
    };
    fetchColleagues();
  }, [currentUser.id]);

  const filteredOptions = colleagues.filter(
    intern =>
      !taggedUsers.some(t => t.id === intern.id) &&
      intern.name.toLowerCase().includes(search.toLowerCase())
  );

  const addTag = (user) => {
    const newTags = [...taggedUsers, user];
    setTaggedUsers(newTags);
    onTagsChange(newTags.map(u => u.id));
    setSearch("");
  };

  const removeTag = (idToRemove) => {
    if (idToRemove === currentUser.id) return;
    const newTags = taggedUsers.filter(u => u.id !== idToRemove);
    setTaggedUsers(newTags);
    onTagsChange(newTags.map(u => u.id));
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
        <i className="fa-solid fa-users text-blue-500"></i> Rekan Shift? (opsional)
      </label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {taggedUsers.map(user => (
          <div key={user.id}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold transition-all shadow-sm
              ${user.id === currentUser.id ? "bg-[#0b1437] text-white" : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300"}`}>
            {user.id === currentUser.id && <i className="fa-solid fa-crown text-[8px] sm:text-[10px] text-amber-400"></i>}
            {(user.name || "").split(" ")[0]}
            {user.id !== currentUser.id && (
              <button onClick={() => removeTag(user.id)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors ml-0.5 sm:ml-1">
                <i className="fa-solid fa-xmark text-[9px] sm:text-[10px]"></i>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-[10px] sm:text-xs"></i>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama rekan shift..."
          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg sm:rounded-xl pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
        {search && filteredOptions.length > 0 && (
          <div className="absolute bottom-full mb-1 sm:mb-2 z-10 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar">
            {filteredOptions.map(user => (
              <div key={user.id} onClick={() => addTag(user)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-2 sm:gap-3 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0">
                  {(user.name || "R").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">{user.name}</p>
                  {user.division && <p className="text-[9px] sm:text-[10px] text-slate-400">{user.division}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LiveCameraModal = ({ task, currentUser, onClose, onSubmit }) => {
  const webcamRef   = useRef(null);
  const [imgSrc, setImgSrc]           = useState(null);
  const [description, setDescription] = useState("");
  const [taggedUserIds, setTaggedUserIds] = useState([currentUser.id]);
  const [isLoading, setIsLoading]     = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [aiStatusText, setAiStatusText] = useState("");

  const videoConstraints = { facingMode: "environment", aspectRatio: 16 / 9 };

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) setImgSrc(screenshot);
  }, []);

  const retakeCamera = () => setImgSrc(null);
  const hasImage = !!imgSrc;

  const handleSubmit = async () => {
    if (!imgSrc) return;
    if (description.trim().length < 5) {
      toast.error("Catatan tugas terlalu singkat! Jelaskan kegiatanmu (min. 5 karakter).");
      return;
    }
    
    setIsLoading(true);
    
    try {
      setAiStatusText("AI sedang mengevaluasi logbook Anda...");
      const aiRes = await api.post('/logbook/evaluate', { logbook_text: description.trim() });
      const aiData = aiRes.data.ai_data;
      
      toast.success("Logbook disetujui AI! Memproses pengiriman...", {
        icon: '✅',
        style: { borderRadius: '10px', background: '#f0fdf4', color: '#166534' }
      });

      setAiStatusText("Mengompresi gambar...");
      const res  = await fetch(imgSrc);
      const blob = await res.blob();
      const imageFile  = new File([blob], `laporan-${task?.id || Date.now()}.jpg`, { type: "image/jpeg" });

      const compressOptions = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true, fileType: "image/jpeg" };
      const compressedFile  = await imageCompression(imageFile, compressOptions);

      const formData = new FormData();
      formData.append("evidence_url", compressedFile);
      formData.append("description", description.trim());
      formData.append("confirmed_participants", JSON.stringify(taggedUserIds));
      if (aiData?.summary) formData.append("ai_summary", aiData.summary);

      setAiStatusText("Mengunggah ke server...");
      await onSubmit(formData);

    } catch (error) {
      console.error("Gagal kirim:", error);
      const errData = error.response?.data;

      if (errData && errData.status === 'rejected') {
        const cleanMessage = errData.message.replace('Llama 4 Scout: ', '').replace('Llama 4 Scout', '').trim();
        toast.error(`DITOLAK karena ${cleanMessage}`, {
          icon: '⛔',
          duration: 6000,
          style: { borderRadius: '10px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }
        });
      } else if (errData && errData.errors) {
        const firstError = Object.values(errData.errors)[0][0];
        toast.error(`Validasi Gagal: ${firstError}`, {
          icon: '⚠️',
          style: { borderRadius: '10px', background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }
        });
      } else {
        toast.error(errData?.message || "Terjadi kesalahan sistem, gagal memproses data.");
      }
    } finally {
      setIsLoading(false);
      setAiStatusText("");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#0b1437]/90 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* 🔥 FIX 1: Modal dibikin rounded-[1.5rem] di HP biar gak makan space siku */}
      <div className="bg-white w-full max-w-xl rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* 🔥 FIX 2: Header disunat paddingnya di HP */}
        <div className="px-4 sm:px-6 py-3 sm:py-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onClose} disabled={isLoading}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50">
              <i className="fa-solid fa-arrow-left text-xs sm:text-sm"></i>
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3 border-l border-slate-200 pl-3 sm:pl-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg
                ${task?.status === "revision" ? "bg-rose-100 text-rose-500" : "bg-blue-50 text-blue-600"}`}>
                <i className={`fa-solid ${task?.status === "revision" ? "fa-wrench" : "fa-camera"}`}></i>
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight text-base sm:text-lg leading-none">
                  {task?.status === "revision" ? "Perbaiki Laporan" : "Laporan Bukti"}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5 sm:mt-1 truncate max-w-[150px] sm:max-w-[250px]">
                  {task?.title || "Tugas Harian"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 FIX 3: Gap Body dan padding disusutin di HP */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 bg-slate-50/50 custom-scrollbar">
          
          {/* Kamera Area */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border-[4px] sm:border-[6px] border-white group shrink-0">
            {cameraError && !imgSrc ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 gap-2 sm:gap-3">
                <i className="fa-solid fa-camera-slash text-3xl sm:text-4xl text-slate-500 mb-1"></i>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">Akses kamera ditolak.</p>
              </div>
            ) : !imgSrc ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  onUserMediaError={() => setCameraError(true)}
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <button onClick={capture}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-white/50 flex items-center justify-center hover:border-white shadow-xl bg-black/20 backdrop-blur-sm">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full active:scale-90 transition-transform shadow-inner"></div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={imgSrc} alt="Preview" className="object-cover w-full h-full" />
                <button onClick={retakeCamera} disabled={isLoading}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/40 backdrop-blur-md text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border border-white/20 hover:bg-black/60 shadow-lg disabled:opacity-50">
                  <i className="fa-solid fa-rotate-right mr-1 sm:mr-1.5"></i> Foto Ulang
                </button>
              </>
            )}
          </div>

          {/* Instruksi Admin */}
          {task?.assign_note && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 items-start shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-200/40 rounded-full blur-2xl pointer-events-none"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200 mt-0.5 relative z-10">
                <i className="fa-solid fa-circle-info text-[10px] sm:text-sm"></i>
              </div>
              <div className="relative z-10 w-full">
                <p className="text-[9px] sm:text-[10px] font-black text-sky-800 uppercase tracking-widest mb-0.5 sm:mb-1">Instruksi Admin</p>
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold leading-relaxed break-words">{task.assign_note}</p>
              </div>
            </div>
          )}

          {/* Area Input Laporan */}
          <div className="relative">
            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <i className="fa-solid fa-pen-clip text-blue-500"></i> Catatan Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            {/* 🔥 FIX 4: Textarea dipendekin di HP (h-20) */}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Ceritakan detail teknis apa yang dikerjakan..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-700 outline-none resize-none h-20 sm:h-28 shadow-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            
            {isLoading && aiStatusText && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center border border-blue-200 animate-in fade-in mt-5 sm:mt-6 z-10">
                 <i className="fa-solid fa-robot text-blue-500 text-lg sm:text-xl animate-bounce mb-1.5 sm:mb-2"></i>
                 <p className="text-[10px] sm:text-xs font-bold text-blue-700 animate-pulse">{aiStatusText}</p>
              </div>
            )}
          </div>

          <SharedTaskTagging currentUser={currentUser} onTagsChange={setTaggedUserIds} />
        </div>

        {/* 🔥 FIX 5: Footer & Tombol dirampingin */}
        <div className="p-3 sm:p-5 bg-white border-t border-slate-100 shrink-0 flex gap-2 sm:gap-3">
          <button onClick={onClose} disabled={isLoading}
            className="px-4 sm:px-5 py-2.5 sm:py-3.5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-xl text-xs sm:text-[14px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasImage || isLoading || description.trim().length < 5}
            className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-[14px] font-bold shadow-lg flex items-center justify-center gap-2 transition-all
              ${hasImage && !isLoading && description.trim().length >= 5
                ? "bg-[#0b1437] text-white hover:bg-blue-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
            {isLoading
              ? <><i className="fa-solid fa-circle-notch fa-spin text-sm sm:text-lg"></i> Memproses...</>
              : <><i className="fa-solid fa-paper-plane text-sm sm:text-lg"></i> Kirim</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LiveCameraModal;