import api from './api';

export const statisticsService = {
  getOverview: (semester?: string) => api.get('/statistics/overview', { params: { semester } }),
  getRoomUtilization: (semester?: string) => api.get('/statistics/room-utilization', { params: { semester } }),
  getTeacherWorkload: (semester?: string) => api.get('/statistics/teacher-workload', { params: { semester } }),
  getClassHours: (semester?: string) => api.get('/statistics/class-hours', { params: { semester } }),
};
