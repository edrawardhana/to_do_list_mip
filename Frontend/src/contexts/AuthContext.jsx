// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    // Simulasi login (tanpa validasi)
    // Saat backend siap, ganti dengan fetch ke endpoint login
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser({
          id: "uuid-user-1",
          full_name: "Ahmad Subardjo",
          email: email,
          role: "SuperAdmin", // Ganti untuk testing role lain Admin,SuperAdmin
          division_id: "uuid-div-1",
          division: {
            name: "UI/UX",
            description: "Desain antarmuka",
          },
          shift_type: "Morning",
          is_locked: false,
          status: "Active",
        });
        localStorage.setItem("token", "dummy-token");
        resolve({ success: true });
      }, 500); // simulasi delay
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
