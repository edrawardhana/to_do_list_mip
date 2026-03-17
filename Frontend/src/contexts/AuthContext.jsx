// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper functions untuk mempermudah pengecekan role di komponen lain
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";
  const isIntern = user?.role === "intern";
  const isAnyAdmin = isAdmin || isSuperAdmin; // Gabungan untuk fitur yang bisa diakses kedua admin

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Pastikan struktur data sesuai dengan yang dikirim backend (response.data atau response.data.user)
        const userData = response.data.user || response.data;
        setUser(userData);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        { headers: { Accept: "application/json" } },
      );

      const token = response.data.access_token || response.data.token;
      if (!token) {
        return { success: false, error: "Token tidak ditemukan" };
      }

      localStorage.setItem("token", token);

      // Ambil data user terbaru setelah login sukses untuk mendapatkan role
      const meResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const userData = meResponse.data.user || meResponse.data;
      setUser(userData);

      return { success: true, role: userData.role };
    } catch (err) {
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
          role: "intern", // Default role untuk pendaftaran mandiri biasanya intern
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isSuperAdmin,
        isIntern,
        isAnyAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
