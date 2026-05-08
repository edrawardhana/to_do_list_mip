import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../supabaseClient";
import { toast } from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";
import api from "../../api/axios";

const SystemConfig = () => {
  const { isDeveloper } = useAuth();

  const [configs, setConfigs] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Housekeeping state ────────────────────────────────────────────────────
  const [cleanupConfirmText, setCleanupConfirmText] = useState("");
  const [cleanupStep, setCleanupStep]               = useState(0); // 0=idle, 1=confirm, 2=loading
  const [cleanupPreview, setCleanupPreview]         = useState(null);
  const [cleanupResult, setCleanupResult]           = useState(null);

  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data, error } = await supabase.from('system_configs').select('*').order('key', { ascending: true });
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

  const initializeDefaults = async () => {
    const defaults = [
      { key: "MAINTENANCE_MODE", value: "false", description: "Blokir akses aplikasi menampilkan halaman server maintenance." },
      { key: "DISABLE_REGISTRATION", value: "false", description: "Matikan rute register sementara (mencegah spam akun)." },
      { key: "ENABLE_DARK_MODE_GLOBAL", value: "false", description: "Paksa seluruh aplikasi menggunakan UI Master Theme." },
      { key: "MAX_LOGIN_ATTEMPTS", value: "5", description: "Batas kesalahan kata sandi sebelum akun otomatis digembok." },
      { key: "MAX_FILE_UPLOAD_MB", value: "25", description: "Batas ukuran unggahan berkas (Storage Quota)." },
      { key: "FIREBASE_API_KEY", value: "-", description: "Firebase Web API Key (dari Project Settings)." },
      { key: "FIREBASE_AUTH_DOMAIN", value: "-", description: "Firebase Auth Domain." },
      { key: "FIREBASE_PROJECT_ID", value: "-", description: "Firebase Project ID." },
      { key: "FIREBASE_STORAGE_BUCKET", value: "-", description: "Firebase Storage Bucket." },
      { key: "FIREBASE_MESSAGING_SENDER_ID", value: "-", description: "Firebase Messaging Sender ID." },
      { key: "FIREBASE_APP_ID", value: "-", description: "Firebase App ID." },
      { key: "FIREBASE_VAPID_KEY", value: "-", description: "FCM Web Push VAPID Key." },
      { key: "FIREBASE_SERVICE_ACCOUNT_JSON", value: "-", description: "Konten JSON Service Account untuk pengiriman Backend." }
    ];

    try {
      for (const item of defaults) {
        const { data: existing } = await supabase.from('system_configs').select('key').eq('key', item.key).single();
        if (!existing) {
          await supabase.from('system_configs').insert([item]);
        }
      }
      toast.success("Parameter bawaan telah diinisialisasi!");
      fetchConfigs();
    } catch (e) {
      toast.error("Gagal inisialisasi: " + e.message);
    }
  };

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
      const { error } = await supabase.from('system_configs').update({ value: String(conf.value) }).eq('key', conf.key);
      if (error) hasError = true;
    }

    if (!hasError) toast.success("Konfigurasi Sistem Berhasil Disimpan!");
    else toast.error("Beberapa perubahan gagal disimpan.");
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
          setTimeout(() => { window.location.reload(); }, 1500);
        } catch (error) {
          toast.error("Gagal melakukan wipe system cache!");
        }
      }
    });
  };

  // ── Housekeeping handlers ─────────────────────────────────────────────────
  const handlePreviewCleanup = async () => {
    try {
      const res = await api.get("/housekeeping/preview");
      setCleanupPreview(res.data.data);
      setCleanupStep(1);
      setCleanupConfirmText("");
      setCleanupResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengambil preview cleanup");
    }
  };

  const handleForceCleanup = async () => {
    if (cleanupConfirmText !== "HAPUS DATA TUA") {
      toast.error('Ketik: HAPUS DATA TUA');
      return;
    }
    setCleanupStep(2);
    try {
      const res = await api.post("/housekeeping/cleanup", { confirm: "HAPUS DATA TUA" });
      setCleanupResult(res.data.data);
      setCleanupStep(3);
      toast.success(res.data.message);
    } catch (err) {
      setCleanupStep(1);
      toast.error(err.response?.data?.message || "Cleanup gagal");
    }
  };

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-rose-500 font-black text-xl sm:text-2xl px-4 text-center">
        <div>
          <i className="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
          <p>ACCESS DENIED. SYSTEM ROOT ONLY.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* ================================================================= */}
      {/* MERGED PANEL: HERO + GLOBAL PARAMETERS (GAYA DEVELOPER DASHBOARD)   */}
      {/* ================================================================= */}
      <div className="bg-[#09090b] rounded-[2.5rem] border border-[#27272a] shadow-2xl relative overflow-hidden flex flex-col text-white">

        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* --- HEADER / HERO SECTION --- */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-8 border-b border-zinc-800">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner shrink-0">
                <i className="fa-solid fa-server text-xl" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                Master Control Panel
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">
              System Config.
            </h1>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Ubah parameter global, aturan aplikasi, dan integrasi kredensial (API Key) secara langsung.
            </p>
          </div>

          {/* Widget Animasi Server Core */}
          <div className="w-full lg:w-72 shrink-0 bg-zinc-900/50 border border-zinc-800/60 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 border-[3px] border-zinc-800 border-t-zinc-400 rounded-full animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-1.5 border-[3px] border-zinc-800 border-b-sky-500 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
              <i className="fa-solid fa-microchip text-zinc-200 text-xl animate-pulse" />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-center gap-2.5 bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Core Active</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800">
                <i className="fa-solid fa-network-wired text-[10px] text-sky-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Sync: 0ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- FORM SECTION (GLOBAL PARAMETERS) --- */}
        <div className="p-6 sm:p-8 md:p-10 relative z-10 flex-1 bg-[#09090b]/40">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-3">
            <i className="fa-solid fa-sliders" /> Global Parameters
          </h3>

          <div className="space-y-3 sm:space-y-4">
            {configs.map((conf) => (
              <div key={conf.key} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-colors group">
                <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                  <p className="font-black text-zinc-200 uppercase tracking-wider text-[13px] sm:text-sm mb-1 truncate">{conf.key.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">{conf.desc}</p>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex justify-start sm:justify-end">
                  {conf.type === "boolean" ? (
                    <button
                      onClick={() => handleToggle(conf.key, conf.value)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors border ${conf.value === "true" ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full shadow-md transition-transform ${conf.value === "true" ? 'translate-x-7 bg-emerald-400' : 'translate-x-1 bg-zinc-500'}`} />
                    </button>
                  ) : conf.type === "number" ? (
                    <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 focus-within:border-zinc-600 transition-colors w-full sm:w-auto">
                      <input
                        type="number"
                        value={conf.value}
                        onChange={(e) => handleChange(conf.key, e.target.value)}
                        className="w-full sm:w-16 text-sm font-bold text-zinc-200 outline-none text-left sm:text-center bg-transparent"
                      />
                      <span className="text-[10px] font-black text-zinc-600 uppercase shrink-0">MB</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={conf.value}
                      onChange={(e) => handleChange(conf.key, e.target.value)}
                      className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none w-full sm:w-48 md:w-64 text-left sm:text-center focus:border-zinc-600 transition-colors"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* --- DANGER ZONE --- */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl border border-rose-900/50 bg-rose-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
            <div className="flex-1">
              <h4 className="text-[11px] sm:text-xs font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <i className="fa-solid fa-skull-crossbones" /> Danger Zone
              </h4>
              <p className="text-[10px] sm:text-[11px] font-medium text-rose-500/70 leading-relaxed">
                Bersihkan seluruh cache aplikasi frontend dan paksa sinkronisasi ulang API server. Tindakan ini memerlukan log-in ulang pada beberapa kasus.
              </p>
            </div>
            <button onClick={handleClearCache} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-rose-900/30 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-black transition-all border border-rose-800 hover:border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)] shrink-0">
              Clear System Cache
            </button>
          </div>
        </div>

        {/* --- FOOTER ACTION --- */}
        <div className="p-6 sm:p-8 md:p-10 border-t border-zinc-800 bg-[#09090b] relative z-10 flex flex-col md:flex-row justify-end items-center gap-3 sm:gap-4">
          {configs.length === 0 && (
            <button onClick={initializeDefaults} className="w-full md:w-auto px-8 py-3.5 sm:py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-black text-[13px] sm:text-sm transition-all flex items-center justify-center gap-3 animate-pulse">
              <i className="fa-solid fa-wand-magic-sparkles" /> Inject Default Params
            </button>
          )}
          <button onClick={initializeDefaults} className="w-full md:w-auto px-6 py-3.5 sm:py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-black text-[13px] sm:text-sm transition-all flex items-center justify-center gap-3">
            <i className="fa-solid fa-plus" /> Auto-Setup Params
          </button>
          <button onClick={handleSave} disabled={saving} className="w-full md:w-auto px-10 py-3.5 sm:py-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-black text-[13px] sm:text-sm transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50">
            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
            Deploy Configuration
          </button>
        </div>
      </div>

      {/* MODAL GLOBAL */}
      <ConfirmModal {...modalState} onClose={closeModal} isDark={true} />

      {/* ================================================================= */}
      {/* HOUSEKEEPING PANEL                                                 */}
      {/* ================================================================= */}
      <div className="bg-[#09090b] rounded-[2.5rem] border border-rose-900/40 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-6 sm:p-8 border-b border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-900/50 flex items-center justify-center text-rose-400 shrink-0">
            <i className="fa-solid fa-broom text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">Housekeeping</h2>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">
              Hapus data &gt;90 hari dari database dan storage. Cron otomatis: tanggal 1 jam 02:00 WIB.
            </p>
          </div>
          <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <i className="fa-solid fa-clock text-zinc-600"></i>
            Cron: 1st/month 02:00 WIB
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 p-6 sm:p-8 space-y-5">

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "fa-calendar-xmark", label: "Retensi Data",   value: "90 hari",       color: "text-amber-400" },
              { icon: "fa-table-list",     label: "Target Tabel",   value: "daily_tasks, audit_logs", color: "text-sky-400" },
              { icon: "fa-image",          label: "Target Storage", value: "task_evidence/", color: "text-purple-400" },
            ].map(item => (
              <div key={item.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <i className={`fa-solid ${item.icon} ${item.color} text-lg w-6 text-center`}></i>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.label}</p>
                  <p className="text-xs font-black text-zinc-200 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step 0: idle */}
          {cleanupStep === 0 && (
            <button
              onClick={handlePreviewCleanup}
              className="w-full py-4 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 hover:border-rose-700 text-rose-400 hover:text-rose-300 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 group"
            >
              <span className="text-xl group-hover:animate-bounce">🧹</span>
              Force Clean Up
            </button>
          )}

          {/* Step 1: preview + confirm */}
          {cleanupStep === 1 && cleanupPreview && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Preview stats */}
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5">
                <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> Preview — Data yang akan dihapus
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Cutoff",       value: cleanupPreview.cutoff_date,     color: "text-zinc-300" },
                    { label: "Daily Tasks",  value: cleanupPreview.tasks_to_delete, color: "text-rose-400" },
                    { label: "Audit Logs",   value: cleanupPreview.audit_to_delete, color: "text-amber-400" },
                    { label: "File Foto",    value: cleanupPreview.files_to_delete, color: "text-purple-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-zinc-900/60 rounded-xl p-3 text-center">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Double confirmation input */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest block">
                  Ketik <span className="text-rose-400 font-black">HAPUS DATA TUA</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={cleanupConfirmText}
                  onChange={e => setCleanupConfirmText(e.target.value)}
                  placeholder="HAPUS DATA TUA"
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                    cleanupConfirmText === "HAPUS DATA TUA"
                      ? "border-rose-500 text-rose-300"
                      : "border-zinc-700 text-zinc-300 focus:border-zinc-500"
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setCleanupStep(0); setCleanupPreview(null); setCleanupConfirmText(""); }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleForceCleanup}
                  disabled={cleanupConfirmText !== "HAPUS DATA TUA"}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-trash-can"></i> Hapus Sekarang
                </button>
              </div>
            </div>
          )}

          {/* Step 2: loading */}
          {cleanupStep === 2 && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 animate-in fade-in">
              <div className="w-14 h-14 border-4 border-rose-900 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-zinc-400">Menghapus data dan file...</p>
            </div>
          )}

          {/* Step 3: result */}
          {cleanupStep === 3 && cleanupResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5">
                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-check-circle"></i> Cleanup Selesai
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Cutoff",       value: cleanupResult.cutoff_date,   color: "text-zinc-300" },
                    { label: "Tasks Dihapus", value: cleanupResult.tasks_deleted, color: "text-emerald-400" },
                    { label: "Audit Dihapus", value: cleanupResult.audit_deleted, color: "text-emerald-400" },
                    { label: "File Dihapus",  value: cleanupResult.files_deleted, color: "text-emerald-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-zinc-900/60 rounded-xl p-3 text-center">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setCleanupStep(0); setCleanupResult(null); setCleanupPreview(null); }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm transition-all"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SystemConfig;