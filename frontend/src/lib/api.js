import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_BASE}/api/v1/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = res.data;
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// === Auth ===
export const authAPI = {
    login: (username, password) =>
        api.post('/auth/token/', { username, password }),
    register: (data) =>
        api.post('/auth/register/', data),
    refreshToken: (refresh) =>
        api.post('/auth/token/refresh/', { refresh }),
    verifyToken: (token) =>
        api.post('/auth/token/verify/', { token }),
};

// === Files ===
export const filesAPI = {
    list: (params) => api.get('/files/', { params }),
    get: (id) => api.get(`/files/${id}/`),
    create: (formData) =>
        api.post('/files/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    update: (id, data) => api.patch(`/files/${id}/`, data),
    delete: (id) => api.delete(`/files/${id}/`),
    download: (id) =>
        api.get(`/files/${id}/download/`, { responseType: 'blob' }),
    stats: () => api.get('/files/stats/'),
    storageStats: () => api.get('/files/storage/stats/'),
};

// === Secrets ===
export const secretsAPI = {
    list: () => api.get('/secrets/'),
    get: (id) => api.get(`/secrets/${id}/`),
    create: (data) => api.post('/secrets/', data),
    update: (id, data) => api.put(`/secrets/${id}/`, data),
    delete: (id) => api.delete(`/secrets/${id}/`),
};

// === Audit ===
export const auditAPI = {
    list: () => api.get('/audit/'),
};

// === Integrations ===
export const integrationsAPI = {
    icloudLogin: (data) => api.post('/integrations/icloud/login/', data),
    icloudVerify2FA: (data) => api.post('/integrations/icloud/verify-2fa/', data),
    googleAuthURL: () => api.get('/integrations/google/auth-url/'),
    googleCallback: (data) => api.post('/integrations/google/callback/', data),
    icloudPhotos: () => api.get('/integrations/icloud/photos/'),
    icloudImport: (photoIds) => api.post('/integrations/icloud/import/', { photo_ids: photoIds }),
};

export default api;
