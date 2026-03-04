// src/components/layout/HardLockScreen.jsx
import { useAuth } from "../../contexts/AuthContext";

const HardLockScreen = () => {
  const { user } = useAuth();

  // Jika user tidak di-lock, jangan tampilkan apa-apa
  if (!user?.is_locked) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 z-[9999]">
      <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white text-4xl mb-6 animate-bounce">
        <i className="fa-solid fa-lock"></i>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Akses Terkunci</h1>
      <p className="text-slate-400 max-w-md">
        Akun Anda sedang ditangguhkan oleh Admin. Silakan hubungi koordinator
        divisi Anda untuk informasi lebih lanjut.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
      >
        Refresh Halaman
      </button>
    </div>
  );
};

export default HardLockScreen;
