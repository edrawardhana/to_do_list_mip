import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../supabaseClient";
import { toast } from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const SystemConfig = () => {
  const { isDeveloper } = useAuth();

  // Data dari tabel system_configs (Key-Value)
  const [configs, setConfigs] = useState([]);
  const [saving, setSaving] = useState(false);

  // Modal State untuk Danger Zone
  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => {} });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data, error } = await supabase.from('system_configs').select('*');
    if (error) {
      toast.error("Gagal mengambil konfigurasi: " + error.message);
    } else {
      const formatted = data.map(c => ({
        key: c.key,
        value: c.value,
        desc: c.description || "",
        type: (c.value === 'true' || c.value === 'false') ? 'boolean' : (!isNaN(Number(c.value)) && c.value.trim() !== '') ? 'number' : 'string',
      }));
      setConfigs(formatted);
    }
  };

  // Fungsi handle perubahan
  const handleToggle = (key, currentValue) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
  };

  const handleChange = (key, newValue) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;
    for (const conf of configs) {
      const { error } = await supabase
        .from('system_configs')
        .update({ value: String(conf.value) })
        .eq('key', conf.key);
      if (error) hasError = true;
    }
    
    if (!hasError) {
      toast.success("Konfigurasi Sistem Berhasil Disimpan!");
    } else {
      toast.error("Beberapa perubahan gagal disimpan.");
    }
    setSaving(false);
  };

  const handleClearCache = () => {
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Wipe System Cache",
      message: "DANGER: Tindakan ini akan menghapus seluruh data cache lokal di browser Anda dan memaksa sinkronisasi ulang koneksi Master API. Sesi log in Anda akan dipertahankan. Lanjutkan?",
      actionText: "Ya, Wipe System!",
      onConfirm: async () => {
        try {
          const jwt = localStorage.getItem("jwt_token");
          const user_data = localStorage.getItem("user_data");
          localStorage.clear();
          if (jwt) localStorage.setItem("jwt_token", jwt);
          if (user_data) localStorage.setItem("user_data", user_data);
          
          toast.success("System Cache Flushed! Rebooting interface...");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          toast.error("Gagal melakukan wipe system cache!");
        }
      }
    });
  };

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center h-96 text-rose-500 font-black text-2xl">
        <i className="fa-solid fa-triangle-exclamation mr-3"></i> ACCESS DENIED. SYSTEM ROOT ONLY.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 pt-8 px-2 max-w-5xl mx-auto">
      
      {/* ================================================================= */}
      {/* MERGED PANEL: HERO + GLOBAL PARAMETERS (FULL DARK MODE)           */}
      {/* ================================================================= */}
      <div className="rounded-[2.5rem] bg-[#09090b] border border-[#27272a] shadow-2xl relative overflow-hidden flex flex-col text-white">
        
        {/* Efek Glow Background */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* --- HEADER / HERO SECTION --- */}
        <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-800/80 border border-zinc-700 text-zinc-300 shadow-inner">
                <i className="fa-solid fa-server text-lg"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Master Control Panel
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-100">
              System Config.
            </h1>
          </div>

          {/* WIDGET ANIMASI SERVER CORE (Pengganti Teks) */}
          <div className="flex items-center gap-5 bg-[#18181b]/80 border border-zinc-800 px-6 py-4 rounded-3xl backdrop-blur-md shadow-inner shrink-0">
             {/* Animasi Ring Muter */}
             <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 border-[3px] border-zinc-800 border-t-zinc-400 rounded-full animate-[spin_2s_linear_infinite]"></div>
                <div className="absolute inset-1.5 border-[3px] border-zinc-800 border-b-sky-500 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                <i className="fa-solid fa-microchip text-zinc-200 text-lg animate-pulse"></i>
             </div>
             
             {/* Status Badge */}
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Core Active</span>
                </div>
                <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <i className="fa-solid fa-network-wired text-[9px] text-sky-500"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Sync: 0ms</span>
                </div>
             </div>
          </div>
        </div>

        {/* --- FORM SECTION (GLOBAL PARAMETERS) --- */}
        <div className="p-8 md:p-10 relative z-10 flex-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-3">
            <i className="fa-solid fa-sliders"></i> Global Parameters
          </h3>
          
          <div className="space-y-4">
            {configs.map((conf) => (
              <div key={conf.key} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 rounded-2xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-colors group">
                <div>
                  <p className="font-black text-zinc-200 uppercase tracking-wider text-sm mb-1">{conf.key.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">{conf.desc}</p>
                </div>

                <div className="shrink-0">
                  {conf.type === "boolean" ? (
                    <button 
                      onClick={() => handleToggle(conf.key, conf.value)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors border ${
                        conf.value === "true" ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-900 border-zinc-700'
                      }`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full shadow-md transition-transform ${
                        conf.value === "true" ? 'translate-x-7 bg-emerald-400' : 'translate-x-1 bg-zinc-500'
                      }`} />
                    </button>
                  ) : conf.type === "number" ? (
                    <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-zinc-600 transition-colors">
                      <input 
                        type="number" 
                        value={conf.value} 
                        onChange={(e) => handleChange(conf.key, e.target.value)}
                        className="w-16 text-sm font-bold text-zinc-200 outline-none text-center bg-transparent"
                      />
                      <span className="text-[10px] font-black text-zinc-600 uppercase">MB</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={conf.value} 
                      onChange={(e) => handleChange(conf.key, e.target.value)}
                      className="bg-[#09090b] border border-zinc-800 rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-200 outline-none w-36 text-center focus:border-zinc-600 transition-colors"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* --- DANGER ZONE --- */}
          <div className="mt-8 p-6 rounded-2xl border border-rose-900/50 bg-rose-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
               <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                 <i className="fa-solid fa-skull-crossbones"></i> Danger Zone
               </h4>
               <p className="text-[11px] font-medium text-rose-500/70">Bersihkan seluruh cache aplikasi frontend dan paksa sinkronisasi ulang API server.</p>
             </div>
             <button 
               onClick={handleClearCache}
               className="px-5 py-2.5 bg-rose-900/30 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-black transition-all border border-rose-800 hover:border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)] shrink-0"
             >
               Clear System Cache
             </button>
          </div>

        </div>
        
        {/* --- FOOTER ACTION --- */}
        <div className="p-8 md:p-10 border-t border-zinc-800 bg-[#09090b]/80 backdrop-blur-sm relative z-10 flex justify-end">
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="w-full md:w-auto px-10 py-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
           >
             {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>} 
             Deploy Configuration
           </button>
        </div>
      </div>

      {/* MODAL GLOBAL */}
      <ConfirmModal 
        {...modalState} 
        onClose={closeModal} 
        isDark={true} 
      />

    </div>
  );
};

export default SystemConfig;