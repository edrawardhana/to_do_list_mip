importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── Config ────────────────────────────────────────────────────────────────────
// Service worker tidak bisa membaca Vite env vars (VITE_*).
// Config di-hardcode di sini — nilai diambil dari Firebase Console.
// Update nilai ini setiap kali config Firebase berubah.

firebase.initializeApp({
  apiKey:            "AIzaSyCsMwcBELAO5McJeZ2NyktApFrjLKhyERc",
  authDomain:        "todolist-42565.firebaseapp.com",
  projectId:         "todolist-42565",
  storageBucket:     "todolist-42565.firebasestorage.app",
  messagingSenderId: "697849365420",
  appId:             "1:697849365420:web:83d5df6579a608fc4fb009",
});

const messaging = firebase.messaging();

// Handle background messages (app tidak di foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title  = payload.notification?.title || payload.data?.title || 'Notifikasi Baru';
  const body   = payload.notification?.body  || payload.data?.body  || '';
  const icon   = '/logo192.png';
  const url    = payload.data?.url           || '/dashboard';
  const tag    = payload.data?.tag           || 'broadcast';
  const urgent = payload.data?.category === 'urgent';

  self.registration.showNotification(title, {
    body,
    icon,
    badge:              '/logo192.png',
    tag,
    data:               { url },
    requireInteraction: urgent,
    vibrate:            urgent ? [200, 100, 200] : [100],
  });
});

// Klik notifikasi → buka/fokus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
