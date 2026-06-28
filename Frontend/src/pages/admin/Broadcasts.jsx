import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // ✅ Masuk mesin turbo
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const Broadcasts = () => {
  const { user, isAdmin, isSuperAdmin, userTheme } = useAuth();
  const queryClient = useQueryClient(); // Alat tempur auto-sync data
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS
  // ==========================================
  const isPinkTheme = userTheme === "super_admin";
  
  const theme = {
    super_admin: {
      primary: "pink-500",
      primaryHover: "pink-600",
      primaryRing: "focus:ring-pink-500/20",
      checkbox: "text-pink-500 focus:ring-pink-400",
      text: "text-pink-500",
      borderHover: "hover:border-pink-200",
      bgSub: "bg-pink-50",
      borderSub: "border-pink-100",
      textSub: "text-pink-600",
      btnClass: "bg-pink-500 hover:bg-pink-600 shadow-pink-500/20"
    },
    admin: {
      primary: "blue-600",
      primaryHover: "blue-700",
      primaryRing: "focus:ring-blue-500/20",
      checkbox: "text-blue-600 focus:ring-blue-500",
      text: "text-blue-600",
      borderHover: "hover:border-blue-200",
      bgSub: "bg-blue-50",
      borderSub: "border-blue-100",
      textSub: "text-blue-600",
      btnClass: "bg-[#162447] hover:bg-[#1a3a6c] shadow-[#162447]/30"
    },
    intern: {
      primary: "cyan-500",
      primaryHover: "cyan-600",
      primaryRing: "focus:ring-cyan-500/20",
      checkbox: "text-cyan-500 focus:ring-cyan-400",
      text: "text-cyan-500",
      borderHover: "hover:border-cyan-200",
      bgSub: "bg-cyan-50",
      borderSub: "border-cyan-100",
      textSub: "text-cyan-600",
      btnClass: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20"
    }
  }[userTheme] || {
    primary: "pink-500",
    primaryHover: "pink-600",
    primaryRing: "focus:ring-pink-500/20",
    checkbox: "text-pink-500 focus:ring-pink-400",
    text: "text-pink-500",
    borderHover: "hover:border-pink-200",
    bgSub: "bg-pink-50",
    borderSub: "border-pink-100",
    textSub: "text-pink-600",
    btnClass: "bg-pink-500 hover:bg-pink-600 shadow-pink-500/20"
  };

  // Form States (Tetap dipertahankan karena urusan input form lokal)
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState(isSuperAdmin ? "global" : "division_locked");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("info");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["broadcastsSystemData"],
    queryFn: async () => {
      const [divRes, internRes, histRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/profiles'),
        api.get('/broadcasts/history')
      ]);
      return {
        divisions: divRes.data?.data || divRes.data || [],
        interns: internRes.data?.data || internRes.data || [],
        history: histRes.data?.data || histRes.data || []
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── 2. OLAH DATA INSTAN DI MEMORI RAM (Derived States) ──
  const allDivisions = data?.divisions || [];
  const allInterns = (data?.interns || []).filter(u => u.role === "intern");
  const history = data?.history || [];

  // Reset target select jika tipe target berubah
  useEffect(() => {
    setSelectedTargets([]);
  }, [targetType]);

  const handleToggleTarget = (id) => {
    setSelectedTargets(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── 3. HANDLER MUTASI (Pake InvalidateQueries Biar Auto Sync) ──
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Judul dan pesan wajib diisi brok!");
      return;
    }

    setIsSubmitting(true);
    const tid = toast.loading("Mengirim broadcast pesan...");

    try {
      const payload = {
        title: title,
        content: message,
        targetType: targetType, 
        targets: ["global", "division_locked"].includes(targetType) ? [] : selectedTargets,
        category: category || "info" 
      };

      await api.post('/broadcasts', payload);
      
      toast.success("🚀 Broadcast berhasil dikirim secara real-time!", { id: tid });
      
      setTitle("");
      setMessage("");
      setSelectedTargets([]);
      setCategory("info"); 

      queryClient.invalidateQueries({ queryKey: ["broadcastsSystemData"] });

    } catch (error) {
      // Debug log untuk melihat error detail
      console.error('Broadcast Error:', error.response?.data);
      
      // Cek validation errors
      const errors = error.response?.data?.errors;
      let errorMsg = "Gagal mengirim broadcast";
      
      if (errors) {
        // Ambil error pertama dari field manapun
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          errorMsg = `Error di ${firstErrorField}: ${errors[firstErrorField][0]}`;
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.log('Final Error Message:', errorMsg);
      toast.error(errorMsg, { id: tid });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* ── HERO SECTION ── */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 ${
        isPinkTheme ? "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-300 shadow-pink-200/50" : "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-blue-400/20"
      }`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-white/40" : "bg-blue-500/20"}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-rose-100/30" : "bg-sky-500/10"}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 border-b border-white/10">
          
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm ${isPinkTheme ? "bg-white/20 border-white/40" : "bg-white/10 border-white/20"}`}>
                <i className="fa-solid fa-bullhorn text-lg sm:text-xl" />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border ${isPinkTheme ? "text-pink-50 bg-white/20 border-pink-200" : "text-blue-200 bg-white/10 border-white/10"}`}>
                Broadcast Engine
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 sm:mb-3 leading-tight">Pusat Komando.</h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isPinkTheme ? "text-pink-50" : "text-blue-100/70"}`}>
              Kirim pengumuman, instruksi darurat, atau informasi penting secara real-time {isPinkTheme ? "ke seluruh divisi" : `ke divisi ${myDivision}`}.
            </p>
          </div>
          
          {/* 🔥 FIX RESPONSIVE: BAGIAN KANAN HERO */}
          <div className="flex flex-col gap-4 w-full lg:w-auto shrink-0 mt-2 lg:mt-0 lg:items-end">
            
            {/* Radio Button Toggle (Info vs Urgent) - Dibuat flex-1 biar merata di HP */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 lg:text-right">Kategori Prioritas:</span>
              <div className="flex w-full sm:w-auto bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                
                <label className={`flex-1 sm:flex-none relative px-3 sm:px-5 py-2.5 rounded-xl cursor-pointer transition-all text-center ${category === 'info' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>
                  <input type="radio" name="category" value="info" checked={category === 'info'} onChange={(e) => setCategory(e.target.value)} className="hidden" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2"><i className="fa-solid fa-circle-info" /> Info Biasa</span>
                </label>
                
                <label className={`flex-1 sm:flex-none relative px-3 sm:px-5 py-2.5 rounded-xl cursor-pointer transition-all text-center ${category === 'urgent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                  <input type="radio" name="category" value="urgent" checked={category === 'urgent'} onChange={(e) => setCategory(e.target.value)} className="hidden" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2"><i className="fa-solid fa-triangle-exclamation fa-beat-fade" /> URGENT</span>
                </label>

              </div>
            </div>

            {/* Tombol Sync - Dibuat full width di layar HP */}
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries(["broadcastsSystemData"])}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg active:scale-95 shrink-0 bg-white/10 hover:bg-white/20 border-white/20 text-white w-full sm:w-auto"
            >
              <i className="fa-solid fa-arrows-rotate" /> Sync History
            </button>
            
          </div>

        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* KOLOM KIRI: INPUT BROADCAST FORM */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm">
          <h3 className="text-base font-black text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
            <i className={`fa-solid fa-paper-plane text-${theme.primary}`} /> Buat Broadcast Baru
          </h3>

          <form onSubmit={handleSendBroadcast} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Judul Pengumuman</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Misal: Info Maintenance Server" className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 ${theme.primaryRing} transition-all`} />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Target Penerima</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isSuperAdmin ? (
                  <>
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${targetType === 'global' ? 'bg-pink-50 border-pink-500 ring-1 ring-pink-500' : 'bg-white border-slate-200 hover:bg-slate-50'} sm:col-span-2`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" name="target" value="global" checked={targetType === 'global'} onChange={(e) => setTargetType(e.target.value)} className={theme.checkbox} />
                        <span className="text-sm font-black text-slate-800">Global</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6 leading-relaxed">Kirim ke semua divisi & personel</p>
                    </label>
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${targetType === 'division' ? 'bg-pink-50 border-pink-500 ring-1 ring-pink-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" name="target" value="division" checked={targetType === 'division'} onChange={(e) => setTargetType(e.target.value)} className={theme.checkbox} />
                        <span className="text-sm font-black text-slate-800">Spesifik Divisi</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6 leading-relaxed">Pilih divisi tertentu</p>
                    </label>
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${targetType === 'personal' ? 'bg-pink-50 border-pink-500 ring-1 ring-pink-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" name="target" value="personal" checked={targetType === 'personal'} onChange={(e) => setTargetType(e.target.value)} className={theme.checkbox} />
                        <span className="text-sm font-black text-slate-800">Personal</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6 leading-relaxed">Pilih individu tertentu</p>
                    </label>
                  </>
                ) : (
                  <>
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${targetType === 'division_locked' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" name="target" value="division_locked" checked={targetType === 'division_locked'} onChange={(e) => setTargetType(e.target.value)} className={theme.checkbox} />
                        <span className="text-sm font-black text-slate-800">Semua Anak {myDivision}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6 leading-relaxed">Kirim ke semua intern di divisi Anda</p>
                    </label>
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${targetType === 'personal_locked' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" name="target" value="personal_locked" checked={targetType === 'personal_locked'} onChange={(e) => setTargetType(e.target.value)} className={theme.checkbox} />
                        <span className="text-sm font-black text-slate-800">Personal ({myDivision})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6 leading-relaxed">Pilih individu di divisi Anda</p>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Target Selectors Dinamis */}
            {targetType === "division" && isSuperAdmin && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Target Divisi</p>
                <div className="space-y-2">
                  {allDivisions.map(d => (
                    <label key={d.id} className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={selectedTargets.includes(d.id)} onChange={() => handleToggleTarget(d.id)} className={`rounded ${theme.checkbox}`} /> {d.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(targetType === "personal" || targetType === "personal_locked") && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Personel Magang</p>
                <div className="space-y-2">
                  {allInterns
                    .filter(i => isSuperAdmin || i.division_id === user?.division_id || i.division_name === myDivision)
                    .map(i => (
                      <label key={i.id} className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={selectedTargets.includes(i.id)} onChange={() => handleToggleTarget(i.id)} className={`rounded ${theme.checkbox}`} /> {i.full_name || i.name} ({i.division?.name || i.division_name || 'Intern'})
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Isi Pesan Broadcast</label>
              <div className="relative">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows="5" placeholder="Tulis instruksi atau pengumuman Anda di sini secara lugas..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-sm font-medium text-slate-700 outline-none resize-none focus:ring-2 ${theme.primaryRing} transition-all`} />
                <div className={`absolute bottom-3 right-4 text-[11px] font-black ${message.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                  {message.length}/150
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || loading || message.length > 150} className={`w-full py-4 text-white rounded-xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${message.length > 150 ? 'bg-slate-400 opacity-50 cursor-not-allowed' : theme.btnClass}`}>
              {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-bullhorn" />}
              {isSubmitting ? "Mengirim Pesan..." : "Luncurkan Broadcast"}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: HISTORY BROADCAST LOGS */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full lg:max-h-[680px]">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-[2rem]">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <i className="fa-solid fa-clock-rotate-left text-slate-400" /> Log Riwayat Broadcast
            </h3>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12"><i className={`fa-solid fa-spinner fa-spin text-2xl text-${theme.primary}`} /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 opacity-50">
                  <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-3 block" />
                  <p className="font-black text-slate-500 text-xs">Belum ada riwayat pengiriman pesan.</p>
                </div>
              ) : (
                history.map((log, idx) => (
                  <div key={log.id || idx} className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm ${theme.borderHover} transition-colors flex flex-col min-h-[140px]`}>
                    <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <h4 className="font-black text-slate-800 text-[14px] leading-tight mb-1">{log.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    {log.content && <p className="text-xs sm:text-[13px] font-medium leading-relaxed mb-4 line-clamp-3 text-slate-500 italic">"{log.content}"</p>}
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target:</span>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-md border truncate max-w-[120px] text-${theme.textSub} bg-${theme.bgSub} border-${theme.borderSub}`}>{log.target || 'Global'}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-white bg-slate-100 text-slate-600">{(log.sender || 'A').charAt(0).toUpperCase()}</div>
                        <span className="text-[10px] font-black text-slate-500 truncate max-w-[80px]">{log.sender || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Broadcasts;