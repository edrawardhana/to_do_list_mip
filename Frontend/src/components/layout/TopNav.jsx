import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const TopNav = ({ onToggleSidebar }) => {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  
  const [now, setNow] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // States for Edit Profile
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setNickname(user.nickname || "");
      setUsername(user.username || "");
    }
  }, [user, isProfileOpen]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      toast.error("Nama lengkap dan username tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload avatar jika ada file terpilih
      let newAvatarUrl = null;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const avatarRes = await api.post("/profiles/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        if (avatarRes.data?.status === "success") {
          newAvatarUrl = avatarRes.data.avatar_url;
        }
      }

      // 2. Update profile details
      const payload = {
        full_name: fullName,
        nickname: nickname,
        username: username,
      };
      if (newAvatarUrl) {
        payload.avatar_url = newAvatarUrl;
      }

      const res = await updateProfile(payload);
      if (res.success) {
        toast.success("✅ Profil berhasil diperbarui!");
        setIsProfileOpen(false);
        setAvatarFile(null); // Reset file selection
      } else {
        toast.error(res.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Gagal memperbarui profil.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Notifikasi dari API ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res  = await api.get("/notifications");
      const data = res.data?.data || [];
      setNotifications(data);
    } catch {
      // Gagal fetch — biarkan kosong
    } finally {
      setNotifLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh notifikasi saat ada FCM foreground message
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("fcm-notification", handler);
    return () => window.removeEventListener("fcm-notification", handler);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await api.put(`/notifications/${id}`, { is_read: true });
    } catch {
      // Revert jika gagal
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await Promise.all(unread.map(n => api.put(`/notifications/${n.id}`, { is_read: true })));
    } catch {
      fetchNotifications(); // Revert dengan re-fetch
    }
  };

  // Mapping type → icon & color
  const getNotifStyle = (type) => {
    const map = {
      info:    { icon: "fa-circle-info",    color: "text-sky-400 bg-sky-400/20"     },
      warning: { icon: "fa-triangle-exclamation", color: "text-amber-400 bg-amber-400/20" },
      success: { icon: "fa-check-double",   color: "text-emerald-400 bg-emerald-400/20" },
      danger:  { icon: "fa-bell",           color: "text-rose-400 bg-rose-400/20"   },
    };
    return map[type] || map.info;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "Baru saja";
    if (mins < 60)  return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7)   return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  // Update jam & tanggal real-time
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Handle klik di luar buat nutup menu profile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format Tanggal & Jam
  const today = now.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // Normalisasi Role
  const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
  const isSuperAdmin = rawRole === "superadmin";
  const isAdmin = rawRole === "admin";
  const isDeveloper = rawRole === "developer";

  // TEMA TOPNAV
  let navTheme = "bg-[#0b1437]/95 backdrop-blur-xl border-white/10 text-white shadow-xl shadow-sky-900/10";
  let dividerColor = "border-white/10";

  if (isAdmin) {
    navTheme = "bg-blue-950/95 backdrop-blur-xl border-blue-900 text-white shadow-xl shadow-blue-900/10";
    dividerColor = "border-blue-800/50";
  } else if (isSuperAdmin) {
    navTheme = "bg-purple-950/95 backdrop-blur-xl border-purple-900 text-white shadow-xl shadow-purple-900/10";
    dividerColor = "border-purple-800/50";
  } else if (isDeveloper) {
    navTheme = "bg-[#09090b]/95 backdrop-blur-xl border-white/10 text-white shadow-xl shadow-black/20";
    dividerColor = "border-white/10";
  }

  // Mapping path → Judul Dinamis
  const titles = {
    "/": `Selamat ${getGreeting()}, ${user?.nickname || user?.full_name?.split(" ")[0] || "Brok"}! 👋`,
    "/dashboard": "Dashboard",
    "/tasks": isAdmin ? "Daily Activation" : "Daily Task",
    "/leave-request": "Leave Request",
    "/whitebook": "Whitebook",
    "/approval": "Approval Center",
    "/reports": "Generate Laporan",
    "/broadcasts": "Broadcast Center",
    "/divisions": "Manajemen Divisi",
    "/manage-admin": "Manajemen Akun",
    "/manage-intern": "Manajemen Intern",
    "/audit-log": "Audit Log",
  };

  const title = titles[location.pathname] || "MCC Internship";
  const isUserActive = user?.is_verified && !user?.is_locked;
  const statusColor = isUserActive ? "bg-emerald-500" : "bg-rose-500";
  const statusText = isUserActive ? "Aktif" : (user?.is_locked ? "Terkunci" : "Pending");
  const shiftLabel = user?.division?.name || "IT Support";

  return (
    <header className={`sticky top-6 z-[40] mx-4 md:mx-8 px-6 h-20 rounded-[2rem] border transition-colors duration-500 ${navTheme} flex justify-between items-center`}>
      
      {/* KIRI: Hamburger & Judul Raksasa */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>

        {/* TULISAN GAGAH SEKARANG DI SINI */}
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-sm leading-none pt-1">
          {title}
        </h2>
      </div>

      {/* KANAN: Status, Jam, Notif Hover, Profile Menu */}
      <div className="flex items-center gap-4 md:gap-5">
        
        {/* Status Kerja */}
        <div className={`hidden md:flex flex-col items-end pr-4 border-r ${dividerColor}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusColor} ${isUserActive ? 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`}></div>
            <p className="text-xs font-bold text-slate-200 leading-none">{statusText}</p>
          </div>
          <p className="text-[10px] font-medium text-slate-400 capitalize">{shiftLabel}</p>
        </div>

        {/* JAM & TANGGAL (Disatukan Atas-Bawah) */}
        <div className="hidden sm:flex flex-col items-end">
          <div className="flex items-baseline gap-1 mb-0.5">
            <p className="text-base font-bold text-white tabular-nums leading-none">
              {timeStr}
            </p>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
              WIB
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {today}
          </p>
        </div>

        <div className={`hidden sm:block h-8 w-px ${dividerColor} mx-1`}></div>

        {/* NOTIFIKASI HOVER WRAPPER */}
        <div className="relative group">
          {/* Tombol Lonceng (Sekarang bereaksi pake Hover CSS) */}
          <button className="relative p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer">
            <i className="fa-solid fa-bell text-[1.1rem]"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-[#0b1437]"></span>
            )}
          </button>

          {/* DROPDOWN NOTIFIKASI MELUNCUR KE BAWAH SAAT HOVER */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#0b1437] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-transparent">
            
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white">Notifikasi</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] text-sky-400 font-semibold cursor-pointer hover:text-sky-300 transition-colors">
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List Notif (Scrollable) */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {notifLoading ? (
                <div className="p-6 text-center">
                  <i className="fa-solid fa-spinner fa-spin text-slate-500 text-lg"></i>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <i className="fa-solid fa-bell-slash text-2xl mb-2 block opacity-30"></i>
                  Belum ada notifikasi.
                </div>
              ) : (
                notifications.map(notif => {
                  const style = getNotifStyle(notif.type);
                  return (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-white/5 transition-colors cursor-pointer group/item relative ${notif.is_read ? 'opacity-60 hover:opacity-100 bg-transparent' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full shadow-[0_0_5px_rgba(14,165,233,0.5)]"></div>
                      )}
                      <div className="flex gap-3 pl-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}>
                          <i className={`fa-solid ${style.icon} text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 group-hover/item:text-white transition-colors leading-relaxed">
                            <span className="font-bold text-white">{notif.title}:</span>{" "}
                            <span className="line-clamp-2">{notif.message}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PROFILE WRAPPER & DROPDOWN MENGAMBANG */}
        <div className="relative" ref={profileRef}>
          {/* Tombol Profile */}
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-full hover:bg-white/5 transition-all select-none"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors leading-tight">
                {user?.nickname || user?.full_name?.split(" ")[0] || "User"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {user?.role?.replace("_", " ") || "Guest"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm ring-2 ring-white/5 group-hover:ring-white/30 transition-all shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold ${isDeveloper ? 'bg-emerald-600' : isSuperAdmin ? 'bg-purple-600' : isAdmin ? 'bg-blue-600' : 'bg-gradient-to-br from-sky-400 to-indigo-600'}`}>
                  {user?.nickname?.charAt(0) || user?.full_name?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>

          {/* MODAL EDIT PROFILE MENGAMBANG */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-[320px] bg-[#0b1437] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              
              {/* Info Header */}
              <div className="p-6 pb-5 flex flex-col items-center border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent relative">
                {/* Tombol Close */}
                <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>

                <div className="relative w-20 h-20 shrink-0 z-10">
                  {/* Container Image (overflow-hidden) */}
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg ring-4 ring-[#0b1437]">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-white text-2xl font-bold ${isDeveloper ? 'bg-emerald-600' : isSuperAdmin ? 'bg-purple-600' : isAdmin ? 'bg-blue-600' : 'bg-gradient-to-br from-sky-400 to-indigo-600'}`}>
                        {user?.nickname?.charAt(0) || user?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  {/* Ikon Kamera kecil buat ganti foto (di luar overflow-hidden) */}
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 border-2 border-[#0b1437] rounded-full flex items-center justify-center text-[10px] cursor-pointer hover:bg-sky-500 transition-colors text-white shadow-md z-20">
                    <i className="fa-solid fa-camera"></i>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                
                <h3 className="font-black text-white text-lg mt-3 tracking-tight">{user?.full_name || "Guest User"}</h3>
                <p className="text-xs font-medium text-sky-400 mt-0.5 mb-1">{user?.email || "user@mcc.com"}</p>
                {user?.internship_batch && (
                  <div className="mt-1.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(14,165,233,0.1)]">
                    <i className="fa-solid fa-graduation-cap"></i>
                    {user.internship_batch}
                  </div>
                )}
              </div>

              {/* Form Edit Profile Singkat */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Username</label>
                  <div className="relative">
                    <i className="fa-solid fa-user-gear absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                      placeholder="Masukkan username..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Nama Panggilan</label>
                  <div className="relative">
                    <i className="fa-solid fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                      placeholder="Masukkan nama panggilan..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                    Upload Foto Profil {avatarFile && <span className="text-emerald-400 font-bold">(Terpilih)</span>}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-semibold hover:file:bg-white/20 transition-all cursor-pointer border border-white/5 rounded-xl bg-white/[0.02]"
                  />
                </div>

                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-500/20 transition-all mt-2 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};

// Fungsi Greeting
function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Pagi";
  if (h < 15) return "Siang";
  if (h < 18) return "Sore";
  return "Malam";
}

export default TopNav;