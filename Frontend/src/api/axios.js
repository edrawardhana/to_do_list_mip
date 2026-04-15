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

// Interceptor Response: Tangani error global seperti 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika server merespons 401 (Token tidak ada / expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('token'); // Bersihkan sisa token
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; // Tendang user ke halaman login
      }
    }
    return Promise.reject(error);
  }
);

export default api;