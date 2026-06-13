import api from './api';

export const auditLogsService = {
  getAll: (params?: any) => api.get('/audit-logs', { params }),
};
