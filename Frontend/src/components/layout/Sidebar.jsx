import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 1. Memoize menuItems agar tidak dibuat ulang setiap render (Mencegah Blink)
  const menuItems = useMemo(
    () => [
      {
        path: "/",
        label: "Dashboard",
        icon: "fa-house-user",
        // Tambahkan "user" di sini agar role dari Laravel terbaca
        roles: ["intern", "admin", "superadmin"],
      },
      {
        path: "/tasks",
        label: "Daily Activity",
        icon: "fa-list-check",
        roles: ["intern"], // Tambahkan "user"
      },
      {
        path: "/attendance",
        label: "Presensi & Izin",
        icon: "fa-calendar-check",
        roles: ["intern", "admin", "superadmin"], // Tambahkan "user"
      },
      {
        path: "/whiteboard",
        label: "Materi Belajar",
        icon: "fa-book-open",
        roles: ["intern"], // Tambahkan "user"
      },
      {
        path: "/broadcasts",
        label: "Broadcast",
        icon: "fa-bullhorn",
        roles: ["admin", "superadmin"], // Tambahkan "user"
      },
      {
        path: "/divisions",
        label: "Divisi",
        icon: "fa-building",
        roles: ["superadmin"], // Tambahkan "user"
      },
      {
        path: "/audit-log",
        label: "Audit Log",
        icon: "fa-history",
        roles: ["superadmin"], // Tambahkan "user"
      },
      // ... menu lainnya
    ],
    [],
  );

  // 2. Fungsi Mapping: Mengubah role aneh dari Laravel ke standar kita
  const filteredMenu = useMemo(() => {
    if (!user?.role) return [];

    // Ambil role mentah dan bersihkan
    const rawRole = user.role.toLowerCase().trim();

    // PROSES MAPPING
    let mappedRole = "";
    if (rawRole === "super_admin" || rawRole === "superadmin") {
      mappedRole = "superadmin";
    } else if (rawRole === "admin") {
      mappedRole = "admin";
    } else {
      // Semua yang bukan admin/superadmin dianggap intern (termasuk role "user")
      mappedRole = "intern";
    }

    return menuItems.filter((item) => item.roles.includes(mappedRole));
  }, [user, menuItems]);

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Hamburger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-[#0b1630] border border-white/10 flex items-center justify-center text-white/70 shadow-lg"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <aside
        className={`
          fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto
          w-[240px] flex-shrink-0 flex flex-col
          bg-[#070e1d] border-r border-white/[0.05]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-bolt-lightning text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Mip<span className="text-sky-400">Activity</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            Main Menu
          </p>

          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                }`
              }
            >
              <i
                className={`fa-solid ${item.icon} w-5 text-center text-sm`}
              ></i>
              <span className="text-sm font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/[0.05]">
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs font-bold">
                {getInitials(user?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-sky-400/80 font-medium truncate uppercase tracking-tighter">
                  {user?.role} · {user?.division?.name || "Member"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-[11px] font-bold hover:bg-rose-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-power-off"></i>
              Keluar Aplikasi
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
