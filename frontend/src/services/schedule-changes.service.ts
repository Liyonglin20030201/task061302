import api from './api';

export const scheduleChangesService = {
  getAll: (params?: any) => api.get('/schedule-changes', { params }),
  create: (data: any) => api.post('/schedule-changes', data),
  approve: (id: string) => api.patch(`/schedule-changes/${id}/approve`),
  reject: (id: string, reason?: string) =>
    api.patch(`/schedule-changes/${id}/reject`, { reason }),
};
