// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Helper status role & lock (Berdasarkan data user terbaru)
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";
  const isIntern = user?.role === "intern";
  const isAnyAdmin = isAdmin || isSuperAdmin;

  // Menambahkan pengecekan is_locked (mendukung format boolean atau integer 0/1)
  const isLocked = Boolean(user?.is_locked);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Unwrap data: memastikan mengambil objek user terlepas dari nesting API
      const userData =
        response.data.data || response.data.user || response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      // Jika token expired atau invalid, bersihkan session
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchUser(token);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        { headers: { Accept: "application/json" } },
      );

      const token =
        response.data.authorization?.token ||
        response.data.token ||
        response.data.access_token;

      if (!token) {
        setLoading(false);
        return { success: false, error: "Token tidak ditemukan" };
      }

      localStorage.setItem("token", token);
      const userData = await fetchUser(token);

      return {
        success: true,
        role: userData?.role,
        isLocked: Boolean(userData?.is_locked), // Kembalikan status lock saat login
      };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Login gagal",
      };
    }
  };

  const register = async (username, divisionId, email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          username,
          full_name: username,
          division_id: divisionId,
          email,
          password,
          password_confirmation: password,
          role: "intern",
        },
        { headers: { Accept: "application/json" } },
      );

      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (err) {
      const data = err.response?.data;
      let errorMessage =
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : data || "Pendaftaran gagal";
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
  };

  // 2. Masukkan isLocked ke dalam value Provider
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isSuperAdmin,
      isIntern,
      isAnyAdmin,
      isLocked, // Expose status kunci akun ke seluruh aplikasi
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
