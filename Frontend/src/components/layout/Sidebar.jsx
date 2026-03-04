import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();

  // Daftar menu dengan icon dan role yang diizinkan
  const menuItems = [
    {
      path: "/",
      label: "Beranda",
      icon: "fa-house-user",
      roles: ["Intern", "Admin", "SuperAdmin"],
    },
    {
      path: "/tasks",
      label: "Tugasku",
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
    }, // atau ['Admin', 'SuperAdmin'] jika ingin keduanya
  ];

  // Filter menu berdasarkan role user
  const filteredMenu = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  // Ambil inisial nama untuk avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20">
      {/* Logo */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-bolt-lightning text-lg"></i>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Intern<span className="text-indigo-600">Sync</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          {user?.role === "Intern" ? "Intern Menu" : "Admin Menu"}
        </p>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-50 group ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600"
                  : ""
              }`
            }
          >
            <i
              className={`fa-solid ${item.icon} w-5 group-hover:scale-110 transition-transform`}
            ></i>
            <span className="text-sm font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & logout */}
      <div className="p-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user && getInitials(user.full_name)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 leading-none">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-indigo-600 font-medium">
                {user?.division?.name || "Divisi"} {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> Keluar
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
