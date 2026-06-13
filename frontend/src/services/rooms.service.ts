import api from './api';

export const roomsService = {
  getAll: (params?: any) => api.get('/rooms', { params }),
  getOne: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.patch(`/rooms/${id}`, data),
  remove: (id: string) => api.delete(`/rooms/${id}`),
  getAvailable: (params: any) => api.get('/rooms/available', { params }),
};
