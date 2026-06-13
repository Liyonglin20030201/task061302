import api from './api';

export const teachersService = {
  getAll: (params?: any) => api.get('/teachers', { params }),
  getOne: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  update: (id: string, data: any) => api.patch(`/teachers/${id}`, data),
  remove: (id: string) => api.delete(`/teachers/${id}`),
  getAvailability: (id: string) => api.get(`/teachers/${id}/availability`),
  setAvailability: (id: string, data: any) => api.put(`/teachers/${id}/availability`, data),
};
