import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "../../contexts/AuthContext";

const MainLayout = () => {
  const { isAdmin, isSuperAdmin, isDeveloper } = useAuth();

  // LOGIC TEMA BACKGROUND HIERARKI
  let bgClass = "bg-slate-50 text-slate-900"; 
  if (isAdmin) bgClass = "bg-blue-50/80 text-slate-900";
  else if (isSuperAdmin) bgClass = "bg-purple-50/80 text-slate-900";
  else if (isDeveloper) bgClass = "bg-[#09090b] text-slate-200";

  return (
    <div className={`h-screen w-full flex font-sans overflow-hidden transition-colors duration-700 ease-in-out ${bgClass}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <TopNav />
        {/* main pakai overflow-y-auto biar scroll browser jalan, tanpa z-0 biar modal bisa lewat */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;