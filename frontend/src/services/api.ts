import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (['post', 'patch', 'put'].includes(config.method?.toLowerCase() ?? '')) {
    config.headers['X-Idempotency-Key'] = crypto.randomUUID();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          const user = useAuthStore.getState().user;
          useAuthStore.getState().setAuth(accessToken, newRefresh, user!);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
