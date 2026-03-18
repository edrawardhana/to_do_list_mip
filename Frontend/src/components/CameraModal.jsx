import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";

const CameraModal = ({ task, onClose, onRefresh }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. LOGIKA VALIDASI WAKTU (Cek apakah tugas dari hari yang berbeda)
  const isTaskExpired = () => {
    if (!task?.created_at) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(task.created_at).toDateString();
    return today !== taskDate;
  };

  // 2. PROSES CAPTURE
  const capture = useCallback(() => {
    const image = webcamRef.current.getScreenshot();
    setImgSrc(image);
  }, [webcamRef]);

  // 3. PROSES KOMPRESI & UPLOAD
  const handleUpload = async () => {
    if (!imgSrc) return;
    setLoading(true);

    try {
      // Ubah Base64 ke File Object
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });

      // Kompresi ke 500kb sesuai Flowchart
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // --- PERBAIKAN PENTING DI SINI ---
      // Nama Bucket harus CAPITAL: "TASK_EVIDENCE"
      // Jangan gunakan prefix "public/" jika folder tidak ada di Dashboard
      const fileName = `task_${task.id}_${Date.now()}.jpg`;

      const { data, error: uploadError } = await supabase.storage
        .from("TASK_EVIDENCE")
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // Ambil Public URL menggunakan nama bucket yang sama
      const {
        data: { publicUrl },
      } = supabase.storage.from("TASK_EVIDENCE").getPublicUrl(fileName);

      // 4. UPDATE DATABASE metadata
      const { error: dbError } = await supabase
        .from("daily_tasks")
        .update({
          evidance_url: publicUrl,
          status: "pending_approval", // Status otomatis berubah
        })
        .eq("id", task.id);

      if (dbError) throw dbError;

      alert("Bukti berhasil dikirim!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Detail Error:", error);
      alert(`Gagal: ${error.message || "Masalah koneksi"}`);
    } finally {
      setLoading(false);
    }
  };

  // Tampilan jika tugas sudah lewat hari
  if (isTaskExpired()) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-sm shadow-2xl border-4 border-white">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h2 className="text-[#0A065D] font-black text-xl mb-2 uppercase tracking-tight">
            Tugas Kedaluwarsa
          </h2>
          <p className="text-slate-500 text-sm font-bold mb-6">
            Batas waktu pengambilan foto untuk tugas ini sudah habis (Hanya
            berlaku di hari yang sama).
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[#0A065D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A065D]/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
        <div className="p-6 bg-white border-b border-slate-50 flex justify-between items-center">
          <span className="font-black uppercase text-[10px] text-[#0A065D] tracking-[0.2em]">
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
          <div className="aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-50 relative shadow-inner">
            {!imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
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

          <div className="mt-8 space-y-3">
            {!imgSrc ? (
              <button
                onClick={capture}
                className="w-full bg-[#0A065D] text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-200"
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
                  className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-colors hover:bg-slate-200"
                >
                  Ulangi
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-[2] bg-[#FF7A00] text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95"
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
