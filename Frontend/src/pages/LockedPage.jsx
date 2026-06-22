// src/components/layout/LockedPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LockedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[#070e1d] w-full max-w-md rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 text-center border border-white/[0.05] shadow-2xl relative overflow-hidden">
        
        {/* Glow Effect Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full"></div>

        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-rose-500 animate-bounce"></i>
          </div>

          <h1 className="text-white text-3xl font-black uppercase tracking-tighter italic mb-4">
            Auto <span className="text-rose-500">Lock!</span>
          </h1>
          
          <p className="text-slate-400 text-xs font-medium leading-relaxed mb-10 px-4 uppercase tracking-widest">
            Sistem ndeteksi lu belum ngumpulin tugas/logbook. Beresin kewajiban lu sekarang atau hubungi Admin divisi buat buka gembok.
          </p>

          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-all active:scale-95"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockedPage;