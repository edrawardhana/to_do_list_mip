import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "../../contexts/AuthContext";
import { initializeFirebase, requestNotificationPermission, onMessageListener } from "../../firebase";
import ShiftStatusBanner from "../ui/ShiftStatusBanner";
import toast from "react-hot-toast";

const MainLayout = () => {
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize Firebase + request permission + listen for foreground messages
  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      const firebase = await initializeFirebase();
      if (!firebase) return;

      // Selalu request token baru saat app load — token lama mungkin expired
      await requestNotificationPermission(firebase.messaging, firebase.vapidKey);

      // Listen for messages while app is in foreground
      const listenNext = async () => {
        try {
          const payload = await onMessageListener(firebase.messaging);
          const title   = payload.notification?.title || payload.data?.title || "Notifikasi";
          const body    = payload.notification?.body  || payload.data?.body  || "";
          const urgent  = payload.data?.category === "urgent";

          toast(
            (t) => (
              <div className="flex items-start gap-3 max-w-xs">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgent ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                  <i className={`fa-solid ${urgent ? "fa-bell" : "fa-satellite-dish"} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight">{title}</p>
                  {body && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{body}</p>}
                </div>
                <button onClick={() => toast.dismiss(t.id)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            ),
            {
              duration: urgent ? 8000 : 5000,
              style: { padding: "12px 16px", borderRadius: "16px", maxWidth: "360px" },
            }
          );

          // Trigger TopNav untuk refresh notifikasi dari API
          window.dispatchEvent(new Event("fcm-notification"));

          listenNext();
        } catch {
          // Listener closed
        }
      };

      listenNext();
    };

    setupNotifications();
  }, [user?.id]); // re-run setiap user berubah (login/logout)

  // LOGIC TEMA BACKGROUND HIERARKI
  let bgClass = "bg-slate-50 text-slate-900";
  if (isAdmin) bgClass = "bg-blue-50/80 text-slate-900";
  else if (isSuperAdmin) bgClass = "bg-purple-50/80 text-slate-900";
  else if (isDeveloper) bgClass = "bg-[#09090b] text-slate-200";

  return (
    <div className={`h-screen w-full flex font-sans overflow-hidden transition-colors duration-700 ease-in-out ${bgClass}`}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <TopNav onToggleSidebar={() => setMobileOpen(true)} />
        {/* Banner status shift — hanya muncul untuk intern yang OFF/cuti/dikunci */}
        <ShiftStatusBanner />
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