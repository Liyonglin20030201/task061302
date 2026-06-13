import api from './api';

export const schedulesService = {
  getAll: (params?: any) => api.get('/schedules', { params }),
  getOne: (id: string) => api.get(`/schedules/${id}`),
  create: (data: any) => api.post('/schedules', data),
  update: (id: string, data: any) => api.patch(`/schedules/${id}`, data),
  remove: (id: string) => api.delete(`/schedules/${id}`),
  autoGenerate: (data: { semester: string; coursePlanIds?: string[] }) =>
    api.post('/schedules/auto-generate', data),
  checkConflicts: (data: any) => api.post('/schedules/check-conflicts', data),
  getHistory: (id: string) => api.get(`/schedules/${id}/history`),
};
