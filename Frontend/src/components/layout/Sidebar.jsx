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

// Path yang mendapat styling khusus "special" per role
const SPECIAL_PATHS = ["/audit-log", "/broadcasts"];

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
    // Special item styling (AuditLog & Broadcast)
    specialNormal: null,
    specialActiveBg: null,
    specialActiveText: null,
    specialActiveBorder: null,
  };

  // 2. ADMIN (Full Biru Navy Tua Gelap)
  if (isAdmin) {
    theme = {
      sidebarBg:
        "bg-gradient-to-b from-[#162447] to-[#1a3a6c] border-r border-blue-400/20 shadow-2xl",
      logoBorder: "border-blue-400/20",
      logoutBorder: "border-blue-400/20",
      navNormal:
        "text-blue-200/60 hover:text-white hover:bg-white/10 transition-all duration-300",
      navActiveBg:
        "bg-gradient-to-r from-blue-500/30 to-blue-500/5 backdrop-blur-md border border-blue-400/20",
      navActiveText:
        "text-white font-bold tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]",
      navActiveBorder: "bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]",
      isDarkLogo: false,
      // Special: Admin — biru navy senada sidebar
      specialNormal:
        "text-blue-100/70 hover:text-white hover:bg-white/10 transition-all duration-300",
      specialActiveBg:
        "bg-gradient-to-r from-blue-400/30 to-blue-400/5 backdrop-blur-md border border-blue-300/30",
      specialActiveText:
        "text-white font-bold tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]",
      specialActiveBorder:
        "bg-blue-300 shadow-[0_0_15px_rgba(147,197,253,0.8)]",
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
      // Special: SuperAdmin — ungu terang
      specialNormal:
        "text-purple-300/70 hover:bg-purple-100/10 hover:text-purple-200 transition-all duration-300",
      specialActiveBg: "bg-purple-100/10 border border-purple-200/30",
      specialActiveText: "text-purple-200 font-bold tracking-wide",
      specialActiveBorder:
        "bg-purple-300 shadow-[0_0_10px_rgba(216,180,254,0.5)]",
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

            // Apakah item ini termasuk "special" (AuditLog / Broadcast)?
            const isSpecial =
              SPECIAL_PATHS.includes(item.path) && theme.specialNormal !== null;

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

            // Pilih set style yang dipakai: special atau normal
            const resolvedNormal = isSpecial
              ? theme.specialNormal
              : theme.navNormal;
            const resolvedActiveBg = isSpecial
              ? theme.specialActiveBg
              : theme.navActiveBg;
            const resolvedActiveText = isSpecial
              ? theme.specialActiveText
              : theme.navActiveText;
            const resolvedActiveBorder = isSpecial
              ? theme.specialActiveBorder
              : theme.navActiveBorder;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${
                    isActive
                      ? `${resolvedActiveBg} ${resolvedActiveText}`
                      : resolvedNormal
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${resolvedActiveBorder}`}
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
