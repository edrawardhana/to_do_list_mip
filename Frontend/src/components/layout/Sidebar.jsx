// =============================================================
// src/components/layout/Sidebar.jsx
// Mengikuti pola kode lama: NavLink, useAuth, role-based menu
// Desain: MCC dark navy dengan aksen biru terang
// =============================================================

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Daftar menu — sama persis dengan struktur kode lama kamu
  // roles menentukan siapa yang bisa lihat menu ini
  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: "fa-house-user",
      roles: ["Intern", "Admin", "SuperAdmin"],
    },
    {
      path: "/tasks",
      label: "Daily Activity",
      icon: "fa-list-check",
      roles: ["Intern"],
    },
    {
      path: "/attendance",
      label: "Presensi & Izin",
      icon: "fa-calendar-check",
      roles: ["Intern", "Admin", "SuperAdmin"],
    },
    {
      path: "/whiteboard",
      label: "Materi Belajar",
      icon: "fa-book-open",
      roles: ["Intern"],
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "fa-chart-pie",
      roles: ["Admin", "SuperAdmin"],
    },
    {
      path: "/broadcasts",
      label: "Broadcast",
      icon: "fa-bullhorn",
      roles: ["Admin", "SuperAdmin"],
    },
    {
      path: "/divisions",
      label: "Divisi",
      icon: "fa-building",
      roles: ["SuperAdmin"],
    },
    {
      path: "/audit-log",
      label: "Audit Log",
      icon: "fa-history",
      roles: ["SuperAdmin"],
    },
  ];

  // Filter menu berdasarkan role — sama seperti kode lama
  const filteredMenu = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  // Ambil inisial nama — sama seperti kode lama
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const roleColor = {
    Intern: "text-sky-400",
    Admin: "text-indigo-400",
    SuperAdmin: "text-violet-400",
  };

  return (
    <>
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Hamburger (mobile) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-[#0b1630] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
      >
        <i className="fa-solid fa-bars text-sm"></i>
      </button>

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto
          w-[220px] flex-shrink-0 flex flex-col
          bg-gradient-to-b from-[#070e1d] via-[#0b1630] to-[#0d1b35]
          border-r border-white/[0.07]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo — sama posisi seperti kode lama */}
        <div className="p-6 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <i className="fa-solid fa-bolt-lightning text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Mip<span className="text-sky-400">Activity</span>
            </span>
          </div>
          {/* Tombol tutup mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation — mengikuti pola NavLink kode lama */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">
            {user?.role === "Intern" ? "Menu Intern" : "Menu Admin"}
          </p>

          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group text-sm font-semibold
                ${
                  isActive
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/20"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <i
                    className={`fa-solid ${item.icon} w-4 text-center transition-transform duration-150
                    ${isActive ? "text-sky-400" : "group-hover:scale-110"}`}
                  ></i>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile & logout — sama posisi seperti kode lama */}
        <div className="p-4 border-t border-white/[0.07]">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                {user && getInitials(user.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-none truncate">
                  {user?.full_name}
                </p>
                <p
                  className={`text-[10px] font-semibold mt-0.5 ${roleColor[user?.role] || "text-sky-400"}`}
                >
                  {user?.division?.name || "Divisi"} · {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-1.5"></i>
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
