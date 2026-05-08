import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api/axios";

let _messaging = null;

// ── Firebase config dari env vars ─────────────────────────────────────────────
const getFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || apiKey.startsWith("GANTI") || apiKey === "PLACEHOLDER") return null;

  return {
    apiKey,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    vapidKey:          import.meta.env.VITE_FIREBASE_VAPID_KEY,
  };
};

// ── Initialize Firebase ───────────────────────────────────────────────────────
export const initializeFirebase = async () => {
  if (_messaging) return { messaging: _messaging, vapidKey: _messaging._vapidKey };

  const config = getFirebaseConfig();
  if (!config) {
    console.warn("[FCM] Firebase env vars belum diisi atau Vite belum di-restart.");
    return null;
  }

  try {
    const app  = getApps().length ? getApps()[0] : initializeApp(config);
    _messaging = getMessaging(app);
    _messaging._vapidKey = config.vapidKey;
    return { messaging: _messaging, vapidKey: config.vapidKey };
  } catch (err) {
    console.error("[FCM] initializeApp error:", err.message);
    return null;
  }
};

// ── Register service worker secara manual ─────────────────────────────────────
const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] Service Worker tidak didukung browser ini.");
    return null;
  }

  try {
    // Unregister semua SW lama yang mungkin pakai config placeholder
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.active?.scriptURL?.includes("firebase-messaging-sw")) {
        const swText = await fetch(reg.active.scriptURL).then(r => r.text()).catch(() => "");
        if (swText.includes("REPLACE_WITH_")) {
          console.info("[FCM] Unregister SW lama dengan placeholder config...");
          await reg.unregister();
        }
      }
    }

    // Register SW baru
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // Tunggu SW aktif
    await navigator.serviceWorker.ready;
    console.info("[FCM] Service Worker aktif:", reg.scope);
    return reg;
  } catch (err) {
    console.error("[FCM] Service Worker register error:", err.message);
    return null;
  }
};

// ── Request permission + get token ────────────────────────────────────────────
export const requestNotificationPermission = async (messaging, vapidKey) => {
  if (!messaging || !vapidKey) {
    console.warn("[FCM] messaging atau vapidKey tidak tersedia.");
    return null;
  }

  if (vapidKey.startsWith("GANTI") || vapidKey === "PLACEHOLDER") {
    console.warn("[FCM] VAPID key masih placeholder — restart Vite dev server.");
    return null;
  }

  try {
    // 1. Minta izin notifikasi
    const permission = await Notification.requestPermission();
    console.info("[FCM] Permission:", permission);
    if (permission !== "granted") return null;

    // 2. Pastikan service worker sudah terdaftar
    const swReg = await registerServiceWorker();
    if (!swReg) return null;

    // 3. Ambil FCM token
    console.info("[FCM] Mengambil token...");
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (!token) {
      console.warn("[FCM] Token kosong.");
      return null;
    }

    console.info("[FCM] Token:", token.substring(0, 30) + "...");

    // 4. Simpan ke backend
    await api.post("/profiles/fcm-token", { fcm_token: token });
    console.info("[FCM] Token tersimpan ke backend ✓");
    return token;
  } catch (err) {
    console.error("[FCM] Error:", err.message || err);
    return null;
  }
};

// ── Foreground message listener ───────────────────────────────────────────────
export const onMessageListener = (messaging) =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => resolve(payload));
  });
