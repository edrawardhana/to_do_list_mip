import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { createPortal } from "react-dom";
import api from "../../api/axios";

/* ─────────────────────────────────────────────────────────────────────────
   SharedTaskTagging — fetch rekan dari API, bukan hardcoded
───────────────────────────────────────────────────────────────────────── */
const SharedTaskTagging = ({ currentUser, onTagsChange }) => {
  const [search, setSearch]           = useState("");
  const [taggedUsers, setTaggedUsers] = useState([currentUser]);
  const [colleagues, setColleagues]   = useState([]);

  // Fetch intern satu divisi dari API
  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        const res = await api.get("/profiles", { params: { role: "intern" } });
        const list = res.data?.data || res.data || [];
        // Exclude diri sendiri
        setColleagues(list.filter(p => p.id !== currentUser.id).map(p => ({
          id:       p.id,
          name:     p.full_name || p.username || p.email?.split("@")[0] || "Intern",
          division: p.division?.name || "",
        })));
      } catch {
        // Gagal fetch — biarkan kosong, tidak crash
      }
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
    <div className="space-y-3">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
        <i className="fa-solid fa-users text-blue-500"></i> Kerja Bareng Siapa? (opsional)
      </label>
      <div className="flex flex-wrap gap-2">
        {taggedUsers.map(user => (
          <div key={user.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm
              ${user.id === currentUser.id ? "bg-[#0b1437] text-white" : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300"}`}>
            {user.id === currentUser.id && <i className="fa-solid fa-crown text-[10px] text-amber-400"></i>}
            {(user.name || "").split(" ")[0]}
            {user.id !== currentUser.id && (
              <button onClick={() => removeTag(user.id)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors ml-1">
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs"></i>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama rekan shift..."
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
        {search && filteredOptions.length > 0 && (
          <div className="absolute bottom-full mb-2 z-10 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
            {filteredOptions.map(user => (
              <div key={user.id} onClick={() => addTag(user)}
                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-50">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                  {(user.name || "R").charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              </div>
            ))}
          </div>
        )}
        {search && filteredOptions.length === 0 && (
          <div className="absolute bottom-full mb-2 z-10 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-center">
            <p className="text-xs text-slate-400">Tidak ada rekan ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   LiveCameraModal — kamera live + upload file + submit ke backend
───────────────────────────────────────────────────────────────────────── */
const LiveCameraModal = ({ task, currentUser, onClose, onSubmit }) => {
  const webcamRef   = useRef(null);
  const fileInputRef = useRef(null);

  // "camera" | "upload"
  const [mode, setMode]               = useState("camera");
  const [imgSrc, setImgSrc]           = useState(null);       // base64 preview (kamera)
  const [uploadFile, setUploadFile]   = useState(null);       // File object (upload)
  const [uploadPreview, setUploadPreview] = useState(null);   // URL.createObjectURL
  const [description, setDescription] = useState(
    task?.assign_note || `Berhasil melaksanakan tugas ${task?.title || ""}`
  );
  const [taggedUserIds, setTaggedUserIds] = useState([currentUser.id]);
  const [isLoading, setIsLoading]     = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoConstraints = { facingMode: "environment", aspectRatio: 16 / 9 };

  // Bersihkan object URL saat unmount
  useEffect(() => {
    return () => { if (uploadPreview) URL.revokeObjectURL(uploadPreview); };
  }, [uploadPreview]);

  /* ── Kamera ── */
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) setImgSrc(screenshot);
  }, []);

  const retakeCamera = () => setImgSrc(null);

  /* ── Upload File ── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Format file harus JPEG, PNG, GIF, atau WEBP.");
      return;
    }
    // Validasi ukuran (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10 MB.");
      return;
    }

    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const clearUpload = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Switch mode ── */
  const switchMode = (newMode) => {
    setMode(newMode);
    setImgSrc(null);
    clearUpload();
    setCameraError(false);
  };

  /* ── Apakah ada gambar yang siap dikirim ── */
  const hasImage = mode === "camera" ? !!imgSrc : !!uploadFile;

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!hasImage) return;
    if (!description.trim()) {
      alert("Catatan pelaksanaan tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    try {
      let imageFile;

      if (mode === "camera") {
        // Konversi base64 → File
        const res  = await fetch(imgSrc);
        const blob = await res.blob();
        imageFile  = new File([blob], `laporan-${task.id}.jpg`, { type: "image/jpeg" });
      } else {
        imageFile = uploadFile;
      }

      // Kompres gambar di sisi client sebelum upload
      const compressOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile  = await imageCompression(imageFile, compressOptions);

      // Bangun FormData — field name HARUS "evidence_url" sesuai backend
      const formData = new FormData();
      formData.append("evidence_url", compressedFile, `laporan-${task.id}.jpg`);
      formData.append("description", description.trim());
      formData.append("confirmed_participants", JSON.stringify(taggedUserIds));

      // onSubmit bertanggung jawab menutup modal setelah sukses
      await onSubmit(formData);

    } catch (error) {
      // Hanya tampilkan error jika bukan error yang sudah ditangani parent
      console.error("Gagal kirim:", error);
      if (!error._handled) {
        alert("Terjadi kesalahan, coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Render ── */
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#0b1437]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                ${task?.status === "revision" ? "bg-rose-100 text-rose-500" : "bg-blue-50 text-blue-600"}`}>
                <i className={`fa-solid ${task?.status === "revision" ? "fa-wrench" : "fa-camera"}`}></i>
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight text-lg leading-none">
                  {task?.status === "revision" ? "Perbaiki Laporan" : "Laporan Bukti"}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[150px] sm:max-w-[250px]">
                  {task?.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5 bg-slate-50/50">

          {/* ── Mode Switcher ── */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => switchMode("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode === "camera" ? "bg-white text-[#0b1437] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <i className="fa-solid fa-camera text-sm"></i> Kamera Live
            </button>
            <button onClick={() => switchMode("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode === "upload" ? "bg-white text-[#0b1437] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <i className="fa-solid fa-upload text-sm"></i> Upload Foto
            </button>
          </div>

          {/* ── Area Gambar ── */}
          {mode === "camera" ? (
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-[6px] border-white group shrink-0">
              {cameraError && !imgSrc ? (
                /* Kamera error — tampilkan fallback upload */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <i className="fa-solid fa-camera-slash text-4xl text-slate-500 mb-1"></i>
                  <p className="text-sm text-slate-300 font-medium">Akses kamera ditolak atau tidak tersedia.</p>
                  <button onClick={() => switchMode("upload")}
                    className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                    <i className="fa-solid fa-upload mr-1.5"></i> Upload Foto Saja
                  </button>
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
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    <button onClick={capture}
                      className="w-14 h-14 rounded-full border-[3px] border-white/50 flex items-center justify-center hover:border-white shadow-xl bg-black/20 backdrop-blur-sm">
                      <div className="w-10 h-10 bg-white rounded-full active:scale-90 transition-transform shadow-inner"></div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={imgSrc} alt="Preview" className="object-cover w-full h-full" />
                  <button onClick={retakeCamera}
                    className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 hover:bg-black/60 shadow-lg">
                    <i className="fa-solid fa-rotate-right mr-1.5"></i> Foto Ulang
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Mode Upload ── */
            <div className="w-full">
              {!uploadPreview ? (
                <label
                  htmlFor="evidence-file-input"
                  className="flex flex-col items-center justify-center w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                  <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-400 group-hover:text-blue-500 mb-3 transition-colors"></i>
                  <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Klik untuk pilih foto</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, GIF, WEBP — maks. 10 MB</p>
                  <input
                    id="evidence-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-[6px] border-white">
                  <img src={uploadPreview} alt="Preview" className="object-cover w-full h-full" />
                  <button onClick={clearUpload}
                    className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 hover:bg-black/60 shadow-lg">
                    <i className="fa-solid fa-rotate-right mr-1.5"></i> Ganti Foto
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 max-w-[80%] truncate">
                    <i className="fa-solid fa-file-image mr-1.5"></i>
                    {uploadFile?.name}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Assign Note (read-only jika ada) ── */}
          {task?.assign_note && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2.5 items-start">
              <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 shrink-0"></i>
              <div>
                <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-0.5">Instruksi Admin</p>
                <p className="text-xs text-blue-700">{task.assign_note}</p>
              </div>
            </div>
          )}

          {/* ── Catatan Pelaksanaan ── */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-pen-clip text-blue-500"></i> Catatan Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Jelaskan apa yang sudah dikerjakan..."
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none resize-none h-24 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ── Tagging Rekan ── */}
          <SharedTaskTagging currentUser={currentUser} onTagsChange={setTaggedUserIds} />
        </div>

        {/* ── Footer ── */}
        <div className="p-5 bg-white border-t border-slate-100 shrink-0 flex gap-3">
          <button onClick={onClose} disabled={isLoading}
            className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-bold hover:bg-slate-200 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasImage || isLoading}
            className={`flex-1 py-3.5 rounded-xl text-[14px] font-bold shadow-lg flex items-center justify-center gap-2 transition-all
              ${hasImage && !isLoading
                ? "bg-[#0b1437] text-white hover:bg-blue-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
            {isLoading
              ? <><i className="fa-solid fa-circle-notch fa-spin text-lg"></i> Memproses...</>
              : <><i className="fa-solid fa-paper-plane text-lg"></i> Kirim Laporan</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LiveCameraModal;
