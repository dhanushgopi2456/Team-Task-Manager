import api from './axios';

export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const searchUsers = (q) => api.get(`/users/search?q=${q}`);
export const updateUserRole = (id, role) => api.put(`/users/${id}/role`, { role });
