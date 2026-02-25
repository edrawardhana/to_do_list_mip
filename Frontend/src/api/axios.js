import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Ambil IP Publik secara asinkron
const publicIpPromise = (async () => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (e) {
        console.error('Gagal mengambil IP Publik:', e);
        return null;
    }
})();

// Interceptor untuk menambahkan JWT token dan IP Publik ke setiap request
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Tunggu sampai IP Publik didapat sebelum mengirim request
        const ip = await publicIpPromise;
        if (ip) {
            config.headers['X-Public-IP'] = ip;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
