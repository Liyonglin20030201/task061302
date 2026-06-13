import api from './api';

export const classesService = {
  getAll: (params?: any) => api.get('/classes', { params }),
  getOne: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.patch(`/classes/${id}`, data),
  remove: (id: string) => api.delete(`/classes/${id}`),
};
