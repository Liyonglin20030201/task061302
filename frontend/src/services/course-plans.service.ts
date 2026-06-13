import api from './api';

export const coursePlansService = {
  getAll: (params?: any) => api.get('/course-plans', { params }),
  getOne: (id: string) => api.get(`/course-plans/${id}`),
  create: (data: any) => api.post('/course-plans', data),
  createBatch: (data: any[]) => api.post('/course-plans/batch', data),
  update: (id: string, data: any) => api.patch(`/course-plans/${id}`, data),
  remove: (id: string) => api.delete(`/course-plans/${id}`),
};
