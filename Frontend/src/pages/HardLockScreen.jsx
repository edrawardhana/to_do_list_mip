// src/components/layout/HardLockScreen.jsx
import { useAuth } from "../contexts/AuthContext";

const HardLockScreen = () => {
  const { user } = useAuth();

  if (!user?.is_locked) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 z-[9999]">
      <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white text-4xl mb-6 animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.5)]">
        <i className="fa-solid fa-ban"></i>
      </div>
      <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Akses Dibekukan!</h1>
      <p className="text-slate-400 max-w-md font-medium leading-relaxed mb-8">
        Akun sedang ditangguhkan secara manual oleh jajaran pimpinan. Silakan hubungi Superadmin atau Admin buat klarifikasi.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-white text-slate-900 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
      >
        Cek Status Akun
      </button>
    </div>
  );
};

export default HardLockScreen;