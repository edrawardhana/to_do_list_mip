import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient"; // Sesuaikan path config supabase Anda

const CameraModal = ({ task, onClose, onRefresh }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. LOGIKA VALIDASI WAKTU (24 Jam Hari yang Sama)
  const isTaskExpired = () => {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const taskDate = new Date(task.created_at).toISOString().split("T")[0];
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

      // Upload ke Supabase Storage (Bucket: task-evidence)
      const fileName = `${task.id}_${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from("task-evidence")
        .upload(`public/${fileName}`, compressedFile);

      if (uploadError) throw uploadError;

      // Ambil Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("task-evidence").getPublicUrl(data.path);

      // 4. UPDATE DATABASE metadata
      const { error: dbError } = await supabase
        .from("daily_tasks")
        .update({
          evidance_url: publicUrl,
          status: "pending_approval", // Sesuai flowchart
        })
        .eq("id", task.id);

      if (dbError) throw dbError;

      alert("Bukti berhasil dikirim!");
      onRefresh(); // Refresh data di tabel
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mengunggah foto");
    } finally {
      setLoading(false);
    }
  };

  if (isTaskExpired()) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-sm">
          <h2 className="text-[#0A065D] font-black text-xl mb-2">
            Tugas Kedaluwarsa
          </h2>
          <p className="text-slate-500 text-sm font-bold mb-6">
            Maaf, batas waktu pengambilan foto untuk tugas ini sudah habis
            (Melewati 24 jam).
          </p>
          <button
            onClick={onClose}
            className="bg-[#0A065D] text-white px-8 py-3 rounded-xl font-black"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 bg-[#0A065D] text-white flex justify-between items-center">
          <span className="font-black uppercase text-xs tracking-widest">
            Ambil Bukti Kamera
          </span>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-slate-50 relative">
            {!imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={imgSrc}
                className="w-full h-full object-cover"
                alt="preview"
              />
            )}
          </div>

          <div className="mt-8 space-y-3">
            {!imgSrc ? (
              <button
                onClick={capture}
                className="w-full bg-[#0A065D] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <i className="fa-solid fa-camera text-xl"></i>
                AMBIL FOTO
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setImgSrc(null)}
                  disabled={loading}
                  className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs"
                >
                  Ulangi
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-[2] bg-[#FF7A00] text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
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
