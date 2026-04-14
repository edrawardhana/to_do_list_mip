import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const Broadcasts = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();

  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // ==========================================
  // LOGIC WARNA TEMA DINAMIS BERDASARKAN KASTA
  // ==========================================
  const isDeveloperTheme = isDeveloper; // Tema Dimmed Zinc
  const isPurpleTheme = isSuperAdmin && !isDeveloperTheme; // Kasta 2: Ungu
  const isBlueTheme = isAdmin && !isSuperAdmin && !isDeveloperTheme; // Kasta 3: Biru

  // Dummy Data
  const [allDivisions, setAllDivisions] = useState([]);
  const [allInterns, setAllInterns] = useState([]);

  // State Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState(
    isAdmin && !isPurpleTheme && !isDeveloperTheme ? "division_locked" : "global" 
  );
  const [selectedTargets, setSelectedTargets] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);

  // History Data
  const [history, setHistory] = useState([]);

  const fetchBroadcastData = async () => {
    try {
      const [divRes, internRes, histRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/profiles'),
        api.get('/broadcasts/history')
      ]);
      setAllDivisions(divRes.data?.data || divRes.data || []);
      setAllInterns((internRes.data?.data || internRes.data || []).map(i => ({ ...i, name: i.full_name || i.name })));
      setHistory(histRes.data?.data || histRes.data || []);
    } catch (error) {
      console.error("Gagal memuat data referensi broadcast:", error);
    }
  };

  useEffect(() => {
    fetchBroadcastData();
  }, []);

  // ==========================================
  // LOGIC FILTER DROPDOWN BERDASARKAN ROLE
  // ==========================================
  
  const targetOptions = useMemo(() => {
    if (isDeveloper || isSuperAdmin) {
      return [
        { value: "global", label: "🌍 Global (Semua Intern)", desc: "Kirim ke seluruh anak magang" },
        { value: "division", label: "🏢 Divisi Spesifik", desc: "Pilih satu/beberapa divisi" },
        { value: "personal", label: "👤 Personal", desc: "Pilih orang tertentu" },
      ];
    }
    if (isAdmin) {
      return [
        { value: "division_locked", label: `🏢 Semua Anak ${myDivision}`, desc: "Kirim ke divisi lu aja" },
        { value: "personal_locked", label: `👤 Personal`, desc: "Pilih orang di divisi lu" },
      ];
    }
    return [];
  }, [isDeveloper, isSuperAdmin, isAdmin, myDivision]);

  const availableTargetList = useMemo(() => {
    if (targetType === "division") return allDivisions;
    if (targetType === "personal") return allInterns;
    if (targetType === "personal_locked") return allInterns.filter(i => i.division === myDivision);
    return [];
  }, [targetType, myDivision]);

  const toggleTarget = (item) => {
    const isSelected = selectedTargets.includes(item);
    if (isSelected) {
      setSelectedTargets(prev => prev.filter(t => t !== item));
    } else {
      setSelectedTargets(prev => [...prev, item]);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if ((targetType.includes("division") && targetType !== "division_locked") || targetType.includes("personal")) {
      if (selectedTargets.length === 0) {
        toast.error("Pilih minimal 1 target divisi/personal dari daftar!");
        return;
      }
    }

    setIsLoading(true);
    try {
      await api.post('/broadcasts/send', { title, message, targetType, targets: selectedTargets });
      toast.success("FCM Broadcast Terkirim ke Perangkat!");
      setTitle(""); setMessage(""); setSelectedTargets([]);
      fetchBroadcastData();
    } catch (error) {
      toast.error("Gagal mengirim perintah Broadcast");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION + TARGET SELECTION (TEMA DINAMIS)                    */}
      {/* ================================================================= */}
      <div className={`rounded-[2.5rem] text-white shadow-xl border border-white/5 flex flex-col mb-6 overflow-hidden ${
        isDeveloperTheme ? "bg-[#18181b] border-[#27272a] shadow-zinc-900/20" : 
        isPurpleTheme ? "bg-[#1d1633] border-[#342459]" : "bg-[#242b4d] border-[#303861]"
      }`}>
        
        {/* Bagian Atas: Info Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-10 relative overflow-hidden">
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
             isDeveloperTheme ? "bg-zinc-600/10" : 
             isPurpleTheme ? "bg-purple-500/10" : "bg-sky-500/10"
          }`}></div>

          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDeveloperTheme ? "bg-zinc-800/50 border border-zinc-700 text-zinc-300" : 
                isPurpleTheme ? "bg-white/10 text-purple-400" : "bg-white/10 text-sky-400"
              }`}>
                <i className="fa-solid fa-satellite-dish text-sm"></i>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                isDeveloperTheme ? "text-zinc-400" : 
                isPurpleTheme ? "text-purple-400" : "text-sky-400"
              }`}>
                {isDeveloperTheme ? "Dev Notification Protocol" : "Push Notification System"}
              </span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter ${
              isDeveloperTheme ? "text-zinc-200" : "text-white"
            }`}>
              Broadcast Center.
            </h1>
          </div>
          
          <div className={`border px-6 py-4 rounded-2xl shrink-0 flex items-center gap-4 relative z-10 shadow-inner ${
             isDeveloperTheme ? "bg-zinc-800/30 border-zinc-700/50" : "bg-white/5 border-white/10"
          }`}>
             <i className={`fa-brands fa-google text-2xl ${
               isDeveloperTheme ? 'text-zinc-500' : 
               isPurpleTheme ? 'text-purple-400/50' : 'text-blue-400/50'
             }`}></i>
             <div>
               <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5 ${isDeveloperTheme ? 'text-zinc-500' : 'text-white/40'}`}>Powered by</p>
               <p className={`text-sm font-black ${
                 isDeveloperTheme ? 'text-zinc-300' : 
                 isPurpleTheme ? 'text-purple-300' : 'text-blue-400'
               }`}>Firebase FCM</p>
             </div>
          </div>
        </div>

        {/* Bagian Bawah: Target Selection Dock */}
        <div className={`border-t p-8 relative z-10 ${
          isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : 
          isPurpleTheme ? "bg-[#18112a] border-[#342459]" : "bg-[#1e2442] border-[#303861]"
        }`}>
          <label className={`text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 mb-5 ${
            isDeveloperTheme ? 'text-zinc-400' : 
            isPurpleTheme ? 'text-purple-300' : 'text-emerald-400'
          }`}>
            <i className="fa-solid fa-crosshairs"></i> 1. Tentukan Target Penerima Pesan
          </label>
          
          {/* Radio Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetOptions.map(opt => (
              <label 
                key={opt.value} 
                className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer transition-all ${
                  targetType === opt.value 
                    ? (isDeveloperTheme ? 'bg-[#27272a] border-zinc-500 shadow-[0_0_15px_rgba(161,161,170,0.1)]' : 
                       isPurpleTheme ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]')
                    : (isDeveloperTheme ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/50' :
                       isPurpleTheme ? 'bg-white/5 border-[#342459] hover:bg-white/10' : 'bg-white/5 border-[#303861] hover:bg-white/10')
                }`}
              >
                <div className="mt-0.5">
                  <input 
                    type="radio" 
                    name="target" 
                    value={opt.value} 
                    checked={targetType === opt.value} 
                    onChange={() => {setTargetType(opt.value); setSelectedTargets([]);}}
                    className={`w-4 h-4 bg-transparent ${
                      isDeveloperTheme ? 'border-zinc-600 text-zinc-500 focus:ring-zinc-500 focus:ring-offset-[#18181b]' : 
                      isPurpleTheme ? 'border-white/30 text-purple-500 focus:ring-purple-400 focus:ring-offset-[#18112a]' : 'border-white/30 text-blue-500 focus:ring-blue-400 focus:ring-offset-[#18112a]'
                    }`} 
                  />
                </div>
                <div>
                  <p className={`text-sm font-bold mb-1 ${
                    targetType === opt.value ? (isDeveloperTheme ? 'text-zinc-100' : 'text-white') : (isDeveloperTheme ? 'text-zinc-400' : 'text-slate-300')
                  }`}>
                    {opt.label}
                  </p>
                  <p className={`text-[10px] font-medium ${isDeveloperTheme ? 'text-zinc-500' : 'text-slate-400'}`}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Selector Multi-Select Khusus */}
          {(targetType === "division" || targetType === "personal" || targetType === "personal_locked") && (
            <div className={`animate-in fade-in slide-in-from-top-2 mt-4 p-6 rounded-2xl border ${
              isDeveloperTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-white/5 border-white/10"
            }`}>
               <p className={`text-[10px] font-bold mb-4 uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>
                 Pilih dari daftar di bawah (bisa multi-select):
               </p>
               <div className="flex flex-wrap gap-3">
                 {availableTargetList.map(item => {
                   const val = typeof item === 'string' ? item : item.id;
                   const label = typeof item === 'string' ? item : item.name;
                   const isSelected = selectedTargets.includes(val);
                   
                   return (
                     <button 
                       key={val} 
                       type="button" 
                       onClick={() => toggleTarget(val)}
                       className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                         isSelected 
                           ? (isDeveloperTheme ? 'bg-zinc-700 text-zinc-100 border-zinc-600 shadow-md' : 
                              isPurpleTheme ? 'bg-purple-600 text-white border-purple-500' : 'bg-blue-600 text-white border-blue-500') 
                           : (isDeveloperTheme ? 'bg-transparent text-zinc-400 border-zinc-700 hover:bg-zinc-800/50' :
                              isPurpleTheme ? 'bg-transparent text-slate-300 border-[#342459] hover:bg-white/10' : 'bg-transparent text-slate-300 border-[#303861] hover:bg-white/10')
                       }`}
                     >
                       {label} 
                       {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                     </button>
                   )
                 })}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* KONTEN BAWAH (Form Dinamis & History)                             */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: FORM ISI PESAN DINAMIS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className={`rounded-[2rem] border p-8 shadow-sm flex flex-col h-full ${
            isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <h3 className={`text-xl font-black mb-6 flex items-center gap-3 border-b pb-5 ${
              isDeveloperTheme ? "text-zinc-200 border-zinc-800" : "text-slate-800 border-slate-100"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                 isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : 
                 isPurpleTheme ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
              }`}>
                <i className="fa-solid fa-pen-nib text-sm"></i>
              </div>
              Tulis Pesan Broadcast
            </h3>
            
            {/* DYNAMIC HEADER FORM */}
            {(targetType === "global" || targetType === "division_locked") ? (
              <div className={`border rounded-xl p-4 mb-6 flex gap-3 items-start ${
                 isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700" : 
                 isPurpleTheme ? "bg-fuchsia-50 border-fuchsia-200" : "bg-amber-50 border-amber-200"
              }`}>
                <i className={`fa-solid fa-bullhorn mt-0.5 ${
                  isDeveloperTheme ? "text-zinc-400" : 
                  isPurpleTheme ? "text-fuchsia-500" : "text-amber-500"
                }`}></i>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                    isDeveloperTheme ? "text-zinc-300" : 
                    isPurpleTheme ? "text-fuchsia-800" : "text-amber-800"
                  }`}>Broadcast Massal</p>
                  <p className={`text-[11px] font-medium ${
                    isDeveloperTheme ? "text-zinc-400" : 
                    isPurpleTheme ? "text-fuchsia-700/80" : "text-amber-700/80"
                  }`}>Pesan ini akan dikirim ke semua layar HP target secara serentak.</p>
                </div>
              </div>
            ) : (
              <div className={`border rounded-xl p-4 mb-6 flex gap-3 items-start ${
                 isDeveloperTheme ? "bg-zinc-800/50 border-zinc-700" : 
                 isPurpleTheme ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"
              }`}>
                <i className={`fa-solid fa-user-check mt-0.5 ${
                  isDeveloperTheme ? "text-zinc-400" : 
                  isPurpleTheme ? "text-purple-500" : "text-blue-500"
                }`}></i>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                    isDeveloperTheme ? "text-zinc-300" : 
                    isPurpleTheme ? "text-purple-800" : "text-blue-800"
                  }`}>Target Personal Terpilih: {selectedTargets.length}</p>
                  <p className={`text-[11px] font-medium ${
                    isDeveloperTheme ? "text-zinc-400" : 
                    isPurpleTheme ? "text-purple-700/80" : "text-blue-700/80"
                  }`}>Pesan hanya akan masuk ke notifikasi target yang dipilih.</p>
                </div>
              </div>
            )}

            <form id="broadcastForm" onSubmit={handleSendBroadcast} className="space-y-6 flex-1 flex flex-col">
              <div>
                <label className={`text-[11px] font-black uppercase tracking-[0.15em] block mb-2 ${isDeveloperTheme ? "text-zinc-400" : "text-slate-500"}`}>
                  2. Judul Notifikasi <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  className={`w-full rounded-xl px-5 py-3.5 text-sm font-bold outline-none transition-all border ${
                     isDeveloperTheme 
                       ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-zinc-600 placeholder:text-zinc-500" 
                       : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500"
                  }`} 
                  placeholder="Misal: Info Shift Mendadak!" 
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className={`text-[11px] font-black uppercase tracking-[0.15em] block mb-2 flex justify-between ${isDeveloperTheme ? "text-zinc-400" : "text-slate-500"}`}>
                  3. Isi Pesan Singkat <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  rows="4" 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  required 
                  placeholder="Ketik pesan yang akan muncul di pop-up notifikasi layar HP target..." 
                  className={`w-full rounded-xl p-5 text-sm font-medium outline-none resize-none transition-all flex-1 min-h-[120px] border ${
                     isDeveloperTheme 
                       ? "bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-zinc-600 placeholder:text-zinc-500" 
                       : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-purple-500"
                  }`}
                ></textarea>
                <div className="flex justify-end mt-2">
                   <p className={`text-[10px] font-bold tracking-widest uppercase ${message.length > 150 ? 'text-rose-500' : isDeveloperTheme ? 'text-zinc-500' : 'text-slate-400'}`}>
                     {message.length}/150 Karakter
                   </p>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading || ((targetType.includes("division") || targetType.includes("personal")) && targetType !== "division_locked" && selectedTargets.length === 0)} 
                  className={`w-full py-4 text-white rounded-xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:shadow-none disabled:cursor-not-allowed ${
                     isDeveloperTheme ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-100 shadow-zinc-900/30 disabled:bg-zinc-800 disabled:text-zinc-600" : 
                     isPurpleTheme ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30 disabled:bg-slate-300" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 disabled:bg-slate-300"
                  }`}
                >
                  {isLoading ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Mengirim...</>
                  ) : (
                    <><i className="fa-solid fa-paper-plane"></i> Kirim Broadcast Sekarang</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: HISTORY BROADCAST */}
        <div className={`lg:col-span-5 rounded-[2rem] border shadow-sm flex flex-col h-full min-h-[500px] overflow-hidden ${
          isDeveloperTheme ? "bg-[#18181b] border-zinc-800" : "bg-white border-slate-200"
        }`}>
          <div className={`px-8 py-6 border-b flex justify-between items-center shrink-0 ${
            isDeveloperTheme ? "bg-[#27272a]/30 border-zinc-800" : "bg-slate-50/50 border-slate-100"
          }`}>
            <h3 className={`font-black flex items-center gap-3 ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                 isDeveloperTheme ? "bg-zinc-800 text-zinc-300 border-zinc-700" : 
                 isPurpleTheme ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
              }`}>
                <i className="fa-solid fa-clock-rotate-left text-sm"></i>
              </div>
              Log Penyiaran
            </h3>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              
              {history.length === 0 ? (
                 <div className="text-center py-16 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 border ${
                      isDeveloperTheme ? "bg-zinc-800/50 text-zinc-600 border-zinc-700/50" : "bg-slate-50 text-slate-300 border-slate-100"
                    }`}>
                       <i className="fa-solid fa-inbox"></i>
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Belum ada riwayat</p>
                 </div>
              ) : (
                history.map((log) => (
                  <div key={log.id} className={`border rounded-2xl p-5 transition-all group hover:shadow-sm ${
                     isDeveloperTheme ? "bg-[#27272a]/40 border-zinc-800 hover:border-zinc-600" : 
                     isPurpleTheme ? "bg-white border-slate-200 hover:border-purple-300" : "bg-white border-slate-200 hover:border-blue-300"
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        isDeveloperTheme ? "bg-zinc-800 text-zinc-400" : "bg-slate-100 text-slate-400"
                      }`}>
                        <i className="fa-regular fa-clock mr-1"></i> {log.date}
                      </span>
                      <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                        isDeveloperTheme ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        <i className="fa-solid fa-check-double"></i> Terkirim
                      </span>
                    </div>
                    
                    <h4 className={`text-[15px] font-bold mb-4 leading-tight ${isDeveloperTheme ? "text-zinc-200" : "text-slate-800"}`}>{log.title}</h4>
                    
                    <div className={`flex items-center justify-between mt-auto pt-4 border-t ${isDeveloperTheme ? "border-zinc-800" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDeveloperTheme ? "text-zinc-500" : "text-slate-400"}`}>Target:</span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                           isDeveloperTheme ? "text-zinc-300 bg-zinc-700/50 border-zinc-600" : 
                           isPurpleTheme ? "text-purple-600 bg-purple-50 border-purple-100" : "text-blue-600 bg-blue-50 border-blue-100"
                        }`}>
                          {log.target}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-white ${
                          isDeveloperTheme ? "bg-zinc-700 text-zinc-300 border-zinc-600" : "bg-slate-200 text-slate-600"
                        }`}>
                          {log.sender.charAt(0)}
                        </div>
                        <span className={`text-[10px] font-bold ${isDeveloperTheme ? "text-zinc-400" : "text-slate-500"}`}>{log.sender}</span>
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