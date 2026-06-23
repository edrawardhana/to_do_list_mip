import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import api from "../api/axios";

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [stampLoading, setStampLoading] = useState(false);

  // Secure Image States
  const [signaturePreviewData, setSignaturePreviewData] = useState(null);
  const [stampPreviewData, setStampPreviewData] = useState(null);

  useEffect(() => {
    let signatureUrlToRevoke = null;
    let stampUrlToRevoke = null;

    const fetchSecureImage = async (path, setter) => {
      if (!path) {
        setter(null);
        return;
      }
      if (path.startsWith("http")) {
        setter(path);
      } else {
        try {
          const res = await api.get(`/profiles/secure-image?path=${encodeURIComponent(path)}`, {
            responseType: "blob",
          });
          const objectUrl = URL.createObjectURL(res.data);
          setter(objectUrl);
          return objectUrl;
        } catch (err) {
          console.error("Failed to load secure image", err);
        }
      }
    };

    fetchSecureImage(user?.signature_url, setSignaturePreviewData).then(url => {
      if (url) signatureUrlToRevoke = url;
    });

    fetchSecureImage(user?.stamp_url, setStampPreviewData).then(url => {
      if (url) stampUrlToRevoke = url;
    });

    return () => {
      if (signatureUrlToRevoke) URL.revokeObjectURL(signatureUrlToRevoke);
      if (stampUrlToRevoke) URL.revokeObjectURL(stampUrlToRevoke);
    };
  }, [user?.signature_url, user?.stamp_url]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Ukuran file maksimal 2 MB brok!");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarLoading(true);
    const toastId = toast.loading("Mengunggah avatar baru...");

    try {
      const res = await api.post("/profiles/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.avatar_url) {
        const updatedUser = { ...user, avatar_url: res.data.avatar_url };
        localStorage.setItem("user_data", JSON.stringify(updatedUser));
        sessionStorage.setItem("pending_toast", "Avatar berhasil diupdate! 🔥");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Gagal mengunggah avatar, coba lagi.", { id: toastId });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSignatureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Ukuran file maksimal 2 MB brok!");
    }

    const formData = new FormData();
    formData.append("signature", file);

    setSignatureLoading(true);
    const toastId = toast.loading("Mengunggah tanda tangan...");

    try {
      const res = await api.post("/profiles/signature", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.signature_url) {
        const updatedUser = { ...user, signature_url: res.data.signature_url };
        localStorage.setItem("user_data", JSON.stringify(updatedUser));
        sessionStorage.setItem("pending_toast", "Tanda tangan berhasil diupdate! ✍️");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Gagal mengunggah tanda tangan.", { id: toastId });
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleStampChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Ukuran file maksimal 2 MB brok!");
    }

    const formData = new FormData();
    formData.append("stamp", file);

    setStampLoading(true);
    const toastId = toast.loading("Mengunggah stempel...");

    try {
      const res = await api.post("/profiles/stamp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.stamp_url) {
        const updatedUser = { ...user, stamp_url: res.data.stamp_url };
        localStorage.setItem("user_data", JSON.stringify(updatedUser));
        sessionStorage.setItem("pending_toast", "Stempel berhasil diupdate! 🏵️");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Gagal mengunggah stempel.", { id: toastId });
    } finally {
      setStampLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nickname) return toast.error("Nickname jangan kosong brok!");
    
    const res = await updateProfile({ nickname }); 
    if (res.success) toast.success("Nickname berhasil diperbarui! 🔥");
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* HEADER SECTION */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-[#1b254b] tracking-tighter uppercase italic">
          Account <span className="text-sky-500">Settings</span>
        </h1>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">
          Update identitas publik lu di ekosistem MipActivity
        </p>
      </div>
      
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* AVATAR PREVIEW AREA */}
        <div className="bg-slate-50 p-10 flex flex-col items-center justify-center border-b border-slate-100">
          <div className="relative group cursor-pointer">
            <label htmlFor="avatar-file-input" className="cursor-pointer block">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-[2rem] object-cover shadow-xl group-hover:scale-105 transition-transform duration-500 border-2 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl group-hover:scale-105 transition-transform duration-500">
                  {user?.nickname?.[0] || user?.full_name?.[0]}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-sky-500 hover:bg-sky-50 transition-colors">
                {avatarLoading ? (
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                ) : (
                  <i className="fa-solid fa-camera text-xs"></i>
                )}
              </div>
            </label>
            <input 
              id="avatar-file-input" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={avatarLoading}
              onChange={handleAvatarChange} 
            />
          </div>
          <h3 className="mt-4 text-[#1b254b] font-black text-lg">{user?.full_name}</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{user?.role?.replace("_", " ")}</p>
        </div>

        <form onSubmit={handleSave} className="p-8 md:p-12 space-y-8">
          {/* NICKNAME INPUT */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nickname Lu</label>
              <span className="text-[9px] font-bold text-sky-500 uppercase">Dilihat oleh semua orang</span>
            </div>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none font-bold text-[#1b254b] text-sm transition-all placeholder:text-slate-300"
              placeholder="Masukin nama panggilan lu..."
            />
          </div>

          {/* SIGNATURE UPLOAD */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanda Tangan Digital</label>
              <span className="text-[9px] font-bold text-sky-500 uppercase">Digunakan untuk dokumen resmi</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
              <div className="w-40 h-24 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                {signaturePreviewData ? (
                  <img src={signaturePreviewData} alt="Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-slate-300 font-bold text-xs uppercase italic">Belum diunggah</span>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="inline-flex items-center justify-center px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-[#1b254b] hover:bg-slate-100 transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                  <i className="fa-solid fa-signature mr-2"></i>
                  {signatureLoading ? "Mengunggah..." : "Pilih Gambar TTD"}
                  <input type="file" accept="image/*" className="hidden" disabled={signatureLoading} onChange={handleSignatureChange} />
                </label>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Format PNG/JPG/WEBP, Max 2MB. Disarankan background transparan.</p>
              </div>
            </div>
          </div>

          {/* STAMP UPLOAD (SUPERADMIN / SPV ONLY) */}
          {user?.role === "super_admin" && (
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stempel SPV</label>
                <span className="text-[9px] font-bold text-sky-500 uppercase">Khusus Superadmin</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="w-40 h-24 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                  {stampPreviewData ? (
                    <img src={stampPreviewData} alt="Stamp" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-slate-300 font-bold text-xs uppercase italic">Belum diunggah</span>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <label className="inline-flex items-center justify-center px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-[#1b254b] hover:bg-slate-100 transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                    <i className="fa-solid fa-stamp mr-2"></i>
                    {stampLoading ? "Mengunggah..." : "Pilih Gambar Stempel"}
                    <input type="file" accept="image/*" className="hidden" disabled={stampLoading} onChange={handleStampChange} />
                  </label>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Format PNG/JPG/WEBP, Max 2MB. Disarankan background transparan.</p>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL (LOCKED) */}
          <div className="space-y-3 opacity-50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Akun Utama)</label>
            <div className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm flex items-center gap-3">
              <i className="fa-solid fa-envelope text-slate-400"></i>
              {user?.email}
            </div>
          </div>

          {/* INFO GRID (LOCKED) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Divisi</label>
              <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 text-xs flex items-center gap-3">
                <i className="fa-solid fa-building text-slate-400"></i>
                {user?.division?.name || user?.division_name || "Belum ada divisi"}
              </div>
            </div>
            
            {user?.internship_batch && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Magang</label>
                <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 text-xs flex items-center gap-3">
                  <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                  {user.internship_batch}
                </div>
              </div>
            )}
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-5 bg-[#1b254b] hover:bg-sky-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* INFO FOOTER */}
      <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose">
        Butuh ganti nama lengkap atau divisi? <br />
        <span className="text-indigo-500 cursor-pointer hover:underline">Hubungi Supervisor MipActivity</span>
      </p>
    </div>
  );
};

export default Settings;