import React from "react";
import { useAuth } from "../../contexts/AuthContext";

// Import semua file pecahan dashboard lu
import InternDashboard from "./InternDashboard";
import AdminDashboard from "./AdminDashboard";
import SuperadminDashboard from "./SuperadminDashboard";

const Dashboard = () => {
  const { user, loading, isIntern, isAdmin, isSuperAdmin, isDeveloper } = useAuth();

  if (loading) return <div>Memuat Dashboard...</div>;

  // 1. Kalo dia Intern tapi belum di-ACC (Pending Screen)
  if (isIntern && !user?.is_verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in">
        <div className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center text-5xl text-amber-500 mb-6">
          <i className="fa-solid fa-hourglass-half animate-pulse"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-3">Akun Dalam Antrean</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
          Sabar brok! Akun lu lagi nunggu di-ACC. Hubungi Admin divisi lu.
        </p>
      </div>
    );
  }

  // 2. LEMPAR KE FILE MASING-MASING SESUAI KASTA!
  if (isDeveloper) return <DeveloperDashboard />;
  if (isSuperAdmin) return <SuperadminDashboard />;
  if (isAdmin) return <AdminDashboard />;
  if (isIntern) return <InternDashboard />;

  // Fallback kalo rolenya ga jelas
  return <div>Role tidak dikenali. Hubungi Developer.</div>;
};

export default Dashboard;