import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LogoWhite from "../../assets/images/logowhite1.png";

const ALWAYS_ALLOWED_PATHS = [
  "/dashboard",
  "/my-schedule",
  "/leave-request",
  "/settings",
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout, isAdmin, isSuperAdmin, isIntern, isRestrictedAccess } =
    useAuth();

  const menuItems = useMemo(
    () => [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: "fa-chart-pie",
        roles: ["intern", "admin", "superadmin"],
      },

      // INTERN
      {
        path: "/tasks",
        label: "Daily Task",
        icon: "fa-calendar-day",
        roles: ["intern"],
      },
      {
        path: "/my-schedule",
        label: "Jadwal Shift",
        icon: "fa-calendar-week",
        roles: ["intern"],
      },
      {
        path: "/leave-request",
        label: "Leave Request",
        icon: "fa-envelope-open-text",
        roles: ["intern"],
      },

      // ADMIN OPERASIONAL
      {
        path: "/tasks",
        label: "Daily Activation",
        icon: "fa-list-check",
        roles: ["admin"],
      },
      {
        path: "/approval",
        label: "Approval Center",
        icon: "fa-check-to-slot",
        roles: ["admin"],
      },
      {
        path: "/manage-intern",
        label: "Manage Intern",
        icon: "fa-users-gear",
        roles: ["admin"],
      },
      {
        path: "/schedule-calendar",
        label: "Schedule Calendar",
        icon: "fa-calendar-days",
        roles: ["admin"],
      },

      // MANAJEMEN AKUN (Superadmin)
      {
        path: "/manage-admin",
        label: "Manage Akun",
        icon: "fa-user-gear",
        roles: ["superadmin"],
      },
      {
        path: "/division-analytics",
        label: "System Analytics",
        icon: "fa-chart-line",
        roles: ["superadmin"],
      },
      {
        path: "/audit-log",
        label: "Audit Log",
        icon: "fa-clipboard-list",
        roles: ["admin", "superadmin"],
      },

      // LAIN-LAIN
      {
        path: "/broadcasts",
        label: "Broadcast",
        icon: "fa-tower-broadcast",
        roles: ["admin", "superadmin"],
      },
      {
        path: "/whitebook",
        label: "Whitebook",
        icon: "fa-book-open",
        roles: ["intern", "admin", "superadmin"],
      },
    ],
    [],
  );

  const filteredMenu = useMemo(() => {
    const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "";
    return menuItems.filter((item) => item.roles.includes(rawRole));
  }, [user, menuItems]);

  // ================= TEMA WARNA SIDEBAR BERDASARKAN ROLE =================

  // 1. DEFAULT: INTERN (Full Biru Muda Terang)
  let theme = {
    sidebarBg:
      "bg-gradient-to-br from-blue-600 to-cyan-500 border-r border-white/10 shadow-xl",
    logoBorder: "border-white/10",
    logoutBorder: "border-white/10",
    navNormal:
      "text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200",
    navActiveBg: "bg-white/20 backdrop-blur-sm border border-white/30",
    navActiveText: "text-white font-bold tracking-wide",
    navActiveBorder: "bg-white",
    isDarkLogo: false,
  };

  // 2. ADMIN (Full Biru Navy Tua Gelap)
  if (isAdmin) {
    theme = {
      sidebarBg: "bg-[#0c1938] border-r border-blue-950",
      logoBorder: "border-white/5",
      logoutBorder: "border-white/5",
      navNormal: "text-slate-400 hover:bg-blue-600/10 hover:text-blue-300",
      navActiveBg: "bg-blue-600/15 border border-blue-600/20",
      navActiveText: "text-blue-500 font-bold tracking-wide",
      navActiveBorder: "bg-blue-600",
      isDarkLogo: false,
    };
  }
  // 3. SUPERADMIN (Full Ungu Tua Gelap)
  else if (isSuperAdmin) {
    theme = {
      sidebarBg: "bg-[#161224] border-r border-purple-950",
      logoBorder: "border-white/5",
      logoutBorder: "border-white/5",
      navNormal: "text-slate-400 hover:bg-purple-500/10 hover:text-purple-300",
      navActiveBg: "bg-purple-500/10 border border-purple-500/20",
      navActiveText: "text-purple-400 font-bold tracking-wide",
      navActiveBorder: "bg-purple-400",
      isDarkLogo: false,
    };
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-[100] w-[260px] flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${theme.sidebarBg} ${mobileOpen ? "translate-x-0 shadow-2xl shadow-sky-900/20" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* LOGO */}
        <div
          className={`h-28 flex items-center justify-center shrink-0 border-b ${theme.logoBorder} px-6 py-4`}
        >
          <img
            src={LogoWhite}
            alt="Logo Malang Creative Center"
            className={`h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300 ${theme.isDarkLogo ? "invert-[0.8] brightness-50" : ""}`}
          />
        </div>

        {/* MENU LIST */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item) => {
            const isItemRestricted =
              isIntern &&
              isRestrictedAccess &&
              !ALWAYS_ALLOWED_PATHS.includes(item.path);

            if (isItemRestricted) {
              return (
                <div
                  key={item.path + "-restricted"}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm opacity-30 cursor-not-allowed select-none ${theme.isDarkLogo ? "text-sky-900/40" : "text-slate-400"}`}
                  title="Tidak tersedia — tidak ada jadwal hari ini"
                >
                  <i
                    className={`fa-solid ${item.icon} w-5 text-center text-[15px]`}
                  ></i>
                  <span className="font-medium tracking-wide">
                    {item.label}
                  </span>
                  <i className="fa-solid fa-lock text-[10px] ml-auto opacity-60"></i>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${
                    isActive
                      ? `${theme.navActiveBg} ${theme.navActiveText}`
                      : theme.navNormal
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${theme.navActiveBorder}`}
                      ></div>
                    )}
                    <i
                      className={`fa-solid ${item.icon} w-5 text-center text-[15px] transition-transform ${isActive ? "opacity-100 scale-110" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}`}
                    ></i>
                    <span className="font-medium tracking-wide">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className={`p-4 shrink-0 border-t ${theme.logoutBorder}`}>
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
