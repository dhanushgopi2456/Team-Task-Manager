const API_URL = import.meta.env.VITE_API_URL || '/api';

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#64748b' },
  { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'review', label: 'Review', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#10b981' }
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' }
];

export const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

export const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#3b82f6', '#06b6d4', '#14b8a6', '#f97316'
];

export default API_URL;
