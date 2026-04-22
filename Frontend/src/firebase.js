import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabaseClient";
import api from "./api/axios";

const getFirebaseConfig = async () => {
  const { data, error } = await supabase
    .from('system_configs')
    .select('key, value')
    .in('key', [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
      'FIREBASE_VAPID_KEY'
    ]);

  if (error || !data) {
    console.error("Gagal mengambil config Firebase:", error);
    return null;
  }

  const config = {};
  data.forEach(item => {
    config[item.key] = item.value;
  });

  return {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID,
    vapidKey: config.FIREBASE_VAPID_KEY
  };
};

export const initializeFirebase = async () => {
  const config = await getFirebaseConfig();
  
  if (!config || config.apiKey === "-") {
    console.warn("Firebase belum dikonfigurasi di System Config.");
    return null;
  }

  const app = initializeApp(config);
  const messaging = getMessaging(app);

  return { messaging, vapidKey: config.vapidKey };
};

export const requestNotificationPermission = async (messaging, vapidKey) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey });
      if (token) {
        console.log("FCM Token:", token);
        // Kirim token ke backend
        await api.post('/profiles/fcm-token', { fcm_token: token });
        return token;
      }
    }
  } catch (error) {
    console.error("Gagal mendapatkan izin notifikasi:", error);
  }
  return null;
};

export const onMessageListener = (messaging) =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
