import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();

  const menuItems = useMemo(
    () => [
      {
        path: "/dashboard", // Disamakan dengan rute dashboard di App.jsx
        label: "Dashboard",
        icon: "fa-chart-pie",
        roles: ["intern", "admin", "superadmin"],
      },
      {
        path: "/manage-admin",
        label: "Manage Admin",
        icon: "fa-user-gear",
        roles: ["superadmin"], // Hanya Superadmin
      },
      {
        path: "/broadcasts",
        label: "Broadcast",
        icon: "fa-tower-broadcast",
        roles: ["superadmin"],
      },
      {
        path: "/tasks",
        label: "Daily Activitation",
        icon: "fa-list-check",
        roles: ["admin"],
      },
      {
        path: "/attendance",
        label: "Presensi & Izin",
        icon: "fa-calendar-check",
        roles: ["intern"],
      },
      {
        path: "/whitebook",
        label: "Whitebook",
        icon: "fa-calendar-check",
        roles: ["intern", "admin"],
      },
      {
        path: "/reports",
        label: "Reports",
        icon: "fa-file-lines",
        roles: ["intern", "admin", "superadmin"],
      },
      {
        path: "/approval",
        label: "Approval",
        icon: "fa-solid fa-check-to-slot",
        roles: ["admin"], // Sesuai desain untuk Admin
      },
    ],
    [],
  );

  // 2. Fungsi Mapping: Menyesuaikan role dari Supabase
  const filteredMenu = useMemo(() => {
    // Ambil role mentah dari database
    const rawRole = user?.role?.toLowerCase().trim() || "";

    let mappedRole = "";

    // Logika Mapping sesuai permintaan kamu:
    if (rawRole === "super_admin") {
      // Untuk DashboardSuperAdmin
      mappedRole = "superadmin";
    } else if (rawRole === "admin") {
      // Untuk Admin
      mappedRole = "admin";
    } else if (rawRole === "user") {
      // Untuk DashboardIntern
      mappedRole = "intern";
    }

    // Memastikan menu yang muncul hanya yang diizinkan untuk role tersebut
    return menuItems.filter((item) => item.roles.includes(mappedRole));
  }, [user, menuItems]);

  function getInitials(name) {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    <>
      {/* Mobile overlay - Z-Index diperkuat agar menutup konten */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-[100]
          w-[260px] flex-shrink-0 flex flex-col
          bg-[#070e1d] border-r border-white/[0.05]
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-bolt-lightning text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Mip<span className="text-sky-400">Activity</span>
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 opacity-50">
            Main Menu
          </p>

          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              // Gunakan end hanya untuk root agar tidak bentrok dengan sub-path
              end={item.path === "/dashboard"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                }`
              }
            >
              <i
                className={`fa-solid ${item.icon} w-5 text-center text-sm transition-transform group-hover:scale-110`}
              ></i>
              <span className="text-sm font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/[0.05] bg-[#050a15]">
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-bold">
                {getInitials(user?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.full_name || "User Name"}
                </p>
                <p className="text-[9px] text-sky-400/80 font-bold truncate uppercase tracking-tighter">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-[11px] font-black hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-rose-500/20"
            >
              <i className="fa-solid fa-power-off text-[10px]"></i>
              KELUAR APLIKASI
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
