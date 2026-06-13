import api from './api';

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
};
