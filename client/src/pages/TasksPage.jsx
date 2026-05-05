import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../api/tasks';
import { getProjects } from '../api/projects';
import Avatar from '../components/common/Avatar';
import { formatDate, isOverdue } from '../utils/helpers';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import toast from 'react-hot-toast';
import '../styles/tasks.css';

const TasksPage = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchData = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      const [tasksRes, projectsRes] = await Promise.all([getTasks(params), getProjects()]);
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleStatusChange = async (taskId, newStatus) => {
    try { await updateTaskStatus(taskId, newStatus); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot update status'); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await deleteTask(taskId); toast.success('Deleted'); fetchData(); }
    catch (err) { toast.error('Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...taskForm };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      if (editingTask) {
        await updateTask(editingTask._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      setShowModal(false); setEditingTask(null);
      setTaskForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
      setSelectedProject(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    const proj = projects.find(p => p._id === (task.project?._id || task.project));
    setSelectedProject(proj);
    setTaskForm({
      title: task.title, description: task.description || '', project: task.project?._id || task.project,
      assignedTo: task.assignedTo?._id || '', priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', status: task.status
    });
    setShowModal(true);
  };

  const handleProjectChange = (projectId) => {
    setTaskForm({...taskForm, project: projectId, assignedTo: ''});
    setSelectedProject(projects.find(p => p._id === projectId));
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>Tasks</h1><p>All tasks across your projects</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' }); setSelectedProject(null); setShowModal(true); }}>+ New Task</button>}
      </div>

      <div className="tasks-toolbar">
        <div className="tasks-filters">
          <select className="filter-select" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Statuses</option>
            {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="filter-select" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="filter-select" value={filters.project} onChange={e => setFilters({...filters, project: e.target.value})}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {(filters.status || filters.priority || filters.project) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', project: '' })}>Clear</button>
          )}
        </div>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>{tasks.length} tasks</span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">✅</div><h3>No tasks found</h3><p>Try adjusting your filters or create a new task.</p></div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div className="task-card" key={task._id}>
              <div className={`task-priority-indicator priority-${task.priority}`}></div>
              <div className="task-main">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.project?.name && <span className="task-meta-item">📁 {task.project.name}</span>}
                  {task.assignedTo && <span className="task-meta-item"><Avatar name={task.assignedTo.name} size="sm" /> {task.assignedTo.name}</span>}
                  {task.dueDate && <span className={`task-due ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>📅 {formatDate(task.dueDate)}</span>}
                </div>
              </div>
              <div className="task-right">
                <select className="filter-select" value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)} style={{ minWidth: '120px' }}>
                  {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {isAdmin && (
                  <div className="task-actions" style={{ opacity: 1 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(task)} title="Edit">✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(task._id)} title="Delete">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows="3" placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label>Project</label>
                  <select className="form-select" value={taskForm.project} onChange={e => handleProjectChange(e.target.value)} required>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="task-form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-select" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                      {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="task-form-row">
                  <div className="form-group">
                    <label>Assign To</label>
                    <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                      <option value="">Unassigned</option>
                      {selectedProject?.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editingTask ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
