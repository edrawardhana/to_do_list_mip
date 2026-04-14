import { createContext, useContext, useState, useEffect, useMemo } from "react";
import api from "../api/axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Ambil token dan data user asli dari localStorage saat aplikasi pertama kali dimuat
    const token = localStorage.getItem("jwt_token");
    let savedUser = localStorage.getItem("user_data");
    
    // Validasi tambahan agar string "undefined" atau "null" ditolak dan dibersihkan
    if (token && savedUser && token !== "undefined" && savedUser !== "undefined" && savedUser !== "null") {
      savedUser = JSON.parse(savedUser);
      
      setUser(savedUser);
    } else {
      // Bersihkan state jika salah satu tidak ada agar terhindar dari bug sesi nyangkut
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_data");
    }
    setLoading(false);
  }, []);

  // Fungsi Login: Menerima token & userData dari API axios Login.jsx
  const login = (token, userData) => {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Hapus sesi nyata JWT
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/login";
  };

  // Fungsi Register (Dipanggil dari Register.jsx)
  const register = async (username, division_id, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, division_id, email, password });
      const resData = response.data?.data || response.data;
      // Jika backend merespons dengan token setelah daftar, langsung login-kan:
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
      // Hit API Backend untuk update profil (misal ubah nickname di Settings)
      const response = await api.put('/auth/profile', newData); // Sesuaikan endpoint dengan backend
      const updatedUser = { ...user, ...newData, ...(response.data?.user || response.data?.data || {}) };
      setUser(updatedUser);
      localStorage.setItem("user_data", JSON.stringify(updatedUser)); 
      return { success: true, message: "Profil diperbarui!" };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Gagal update profil." };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => {
    // Role sudah otomatis bersih/dinormalisasi saat login di atas
    const role = user?.role || "";
    
    const isIntern = role === "user" || role === "intern";
    const isAdmin = role === "admin";
    const isSuperAdmin = role === "super_admin"; 
    const isDeveloper = role === "developer";
    
    const isAnyAdmin = isAdmin || isSuperAdmin || isDeveloper;

    // LOGIC LOCK SAKTI
    // Di sini kuncinya: Harus Intern DAN is_locked-nya true
    const isLockedStatus = isIntern && Boolean(user?.is_locked);

    return {
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isIntern,
      isAdmin,
      isSuperAdmin,
      isDeveloper,
      isAnyAdmin,
      isLocked: isLockedStatus, // Kita pake variable hasil cek di atas
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};