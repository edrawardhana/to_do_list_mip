import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "../../contexts/AuthContext";
import {
  initializeFirebase,
  requestNotificationPermission,
  onMessageListener,
} from "../../firebase";
import ShiftStatusBanner from "../ui/ShiftStatusBanner";
import toast from "react-hot-toast";
import api from "../../api/axios";

const MainLayout = () => {
  const { user, isAdmin, isSuperAdmin, logout, userTheme } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [realtimeLock, setRealtimeLock] = useState(false);

  useEffect(() => {
    const handleForceLock = () => setRealtimeLock(true); // Langsung set status terkunci
    window.addEventListener('force-lock-screen', handleForceLock);
    
    return () => window.removeEventListener('force-lock-screen', handleForceLock);
  }, []);

  // Initialize Firebase + request permission + listen for foreground messages
  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      const firebase = await initializeFirebase();
      if (!firebase) return;

      await requestNotificationPermission(
        firebase.messaging,
        firebase.vapidKey,
      );

      const listenNext = async () => {
        try {
          const payload = await onMessageListener(firebase.messaging);
          const title =
            payload.notification?.title || payload.data?.title || "Notifikasi";
          const body = payload.notification?.body || payload.data?.body || "";
          const urgent = payload.data?.category === "urgent";

          toast(
            (t) => (
              <div className="flex items-start gap-3 max-w-xs">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgent ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}
                >
                  <i
                    className={`fa-solid ${urgent ? "fa-bell" : "fa-satellite-dish"} text-sm`}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight">
                    {title}
                  </p>
                  {body && (
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                      {body}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            ),
            {
              duration: urgent ? 8000 : 5000,
              style: {
                padding: "12px 16px",
                borderRadius: "16px",
                maxWidth: "360px",
              },
            },
          );

          window.dispatchEvent(new Event("fcm-notification"));
          listenNext();
        } catch {
          // Listener closed
        }
      };

      listenNext();
    };

    setupNotifications();
  }, [user?.id]);


  // ================= TEMA BACKGROUND UTAMA UNTUK BACKGROUND NYATU =================
  let bgClass = "bg-gradient-to-tr from-sky-100/40 via-slate-50 to-indigo-50/30 text-slate-900";
  let glowClass = "bg-sky-400/10";

  if (userTheme === "super_admin") {
    bgClass = "bg-gradient-to-tr from-pink-50 via-white to-rose-50 text-slate-900";
    glowClass = "bg-pink-400/10";
  } else if (userTheme === "admin") {
    bgClass = "bg-gradient-to-tr from-slate-50 via-blue-50/30 to-slate-100 text-slate-900";
    glowClass = "bg-blue-400/10";
  } else if (userTheme === "intern") {
    bgClass = "bg-gradient-to-tr from-slate-50 via-cyan-50/20 to-blue-50/20 text-slate-900";
    glowClass = "bg-cyan-400/10";
  }

  return (
    /* Mengunci viewport utama secara penuh tanpa transisi warna yang bikin lag */
    <div
      className={`fixed inset-0 w-full h-full flex font-sans overflow-hidden select-none ${bgClass}`}
    >
      {/* Efek Ambient Glow Halus di Background */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full ${glowClass} blur-[120px] pointer-events-none z-0`}></div>

      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      {/* Kontainer tengah dijamin rigid mengikuti sisa viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        <TopNav onToggleSidebar={() => setMobileOpen(true)} />
        <ShiftStatusBanner />
        
        {/* main adalah satu-satunya area yang boleh scroll secara mandiri di dashboard */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;