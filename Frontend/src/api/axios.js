import axios from 'axios';

// Membuat instance axios dengan Base URL dari environment
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor Request: Menyisipkan token ke setiap request yang dikirim
api.interceptors.request.use(
  (config) => {
    // Cek kedua kemungkinan nama key agar lebih aman
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Tangani error global (401 & Akun Terkunci)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 1. Tangani 401 Unauthorized (Token tidak ada / expired)
      if (error.response.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('token'); // Bersihkan sisa token
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'; // Tendang user ke halaman login
        }
      }

      // 2. 🔥 TANGANI AKUN DIKUNCI (Misal backend ngirim 423 Locked atau 403)
      // Sesuaikan status code ini dengan yang dilempar sama backend Laravel lu pas user kena lock
      if (
        error.response.status === 423 || 
        error.response.data?.message === 'Account locked' ||
        error.response.data?.message === 'Akun Anda telah dikunci.'
      ) {
        // Paksa refresh detik itu juga biar HardLockScreen langsung nutup layar!
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export default api;