import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LogoWhite from "../../assets/images/logowhite1.png";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout, isAdmin, isSuperAdmin, isDeveloper } = useAuth();

  const menuItems = useMemo(
    () => [
      { path: "/dashboard", label: "Dashboard", icon: "fa-chart-pie", roles: ["intern", "admin", "superadmin", "developer"] },
      
      // INTERN
      { path: "/tasks", label: "Daily Task", icon: "fa-calendar-day", roles: ["intern"] }, 
      { path: "/leave-request", label: "Leave Request", icon: "fa-envelope-open-text", roles: ["intern"] },
      
      // ADMIN OPERASIONAL
      { path: "/tasks", label: "Daily Activation", icon: "fa-list-check", roles: ["admin"] },
      { path: "/approval", label: "Approval Center", icon: "fa-check-to-slot", roles: ["admin"] },
      { path: "/manage-intern", label: "Manage Intern", icon: "fa-users-gear", roles: ["admin"] },
      
      // MANAJEMEN AKUN (Superadmin & Dev)
      { path: "/manage-admin", label: "Manage Akun", icon: "fa-user-gear", roles: ["superadmin", "developer"] },

      // FITUR BARU: GABUNGAN ANALYTICS & DIVISI
      { path: "/division-analytics", label: "System Analytics", icon: "fa-chart-line", roles: ["superadmin", "developer"] },

      // 👇 INI YANG UDAH DIBENERIN (Pakai 'label' bukan 'title')
      { path: "/system-config", label: "System Config", icon: "fa-server", roles: ["developer"] },
      { path: "/audit-log", label: "Audit Log", icon: "fa-clipboard-list", roles: ["admin", "superadmin", "developer"] },
      
      // LAIN-LAIN
      { path: "/broadcasts", label: "Broadcast", icon: "fa-tower-broadcast", roles: ["admin", "superadmin", "developer"] },
      { path: "/whitebook", label: "Whitebook", icon: "fa-book-open", roles: ["intern", "admin", "superadmin", "developer"] },
    ],
    [],
  );

  const filteredMenu = useMemo(() => {
    const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || ""; 
    
    if (rawRole === "developer") {
      return menuItems.filter((item) => item.roles.includes("developer"));
    }

    return menuItems.filter((item) => item.roles.includes(rawRole));
  }, [user, menuItems]);

  // 1. TEMA DEFAULT (INTERN)
  let theme = {
    sidebarBg: "bg-[#0b1437] border-r border-white/10", 
    logoText: "text-white",
    logoIconBg: "bg-gradient-to-br from-sky-400 to-indigo-600",
    navNormal: "text-white/60 hover:bg-white/10 hover:text-white",
    navActiveBg: "bg-white/10 shadow-sm border border-white/5",
    navActiveText: "text-white font-bold tracking-wide",
    navActiveBorder: "bg-sky-400", 
  };

  // ===============================================
  // PENGECEKAN TEMA DARI KASTA TERTINGGI KE BAWAH
  // ===============================================
  if (isDeveloper) {
    theme = { 
      ...theme, 
      sidebarBg: "bg-[#09090b] border-r border-zinc-800",
      logoIconBg: "bg-zinc-600", 
      navActiveBorder: "bg-zinc-400" 
    };
  } else if (isSuperAdmin) {
    theme = { 
      ...theme, 
      sidebarBg: "bg-[#1d1633] border-r border-purple-900/50", 
      logoIconBg: "bg-purple-600", 
      navActiveBorder: "bg-purple-400" 
    };
  } else if (isAdmin) {
    theme = { 
      ...theme, 
      sidebarBg: "bg-[#242b4d] border-r border-blue-900/50", 
      logoIconBg: "bg-blue-600", 
      navActiveBorder: "bg-blue-400" 
    };
  } 

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-[100] w-[260px] flex-shrink-0 flex flex-col transition-colors duration-500 ease-in-out ${theme.sidebarBg} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        {/* LOGO */}
        <div className="h-28 flex items-center justify-center shrink-0 border-b border-white/5 px-6 py-4">
          <img 
            src={LogoWhite}
            alt="Logo Malang Creative Center" 
            className="h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" 
          />
        </div>

        {/* MENU LIST */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${
                  isActive ? `${theme.navActiveBg} ${theme.navActiveText}` : theme.navNormal
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Garis tanda aktif */}
                  {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${theme.navActiveBorder}`}></div>}
                  <i className={`fa-solid ${item.icon} w-5 text-center text-[15px] transition-transform ${isActive ? "opacity-100 scale-110" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}`}></i>
                  <span className="font-medium tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 shrink-0 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-power-off"></i>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;