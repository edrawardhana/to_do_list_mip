// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sinkronisasi helper functions dengan role yang ada di database
  // Berdasarkan Dashboard.jsx Anda: "super_admin", "admin", dan "user"
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";
  const isIntern = user?.role === "user"; // DISESUAIKAN: dari "intern" ke "user"
  const isAnyAdmin = isAdmin || isSuperAdmin;

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const userData = response.data.user || response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      localStorage.removeItem("token");
      setUser(null);
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
      // Pastikan status loading aktif saat proses login
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        { headers: { Accept: "application/json" } },
      );

      const token = response.data.access_token || response.data.token;
      if (!token) {
        setLoading(false);
        return { success: false, error: "Token tidak ditemukan" };
      }

      localStorage.setItem("token", token);

      // Ambil profile lengkap (termasuk role terbaru)
      const userData = await fetchUser(token);

      return { success: true, role: userData?.role };
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
          role: "user", // Konsisten menggunakan "user" untuk intern
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

  // Gunakan useMemo untuk mengoptimalkan performa provider
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
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
