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

      const payload = {
        full_name: fullName,
        nickname: nickname,
        username: username,
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

  // ── Notifikasi dari API ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

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
      warning: {
        icon: "fa-triangle-exclamation",
        color: "text-amber-500 bg-amber-500/15",
      },
      success: {
        icon: "fa-check-double",
        color: "text-emerald-500 bg-emerald-500/15",
      },
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

  // Normalisasi Role
  const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
  const isSuperAdmin = rawRole === "superadmin";
  const isAdmin = rawRole === "admin";

  // ================= TEMA WARNA TOPNAV BERDASARKAN ROLE =================
  let navTheme =
    "bg-gradient-to-br from-blue-600 to-cyan-500 border-b border-white/20 shadow-lg";
  let dividerColor = "border-white/20";
  let textColorMain = "text-white";
  let textColorMuted = "text-white/70";
  let textGradient = "from-white to-blue-100";
  let btnStyle = "text-white hover:bg-white/20 transition-all";
  let dropdownBg = "bg-white";
  let dropdownBorder = "border-slate-200";
  let dropdownText = "text-slate-700";
  let dropdownHoverBg = "bg-blue-50";
  let inputBg =
    "bg-white/20 border-white/30 text-white placeholder:text-white/60";
  let inputBorder = "border-white/30";
  let avatarFallbackBg =
    "bg-gradient-to-br from-indigo-400 to-purple-500 text-white";

  if (isAdmin) {
    navTheme =
      "bg-gradient-to-r from-[#162447] to-[#1a3a6c] border-b border-blue-400/20 backdrop-blur-xl text-white shadow-xl shadow-blue-900/30";
    dividerColor = "border-blue-400/20";

    textColorMain = "text-white";
    textColorMuted = "text-blue-200/60";
    textGradient = "from-white via-blue-50 to-blue-200";
    btnStyle =
      "text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg";
    dropdownBg = "bg-[#162447]";
    dropdownBorder = "border-blue-400/20";
    dropdownText = "text-blue-100";
    dropdownHoverBg = "bg-blue-500/20";
    inputBg = "bg-black/20";
    inputBorder = "border-blue-400/20 focus:border-blue-400/50";
    avatarFallbackBg = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
  } else if (isSuperAdmin) {
    navTheme =
      "bg-[#1e1544]/95 backdrop-blur-xl border-b border-purple-500/20 text-white shadow-xl shadow-purple-900/20";
    dividerColor = "border-purple-800/50";
    textColorMain = "text-white";
    textColorMuted = "text-slate-400";
    textGradient = "from-white to-purple-200";
    btnStyle = "text-slate-300 hover:text-white hover:bg-white/10";
    dropdownBg = "bg-[#161224]";
    dropdownBorder = "border-white/10";
    dropdownText = "text-slate-300";
    dropdownHoverBg = "bg-white/[0.03]";
    inputBg = "bg-white/5";
    inputBorder = "border-white/10";
    avatarFallbackBg = "bg-purple-600";
  }

  const titles = {
    "/": `Selamat ${getGreeting()}, ${user?.nickname || user?.full_name?.split(" ")[0] || "Brok"}! 👋`,
    "/dashboard": "Dashboard",
    "/tasks": isAdmin ? "Daily Activation" : "Daily Task",
    "/leave-request": "Leave Request",
    "/whitebook": "Whitebook",
    "/approval": "Approval Center",
    "/manage-admin": "Manajemen Akun",
    "/manage-intern": "Manajemen Intern",
    "/audit-log": "Audit Log",
  };

  const title = titles[location.pathname] || "MCC Internship";
  const isUserActive = user?.is_verified && !user?.is_locked;
  const statusColor = isUserActive ? "bg-emerald-500" : "bg-rose-500";
  const statusText = isUserActive
    ? "Aktif"
    : user?.is_locked
      ? "Terkunci"
      : "Pending";
  const shiftLabel = user?.division?.name || "IT Support";

  return (
    <header
      className={`sticky top-6 z-[40] mx-4 md:mx-8 px-6 h-20 rounded-[2rem] border transition-all duration-500 ${navTheme} flex justify-between items-center`}
    >
      {/* KIRI */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className={`lg:hidden p-2 rounded-xl transition-all ${btnStyle}`}
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <h2
          className={`text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${textGradient} drop-shadow-sm leading-none pt-1`}
        >
          {title}
        </h2>
      </div>

      {/* KANAN */}
      <div className="flex items-center gap-4 md:gap-5">
        <div
          className={`hidden md:flex flex-col items-end pr-4 border-r ${dividerColor}`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${statusColor} ${isUserActive ? "animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : ""}`}
            ></div>
            <p className={`text-xs font-bold ${textColorMain} leading-none`}>
              {statusText}
            </p>
          </div>
          <p className={`text-[10px] font-medium ${textColorMuted} capitalize`}>
            {shiftLabel}
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <div className="flex items-baseline gap-1 mb-0.5">
            <p
              className={`text-base font-bold ${textColorMain} tabular-nums leading-none`}
            >
              {timeStr}
            </p>
            <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">
              WIB
            </p>
          </div>
          <p className={`text-[10px] ${textColorMuted} font-medium`}>{today}</p>
        </div>

        <div className={`hidden sm:block h-8 w-px ${dividerColor} mx-1`}></div>

        {/* NOTIFIKASI */}
        <div className="relative group">
          <button
            className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${btnStyle}`}
          >
            <i className="fa-solid fa-bell text-[1.1rem]"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-80 ${dropdownBg} border ${dropdownBorder} rounded-2xl shadow-2xl overflow-hidden z-50 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out`}
          >
            <div
              className={`px-4 py-3 border-b ${dropdownBorder} flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.02]`}
            >
              <h3
                className={`text-sm font-bold ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-800"}`}
              >
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-sky-500 font-semibold cursor-pointer hover:text-sky-600"
                >
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
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada notifikasi.
                </div>
              ) : (
                notifications.map((notif) => {
                  const style = getNotifStyle(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b ${dropdownBorder} transition-colors cursor-pointer relative ${notif.is_read ? "opacity-60 bg-transparent" : `${dropdownHoverBg}`}`}
                    >
                      <div className="flex gap-3 pl-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}
                        >
                          <i className={`fa-solid ${style.icon} text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs ${dropdownText} leading-relaxed`}
                          >
                            <span
                              className={`font-bold ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-900"}`}
                            >
                              {notif.title}:
                            </span>{" "}
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
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

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-full transition-all select-none hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="hidden sm:block text-right">
              <p className={`text-sm font-bold ${textColorMain} leading-tight`}>
                {user?.nickname || user?.full_name?.split(" ")[0] || "User"}
              </p>
              <p
                className={`text-[10px] ${textColorMuted} font-medium capitalize mt-0.5`}
              >
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm ring-2 ring-white/5 shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-white text-sm font-bold ${avatarFallbackBg}`}
                >
                  {user?.nickname?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          {isProfileOpen && (
            <div
              className={`absolute right-0 mt-3 w-[320px] ${dropdownBg} border ${dropdownBorder} rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200`}
            >
              <div
                className={`p-6 pb-5 flex flex-col items-center border-b ${dropdownBorder} bg-gradient-to-b from-black/[0.01] to-transparent relative`}
              >
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 text-slate-400 flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
                <div className="relative w-20 h-20 shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-white text-2xl font-bold ${avatarFallbackBg}`}
                      >
                        {user?.nickname?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 border-2 border-white rounded-full flex items-center justify-center text-[10px] cursor-pointer text-white">
                    <i className="fa-solid fa-camera"></i>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <h3
                  className={`font-black ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-900"} text-lg mt-3`}
                >
                  {user?.full_name || "Guest User"}
                </h3>
                <p className="text-xs font-medium text-sky-500 mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-900"} font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">
                    Username
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user-gear absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-900"} font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">
                    Nama Panggilan
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-xl pl-9 pr-4 py-2.5 text-sm ${isAdmin || isSuperAdmin ? "text-white" : "text-slate-900"} font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">
                    Upload Foto Profil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className={`w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 ${isAdmin || isSuperAdmin ? "file:bg-white/10 file:text-white" : "file:bg-slate-200 file:text-slate-800"} file:font-semibold rounded-xl border ${inputBorder} ${inputBg}`}
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-500/20 transition-all"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
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
