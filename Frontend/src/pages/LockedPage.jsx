import React from "react";
import { Link } from "react-router-dom";

const LockedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1437] text-white p-4">
      <div className="bg-[#1b254b] p-10 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-6xl mb-4">🚫</h1>
        <h2 className="text-2xl font-bold mb-2">Akses Terbatas</h2>
        <p className="text-gray-400 mb-6">
          Maaf, akun kamu tidak memiliki izin untuk mengakses halaman ini.
          Silakan hubungi Superadmin jika ini adalah kesalahan.
        </p>
        <Link
          to="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};

export default LockedPage;
