import { createContext, useContext, useState, useEffect, useMemo } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Ambil data user dari localStorage kalau ada (Biar gak login ulang pas di-refresh)
    const savedUser = localStorage.getItem("dummy_user_data");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Tambahin parameter ke-3: secretRole (Buat dikirim dari Terminal God Mode)
  const login = async (email, password, secretRole = null) => {
    let assignedRole = "intern"; 
    let isVerified = true; 
    let isLocked = false;

    if (secretRole) {
      assignedRole = secretRole;
    } 
    else if (email.includes("super")) {
      assignedRole = "superadmin";
    } else if (email.includes("admin")) {
      assignedRole = "admin";
    } else if (email.includes("dev")) {
      assignedRole = "developer";
    } else if (email.includes("baru")) {
      isVerified = false; 
    } else if (email.includes("hukum")) {
      // PERBAIKAN: Pastiin role-nya intern biar logic isLocked di useMemo nyala!
      assignedRole = "intern"; 
      isLocked = true;
    }

    const userData = {
      id: `usr-${Math.floor(Math.random() * 1000)}`,
      full_name: assignedRole === "developer" ? "System Root" : "Rekiel InternSync",
      nickname: assignedRole === "developer" ? "Root" : "Kiel",
      email: email || "kiel@mcc.com",
      role: assignedRole,
      division_id: "div-it",
      division_name: "IT Support",
      is_verified: isVerified,
      is_locked: isLocked, 
      status: "Aktif",
      shift: "Pagi"
    };

    localStorage.setItem("dummy_user_data", JSON.stringify(userData));
    setUser(userData);
    
    return { success: true, message: `Login Berhasil sebagai ${assignedRole}!` };
  };

  const logout = () => {
    localStorage.removeItem("dummy_user_data");
    setUser(null);
    window.location.href = "/login";
  };

  const updateProfile = async (newData) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      localStorage.setItem("dummy_user_data", JSON.stringify(updatedUser)); // Update storage juga
      return { success: true, message: "Profil diperbarui!" };
    } catch (error) {
      return { success: false, message: "Gagal update profil." };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => {
    // NORMALISASI ROLE
    const role = (user?.role || "").toLowerCase().replace("_", "").trim();
    
    const isIntern = role === "intern";
    const isAdmin = role === "admin";
    const isSuperAdmin = role === "superadmin"; 
    const isDeveloper = role === "developer";
    
    const isAnyAdmin = isAdmin || isSuperAdmin || isDeveloper;

    // LOGIC LOCK SAKTI
    // Di sini kuncinya: Harus Intern DAN is_locked-nya true
    const isLockedStatus = isIntern && Boolean(user?.is_locked);

    return {
      user,
      loading,
      login,
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