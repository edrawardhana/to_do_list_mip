import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import MIPTopLogo from "../../assets/images/MIP_toplogo.png";

const TopNav = ({ onToggleSidebar }) => {
  const { user, updateProfile, setUser, userTheme } = useAuth();
  const location = useLocation();

  const [now, setNow] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // States for Edit Profile
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null); // 🔥 Live preview foto
  const [isSaving, setIsSaving] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Loading states untuk TTD & Stempel
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

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setNickname(user.nickname || "");
      setUsername(user.username || "");
      setAvatarPreview(user.avatar_url || null);
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    }
  }, [user, isProfileOpen]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setNickname(user.nickname || "");
      setUsername(user.username || "");
      setAvatarPreview(user.avatar_url || null); // Load foto profil yang ada
    }
  }, [user, isProfileOpen]);

  useEffect(() => {
    const pendingToast = sessionStorage.getItem("pending_toast");
    if (pendingToast) {
      toast.success(pendingToast);
      sessionStorage.removeItem("pending_toast");
    }
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua kolom password wajib diisi brok!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal kudu 6 karakter!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru lu kagak cocok!");
      return;
    }

    setIsChangingPassword(true);
    const toastId = toast.loading("Memperbarui password akun...");

    try {
      // Tembak endpoint /auth/change-password sesuai config api.php lu
      const res = await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (res.data?.status === "success" || res.status === 200) {
        toast.success("🔑 Password berhasil diperbarui! Silakan gunakan password baru nanti.", { id: toastId });
        // Clear form setelah sukses
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memperbarui password. Cek kembali password lama lu.", { id: toastId });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Bikin live preview instan
    }
  };

  const handleSignatureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      return toast.error("Format file harus PNG!");
    }

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
        setUser(updatedUser);
        toast.success("Tanda tangan berhasil diupdate! ✍️", { id: toastId });
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

    if (file.type !== "image/png") {
      return toast.error("Format file harus PNG!");
    }

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
        setUser(updatedUser);
        toast.success("Stempel berhasil diupdate! 🏵️", { id: toastId });
      }
    } catch (err) {
      toast.error("Gagal mengunggah stempel.", { id: toastId });
    } finally {
      setStampLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      let newAvatarUrl = null;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarRes = await api.post("/profiles/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (avatarRes.data?.status === "success") {
          newAvatarUrl = avatarRes.data.avatar_url;
        }
      }

      // 🔥 Username dihapus dari payload submit demi keamanan data login
      const payload = {
        full_name: fullName,
        nickname: nickname,
      };
      if (newAvatarUrl) payload.avatar_url = newAvatarUrl;

      const res = await updateProfile(payload);
      if (res.success) {
        toast.success("✅ Profil berhasil diperbarui!");
        setIsProfileOpen(false);
        setAvatarFile(null);
      } else {
        toast.error(res.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Notifikasi dari API (Hanya untuk Admin & Intern) ───────────
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
  const isSuperAdmin = rawRole === "superadmin";
  const isAdmin = rawRole === "admin";

  const fetchNotifications = useCallback(async () => {
    if (!user) return; 
    setNotifLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data || []);
    } catch {
      // Gagal fetch
    } finally {
      setNotifLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("fcm-notification", handler);
    return () => window.removeEventListener("fcm-notification", handler);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      await api.put(`/notifications/${id}`, { is_read: true });
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.all(
        unread.map((n) => api.put(`/notifications/${n.id}`, { is_read: true })),
      );
    } catch {
      fetchNotifications();
    }
  };

  const getNotifStyle = (type) => {
    const map = {
      info: { icon: "fa-circle-info", color: "text-sky-500 bg-sky-500/15" },
      warning: { icon: "fa-triangle-exclamation", color: "text-amber-500 bg-amber-500/15" },
      success: { icon: "fa-check-double", color: "text-emerald-500 bg-emerald-500/15" },
      danger: { icon: "fa-bell", color: "text-rose-500 bg-rose-500/15" },
    };
    return map[type] || map.info;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target))
        setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = now.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ================= TEMA WARNA TOPNAV BERDASARKAN ROLE =================
  let navTheme = "bg-gradient-to-br from-blue-600 to-cyan-500 border-b border-white/20 shadow-lg";
  let dividerColor = "border-white/20";
  let textColorMain = "text-white";
  let textColorMuted = "text-white/70";
  let textGradient = "from-white to-blue-100";
  let btnStyle = "text-white hover:bg-white/20 transition-all";
  let dropdownBg = "bg-white";
  let dropdownBorder = "border-slate-200";
  let dropdownText = "text-slate-700";
  let dropdownHoverBg = "bg-blue-50";
  let inputBg = "bg-white";
  let inputBorder = "border-slate-200 focus:border-blue-500 focus:ring-blue-500/50";
  let iconColor = "text-slate-400";
  let avatarFallbackBg = "bg-gradient-to-br from-blue-400 to-cyan-500 text-white";
  let modalTextMain = "text-slate-900";
  let modalTextMuted = "text-slate-500";
  let fileBtnStyle = "file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100";
  let saveBtnStyle = "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20";

  if (userTheme === "admin") {
    navTheme = "bg-gradient-to-r from-[#162447] to-[#1a3a6c] border-b border-blue-400/20 backdrop-blur-xl text-white shadow-xl shadow-blue-900/30";
    dividerColor = "border-blue-400/20";
    textColorMain = "text-white";
    textColorMuted = "text-blue-200/60";
    textGradient = "from-white via-blue-50 to-blue-200";
    btnStyle = "text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg";
    dropdownBg = "bg-[#162447]";
    dropdownBorder = "border-blue-400/20";
    dropdownText = "text-blue-100";
    dropdownHoverBg = "bg-blue-500/20";
    inputBg = "bg-[#0b1437]/30 text-white placeholder:text-blue-200/50";
    inputBorder = "border-blue-400/20 focus:border-blue-400 focus:ring-blue-400/50";
    iconColor = "text-blue-300/50";
    avatarFallbackBg = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
    modalTextMain = "text-white";
    modalTextMuted = "text-blue-200/60";
    fileBtnStyle = "file:bg-white/10 file:text-blue-100 hover:file:bg-white/20";
    saveBtnStyle = "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20";
  } else if (userTheme === "super_admin") {
    navTheme = "bg-gradient-to-r from-pink-400 to-rose-500 border-b border-pink-300/30 text-white shadow-xl shadow-pink-500/20";
    dividerColor = "border-pink-300/40";
    textColorMain = "text-white";
    textColorMuted = "text-pink-100";
    textGradient = "from-white to-pink-100";
    btnStyle = "text-pink-50 hover:text-white hover:bg-white/20 transition-all rounded-lg";
    dropdownBg = "bg-white"; 
    dropdownBorder = "border-pink-200";
    dropdownText = "text-slate-700";
    dropdownHoverBg = "bg-pink-50";
    inputBg = "bg-white text-slate-900 placeholder:text-slate-400";
    inputBorder = "border-pink-200 focus:border-pink-400 focus:ring-pink-400/50";
    iconColor = "text-slate-400";
    avatarFallbackBg = "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]";
    modalTextMain = "text-slate-900";
    modalTextMuted = "text-slate-500";
    fileBtnStyle = "file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100";
    saveBtnStyle = "bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/30";
  }

  const titles = {
    "/": `Selamat ${getGreeting()}, ${user?.nickname || user?.full_name?.split(" ")[0] || "Brok"}! 👋`,
    "/dashboard": "Dashboard",
    "/my-schedule": "My Schedule",
    "/tasks": isAdmin ? "Daily Activation" : "Daily Task",
    "/leave-request": "Leave Request",
    "/whitebook": "Whitebook",
    "/approval": "Approval Center",
    "/manage-admin": "Manage User",
    "/manage-intern" : "Manage Intern",
    "/schedule-calendar" : "Schedule Calender",
    "/audit-log": "Audit Log",
    "/division-analytics": "System Analytics",
    "/broadcasts": "Broadcast",
  };

  const title = titles[location.pathname] || "MCC Internship";
  const isUserActive = user?.is_verified && !user?.is_locked;
  const statusColor = isUserActive ? "bg-emerald-500" : "bg-rose-500";
  const statusText = isUserActive ? "Aktif" : user?.is_locked ? "Terkunci" : "Pending";
  const shiftLabel = user?.division?.name || "IT Support";

  return (
    <header className={`sticky top-6 z-[40] mx-4 md:mx-8 px-6 h-20 rounded-[2rem] border transition-all duration-500 ${navTheme} flex justify-between items-center`}>
      {/* KIRI */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className={`lg:hidden p-2 rounded-xl transition-all ${btnStyle}`}>
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <h2 className={`text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${textGradient} drop-shadow-sm leading-none pt-1`}>
          {title}
        </h2>
      </div>

      {/* KANAN */}
      <div className="flex items-center gap-4 md:gap-5">
        <div className={`hidden md:flex flex-col items-end pr-4 border-r ${dividerColor}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusColor} ${isUserActive ? "animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : ""}`}></div>
            <p className={`text-xs font-bold ${textColorMain} leading-none`}>{statusText}</p>
          </div>
          {!isSuperAdmin && (
            <p className={`text-[10px] font-medium ${textColorMuted} capitalize mt-0.5`}>{shiftLabel}</p>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <div className="flex items-baseline gap-1 mb-0.5">
            <p className={`text-base font-bold ${textColorMain} tabular-nums leading-none`}>{timeStr}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider opacity-80 ${textColorMain}`}>WIB</p>
          </div>
          <p className={`text-[10px] ${textColorMuted} font-medium`}>{today}</p>
        </div>

        <div className={`hidden sm:block h-8 w-px ${dividerColor} mx-1`}></div>

        {/* NOTIFIKASI */}
        <div className="relative group">
          
          {/* Tombol Lonceng */}
          <button className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${btnStyle}`}>
            <i className="fa-solid fa-bell text-[1.1rem]"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm"></span>
            )}
          </button>

          {/* Dropdown Isi Notif */}
          <div className={`absolute right-0 top-full mt-2 w-80 ${dropdownBg} border ${dropdownBorder} rounded-2xl shadow-2xl overflow-hidden z-50 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out`}>
            <div className={`px-4 py-3 border-b ${dropdownBorder} flex justify-between items-center bg-black/[0.02]`}>
              <h3 className={`text-sm font-bold ${modalTextMain}`}>Notifikasi</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] text-sky-500 font-semibold cursor-pointer hover:text-sky-600">
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {notifLoading ? (
                <div className="p-6 text-center">
                  <i className="fa-solid fa-spinner fa-spin text-slate-400 text-lg"></i>
                </div>
              ) : notifications.length === 0 ? (
                <div className={`p-6 text-center ${modalTextMuted} text-xs`}>Belum ada notifikasi.</div>
              ) : (
                notifications.map((notif) => {
                  const style = getNotifStyle(notif.type);
                  return (
                    <div key={notif.id} onClick={() => markAsRead(notif.id)} className={`p-4 border-b ${dropdownBorder} transition-colors cursor-pointer relative ${notif.is_read ? "opacity-60 bg-transparent" : `${dropdownHoverBg}`}`}>
                      <div className="flex gap-3 pl-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}>
                          <i className={`fa-solid ${style.icon} text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${dropdownText} leading-relaxed`}>
                            <span className={`font-bold ${modalTextMain}`}>{notif.title}:</span> {notif.message}
                          </p>
                          <p className={`text-[10px] ${modalTextMuted} mt-1.5`}>{formatTime(notif.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-full transition-all select-none hover:bg-black/10">
            <div className="hidden sm:block text-right">
              <p className={`text-sm font-bold ${textColorMain} leading-tight`}>
                {user?.nickname || user?.full_name?.split(" ")[0] || "User"}
              </p>
              <p className={`text-[10px] ${textColorMuted} font-medium capitalize mt-0.5`}>
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm ring-2 ring-white/20 shrink-0">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }}
                />
              ) : (
                <img 
                  src={MIPTopLogo} 
                  alt="MCC Logo" 
                  className="w-full h-full object-contain p-1 bg-white" 
                />
              )}
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          {isProfileOpen && (
            <div className={`absolute right-0 mt-3 w-[340px] max-w-[90vw] max-h-[85vh] flex flex-col ${dropdownBg} border ${dropdownBorder} rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200`}>
              
              {/* Header Modal - Avatar & Live Preview */}
              <div className={`p-6 pb-5 flex flex-col items-center border-b ${dropdownBorder} shrink-0`}>
                <div className="relative w-20 h-20 shrink-0">
                  <div className={`w-full h-full rounded-full overflow-hidden shadow-lg border-2 ${isAdmin ? "border-blue-500/50" : "border-white/50"}`}>
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="avatar" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        onError={(e) => { e.target.onerror = null; e.target.src = MIPTopLogo; }}
                      />
                    ) : (
                      <img 
                        src={MIPTopLogo} 
                        alt="MCC Logo" 
                        className="w-full h-full object-contain p-2 bg-white group-hover:scale-105 transition-transform" 
                      />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 border-2 border-white rounded-full flex items-center justify-center text-[10px] cursor-pointer text-white hover:bg-slate-700 transition-colors">
                    <i className="fa-solid fa-camera"></i>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <h3 className={`font-black ${modalTextMain} text-lg mt-3`}>{user?.full_name || "Guest User"}</h3>
                <p className={`text-xs font-medium mt-0.5 ${isAdmin ? "text-blue-300" : "text-sky-500"}`}>{user?.email}</p>
              </div>

              {/* Scrollable Body Modal */}
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* NAMA LENGKAP */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1.5 ml-1 ${modalTextMuted}`}>Nama Lengkap</label>
                  <div className="relative">
                    <i className={`fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor}`}></i>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium focus:outline-none focus:ring-1 transition-all`} />
                  </div>
                </div>

                {/* NAMA PANGGILAN */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1.5 ml-1 ${modalTextMuted}`}>Nama Panggilan (Sapaan)</label>
                  <div className="relative">
                    <i className={`fa-solid fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor}`}></i>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Contoh: Bagas" className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium focus:outline-none focus:ring-1 transition-all`} />
                  </div>
                </div>

                {/* USERNAME (DISABLED/LOCKED) */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1.5 ml-1 ${modalTextMuted}`}>Username (Login ID)</label>
                  <div className="relative">
                    <i className={`fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor} opacity-40`}></i>
                    <input type="text" value={username} disabled className={`w-full ${inputBg} border ${inputBorder} opacity-60 rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium cursor-not-allowed`} title="Hubungi Admin untuk mengubah Username" />
                  </div>
                </div>

                {/* INSTANT UPLOAD TANDA TANGAN DIGITAL (TTD) */}
                {(isAdmin || isSuperAdmin) && (
                  <div className="pt-3 border-t border-slate-100/80">
                    <label className={`block text-[10px] font-bold uppercase mb-0.5 ml-1 ${modalTextMuted}`}>Update Tanda Tangan (TTD)</label>
                    <p className="text-[9px] text-sky-500 font-medium mb-2 ml-1">* Format wajib PNG Transparan (Maks 2MB)</p>
                    <input type="file" accept="image/png" disabled={signatureLoading} onChange={handleSignatureChange} className={`w-full text-xs opacity-90 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 ${fileBtnStyle} file:font-semibold rounded-xl border ${inputBorder} ${inputBg} transition-all`} />
                    {signaturePreviewData && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 self-start mb-1">Preview TTD:</span>
                        <img src={signaturePreviewData} alt="TTD Preview" className="max-h-20 object-contain drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                )}

                {/* INSTANT UPLOAD STEMPEL (HANYA UNTUK ROLE ADMIN/SUPERADMIN) */}
                {(isAdmin || isSuperAdmin) && (
                  <div className="pt-3 border-t border-slate-100/80">
                    <label className={`block text-[10px] font-bold uppercase mb-0.5 ml-1 ${modalTextMuted}`}>Update Stempel Resmi Divisi</label>
                    <p className="text-[9px] text-amber-500 font-medium mb-2 ml-1">* Khusus Admin. Format PNG Transparan (Maks 2MB)</p>
                    <input type="file" accept="image/png" disabled={stampLoading} onChange={handleStampChange} className={`w-full text-xs opacity-90 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 ${fileBtnStyle} file:font-semibold rounded-xl border ${inputBorder} ${inputBg} transition-all`} />
                    {stampPreviewData && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 self-start mb-1">Preview Stempel:</span>
                        <img src={stampPreviewData} alt="Stempel Preview" className="max-h-20 object-contain drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                )}

                {/* 🔑 EXPANDABLE SECTION: GANTI PASSWORD */}
                <div className="pt-3 border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="flex items-center justify-between w-full text-left text-[11px] font-black uppercase py-1 text-slate-500 hover:text-blue-500 transition-colors select-none cursor-pointer"
                  >
                    <span>{showChangePassword ? "❌ Batalkan Ganti Password" : "🔒 Ganti Password Akun"}</span>
                    <i className={`fa-solid ${showChangePassword ? "fa-chevron-up" : "fa-chevron-down"} text-[9px]`}></i>
                  </button>

                  {showChangePassword && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase mb-1 ml-1 ${modalTextMuted}`}>Password Sekarang</label>
                        <div className="relative">
                          <i className={`fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor}`}></i>
                          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Masukkan password saat ini" className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium focus:outline-none focus:ring-1 transition-all`} />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-bold uppercase mb-1 ml-1 ${modalTextMuted}`}>Password Baru</label>
                        <div className="relative">
                          <i className={`fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor}`}></i>
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium focus:outline-none focus:ring-1 transition-all`} />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-bold uppercase mb-1 ml-1 ${modalTextMuted}`}>Konfirmasi Password Baru</label>
                        <div className="relative">
                          <i className={`fa-solid fa-lock-open absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${iconColor}`}></i>
                          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${modalTextMain} font-medium focus:outline-none focus:ring-1 transition-all`} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                      >
                        {isChangingPassword ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memproses...</> : "Update Password Baru"}
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleSaveProfile} disabled={isSaving} className={`w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all ${saveBtnStyle} disabled:opacity-50`}>
                  {isSaving ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...</> : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 4) return "Malam";
  if (h < 11) return "Pagi";
  if (h < 15) return "Siang";
  if (h < 18) return "Sore";
  return "Malam";
}