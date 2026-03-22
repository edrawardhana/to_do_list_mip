import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";

const CameraModal = ({ task, onClose, onRefresh }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // 1. KONFIGURASI KAMERA
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user", // Gunakan "environment" jika ingin kamera belakang di mobile
  };

  // 2. VALIDASI WAKTU (Cek apakah tugas dari hari yang berbeda)
  const isTaskExpired = () => {
    if (!task?.created_at) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(task.created_at).toDateString();
    return today !== taskDate;
  };

  // 3. HANDLER ERROR KAMERA
  const handleUserMediaError = useCallback((error) => {
    console.error("Camera Error Detail:", error);
    setCameraError(error.name || "Unknown Error");
  }, []);

  // 4. PROSES AMBIL FOTO
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      setImgSrc(image);
    }
  }, [webcamRef]);

  // 5. PROSES KOMPRESI & UPLOAD KE SUPABASE
  const handleUpload = async () => {
    if (!imgSrc) return;
    setLoading(true);

    try {
      // Ubah Base64 ke File Object
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });

      // Kompresi (Target < 500kb)
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Path Penyimpanan: folder/nama_file
      const fileName = `${task.id}/${Date.now()}.jpg`;

      // Upload ke Bucket "TASK_EVIDENCE"
      const { data, error: uploadError } = await supabase.storage
        .from("task_evidence")
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // Ambil Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("task_evidence").getPublicUrl(fileName);

      // Update Database
      const { error: dbError } = await supabase
        .from("daily_tasks")
        .update({
          evidance_url: publicUrl,
          status: "pending_approval",
        })
        .eq("id", task.id);

      if (dbError) throw dbError;

      alert("Bukti berhasil dikirim!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Upload Error:", error);
      alert(`Gagal: ${error.message || "Terjadi kesalahan sistem"}`);
    } finally {
      setLoading(false);
    }
  };

  // Tampilan jika tugas kedaluwarsa
  if (isTaskExpired()) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-sm border-4 border-white shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h2 className="text-[#1b254b] font-black text-xl mb-2 uppercase tracking-tight">
            Tugas Kedaluwarsa
          </h2>
          <p className="text-slate-500 text-sm font-bold mb-6">
            Batas waktu pengambilan foto hanya berlaku di hari yang sama.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[#1b254b] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1b254b]/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
        {/* Header Modal */}
        <div className="p-6 bg-white border-b border-slate-50 flex justify-between items-center">
          <span className="font-black uppercase text-[10px] text-[#1b254b] tracking-[0.2em]">
            Verify Daily Task
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8">
          {/* Area Kamera / Preview */}
          <div className="aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-50 relative shadow-inner flex items-center justify-center">
            {cameraError ? (
              <div className="text-center p-6 text-white">
                <i className="fa-solid fa-video-slash text-3xl mb-3 text-red-400"></i>
                <p className="text-xs font-bold uppercase opacity-60">
                  Kamera Tidak Diakses
                </p>
                <p className="text-[10px] mt-2 text-slate-400">
                  Pastikan izin kamera aktif dan gunakan HTTPS/Localhost.
                </p>
              </div>
            ) : !imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleUserMediaError}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={imgSrc}
                className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300"
                alt="preview"
              />
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="mt-8 space-y-3">
            {!imgSrc ? (
              <button
                onClick={capture}
                disabled={!!cameraError}
                className={`w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                  cameraError
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-[#1b254b] text-white shadow-blue-200"
                }`}
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-camera text-xl"></i>
                </div>
                AMBIL FOTO
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setImgSrc(null)}
                  disabled={loading}
                  className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Ulangi
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-[2] bg-[#FF7A00] text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
                >
                  {loading ? "Mengirim..." : "Kirim Bukti"}
                  {!loading && <i className="fa-solid fa-paper-plane"></i>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
