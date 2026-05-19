import { createContext, useContext, useState, useEffect, useMemo } from "react";
import api from "../api/axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayShift, setTodayShift] = useState(null);      // null = belum load, false = tidak ada jadwal, object = ada jadwal
  const [shiftLoading, setShiftLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    let savedUser = localStorage.getItem("user_data");
    
    if (token && savedUser && token !== "undefined" && savedUser !== "undefined" && savedUser !== "null") {
      savedUser = JSON.parse(savedUser);
      setUser(savedUser);
    } else {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_data");
    }
    setLoading(false);
  }, []);

  // Fetch jadwal hari ini setelah user tersedia dan role-nya intern
  useEffect(() => {
    const role = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
    const isIntern = role === "intern";

    if (!user || !isIntern) {
      setTodayShift(null);
      setShiftLoading(false); // non-intern: tidak perlu fetch
      return;
    }

    const fetchTodayShift = async () => {
      setShiftLoading(true);
      try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const response = await api.get("/schedules");
        const allSchedules = response.data.data || [];
        const todayEntry = allSchedules.find(s => {
          const d = s.shift_date ? s.shift_date.substring(0, 10) : "";
          return d === dateStr;
        });
        setTodayShift(todayEntry || false); // false = tidak ada jadwal hari ini
      } catch {
        setTodayShift(null); // error → jangan blokir akses
      } finally {
        setShiftLoading(false);
      }
    };

    fetchTodayShift();
  }, [user]);

  const login = (token, userData) => {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/login";
  };

  const register = async (username, division_id, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, division_id, email, password });
      const resData = response.data?.data || response.data;
      if (resData.access_token || resData.token) {
        login(resData.access_token || resData.token, resData.user || resData.profile);
      }
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || Object.values(error.response?.data || {}).flat().join(" ") || "Gagal mendaftar.";
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (newData) => {
    setLoading(true);
    try {
      const response = await api.put(`/profiles/${user.id}`, newData);
      const updatedUser = { ...user, ...newData, ...(response.data?.user || response.data?.data || {}) };
      setUser(updatedUser);
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      return { success: true, message: "Profil diperbarui!" };
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Gagal update profil.";
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => {
    const role = user?.role || "";
    const isIntern     = role === "intern";
    const isAdmin      = role === "admin";
    const isSuperAdmin = role === "super_admin";
    const isAnyAdmin   = isAdmin || isSuperAdmin;

    // Status shift hari ini untuk intern:
    //   null  → masih loading / error (jangan blokir)
    //   false → tidak ada jadwal (OFF)
    //   obj   → ada jadwal (morning / afternoon / full/cuti)
    const hasShiftToday   = isIntern ? (todayShift !== false && todayShift !== null) : true;
    const isOnLeave       = isIntern ? (todayShift !== null && todayShift !== false && todayShift.shift_type === "full") : false;
    const isOffToday      = isIntern ? (todayShift === false) : false;

    // Akses terbatas: intern yang OFF atau cuti hanya boleh dashboard, jadwal, leave-request
    const isRestrictedAccess = isIntern && (isOffToday || isOnLeave);

    // is_locked tetap dipakai untuk blokir total (misal di luar jam kerja via cron)
    const isLockedStatus = isIntern && Boolean(user?.is_locked);

    return {
      user,
      loading,
      shiftLoading,
      todayShift,
      login,
      register,
      logout,
      updateProfile,
      isIntern,
      isAdmin,
      isSuperAdmin,
      isAnyAdmin,
      isLocked: isLockedStatus,
      hasShiftToday,
      isOnLeave,
      isOffToday,
      isRestrictedAccess,
    };
  }, [user, loading, todayShift, shiftLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};