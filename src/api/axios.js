import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});



api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ks_shop_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('ks_shop_token');
            localStorage.removeItem('ks_shop_info');
            // Check if not already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                 window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
