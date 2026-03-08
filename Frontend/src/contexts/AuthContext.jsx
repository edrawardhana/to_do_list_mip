// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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

  // use axios for compact syntax similar to registration example
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        { headers: { Accept: 'application/json' } }
      );

      const token = response.data.access_token || response.data.token;
      if (!token) {
        return { success: false, error: 'No token returned from server' };
      }

      localStorage.setItem('token', token);

      // load current user
      const meResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(meResponse.data);

      return { success: true };
    } catch (err) {
      if (err.response) {
        return {
          success: false,
          error: err.response.data.error || err.response.data.message || 'Invalid credentials',
        };
      }
      console.error('Login failed', err);
      return { success: false, error: err.message };
    }
  };

  // register sekarang menerima username + nama lengkap (kita
  // gunakan satu field untuk kedua tujuan)
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
          password_confirmation: password, // backend requires confirmation
        },
        { headers: { Accept: 'application/json' } }
      );

      return { success: true, user: response.data.user, message: response.data.message };
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        let errorMessage = '';
        if (typeof data === 'object') {
          errorMessage = Object.values(data).flat().join(' ');
        } else {
          errorMessage = data || 'Pendaftaran gagal';
        }
        return { success: false, error: errorMessage };
      }
      console.error('Register failed', err);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
