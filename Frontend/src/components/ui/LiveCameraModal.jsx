import React, { useRef, useState, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { createPortal } from "react-dom";

const SharedTaskTagging = ({ currentUser, onTagsChange }) => {
  const [search, setSearch] = useState("");
  const [taggedUsers, setTaggedUsers] = useState([currentUser]);

  const activeInterns = [
    { id: "2", name: "Nabil Pratama", division: "IT Support" },
    { id: "3", name: "Edra Maulana", division: "IT Support" },
  ];

  const filteredOptions = useMemo(() => {
    return activeInterns.filter(
      (intern) =>
        intern.division === currentUser.division && 
        !taggedUsers.some((t) => t.id === intern.id) &&
        intern.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, taggedUsers, currentUser]);

  const addTag = (user) => {
    const newTags = [...taggedUsers, user];
    setTaggedUsers(newTags);
    onTagsChange(newTags.map(u => u.id));
    setSearch("");
  };

  const removeTag = (idToRemove) => {
    if (idToRemove === currentUser.id) return; 
    const newTags = taggedUsers.filter((u) => u.id !== idToRemove);
    setTaggedUsers(newTags);
    onTagsChange(newTags.map(u => u.id));
  };

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block flex items-center gap-2">
        <i className="fa-solid fa-users text-blue-500"></i> Kerja Bareng Siapa?
      </label>
      <div className="flex flex-wrap gap-2">
        {taggedUsers.map((user) => (
          <div key={user.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${user.id === currentUser.id ? 'bg-[#0b1437] text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'}`}>
            {user.id === currentUser.id && <i className="fa-solid fa-crown text-[10px] text-amber-400"></i>}
            {user.name.split(" ")[0]} 
            {user.id !== currentUser.id && (
              <button onClick={() => removeTag(user.id)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors ml-1">
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
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama rekan shift..."
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {search && filteredOptions.length > 0 && (
          <div className="absolute bottom-full mb-2 z-10 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
            {filteredOptions.map((user) => (
              <div key={user.id} onClick={() => addTag(user)} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-50">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{(user?.name || "R").charAt(0)}</div>
                <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LiveCameraModal = ({ task, currentUser, onClose, onSubmit }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [description, setDescription] = useState(`Berhasil melaksanakan tugas ${task?.title}`);
  const [taggedUserIds, setTaggedUserIds] = useState([currentUser.id]); 
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoConstraints = { facingMode: "environment", aspectRatio: 16 / 9 };
  const capture = useCallback(() => setImgSrc(webcamRef.current.getScreenshot()), [webcamRef]);
  const retake = () => setImgSrc(null);

  const handleSubmit = async () => {
    if (!imgSrc) return;
    setIsLoading(true);
    try {
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const imageFile = new File([blob], `laporan-${task.id}.jpg`, { type: "image/jpeg" });
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressedFile = await imageCompression(imageFile, options);

      const formData = new FormData();
      formData.append("task_id", task.id);
      formData.append("photo", compressedFile);
      formData.append("description", description);
      formData.append("tagged_user_ids", JSON.stringify(taggedUserIds));

      await onSubmit(formData);
    } catch (error) {
      console.error("Gagal kirim:", error);
      alert("Terjadi kesalahan sistem, coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#0b1437]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task?.status === "revision" ? 'bg-rose-100 text-rose-500' : 'bg-blue-50 text-blue-600'}`}>
                <i className={`fa-solid ${task?.status === "revision" ? "fa-wrench" : "fa-camera"}`}></i>
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight text-lg leading-none">{task?.status === "revision" ? "Perbaiki Laporan" : "Laporan Bukti"}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[150px] sm:max-w-[250px]">{task?.title}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col gap-6 bg-slate-50/50">
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-[6px] border-white group shrink-0">
            {cameraError && !imgSrc ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <i className="fa-solid fa-camera-slash text-4xl text-slate-600 mb-3"></i>
                <p className="text-sm text-slate-400 font-medium">Akses kamera ditolak.</p>
              </div>
            ) : !imgSrc ? (
              <>
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} onUserMediaError={() => setCameraError(true)} className="object-cover w-full h-full" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <button onClick={capture} className="w-14 h-14 rounded-full border-[3px] border-white/50 flex items-center justify-center hover:border-white shadow-xl bg-black/20 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-white rounded-full active:scale-90 transition-transform shadow-inner"></div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={imgSrc} alt="Preview" className="object-cover w-full h-full" />
                <button onClick={retake} className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 hover:bg-black/60 shadow-lg">
                  <i className="fa-solid fa-rotate-right mr-1.5"></i> Foto Ulang
                </button>
              </>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-2"><i className="fa-solid fa-pen-clip text-blue-500"></i> Catatan Pelaksanaan</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none resize-none h-24 custom-scrollbar shadow-sm"></textarea>
          </div>
          <SharedTaskTagging currentUser={currentUser} onTagsChange={setTaggedUserIds} />
        </div>
        <div className="p-5 bg-white border-t border-slate-100 shrink-0 flex gap-3">
          <button onClick={onClose} disabled={isLoading} className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-bold hover:bg-slate-200 flex items-center justify-center gap-2">Batal</button>
          <button onClick={handleSubmit} disabled={!imgSrc || isLoading} className="flex-1 py-3.5 bg-[#0b1437] text-white rounded-xl text-[14px] font-bold shadow-lg hover:bg-blue-600 flex items-center justify-center gap-2">
            {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin text-lg"></i> Memproses...</> : <><i className="fa-solid fa-paper-plane text-lg"></i> Kirim Laporan Selesai</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LiveCameraModal;