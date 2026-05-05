import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProject, updateProject, addMember, removeMember } from '../api/projects';
import { createTask, updateTask, deleteTask, updateTaskStatus } from '../api/tasks';
import { searchUsers } from '../api/users';
import Avatar from '../components/common/Avatar';
import { formatDate, isOverdue } from '../utils/helpers';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import toast from 'react-hot-toast';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchProject = async () => {
    try {
      const res = await getProject(id);
      setProject(res.data.project);
      setTasks(res.data.tasks);
    } catch (err) { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isOwner = project?.owner?._id === user?.id || project?.owner?._id === user?._id;

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...taskForm, project: id };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      if (editingTask) {
        await updateTask(editingTask._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot update status'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await deleteTask(taskId); toast.success('Task deleted'); fetchProject(); }
    catch (err) { toast.error('Failed to delete task'); }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description || '', assignedTo: task.assignedTo?._id || '',
      priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', status: task.status
    });
    setShowTaskModal(true);
  };

  const handleSearchMembers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchUsers(q);
      setSearchResults(res.data.users.filter(u => !project.members.find(m => m._id === u._id)));
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async (userId) => {
    try { await addMember(id, userId); toast.success('Member added'); setSearchQuery(''); setSearchResults([]); fetchProject(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await removeMember(id, userId); toast.success('Member removed'); fetchProject(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!project) return null;

  const groupedTasks = {};
  TASK_STATUSES.forEach(s => { groupedTasks[s.value] = tasks.filter(t => t.status === s.value); });

  return (
    <div className="animate-fade-in">
      <div className="project-detail-header">
        <div className="project-detail-info">
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>by {project.owner?.name}</span>
          </div>
        </div>
        <div className="project-detail-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/projects')}>← Back</button>
          {isAdmin && <button className="btn btn-primary" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' }); setShowTaskModal(true); }}>+ Add Task</button>}
        </div>
      </div>

      <div className="project-tabs">
        <button className={`project-tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Tasks ({tasks.length})</button>
        <button className={`project-tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
        <button className={`project-tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members ({project.members?.length})</button>
      </div>

      {tab === 'tasks' && (
        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No tasks yet</h3><p>Create the first task for this project.</p></div>
          ) : tasks.map(task => (
            <div className="task-card" key={task._id}>
              <div className={`task-priority-indicator priority-${task.priority}`}></div>
              <div className="task-main">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
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
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditTask(task)} title="Edit">✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteTask(task._id)} title="Delete">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'board' && (
        <div className="kanban-board">
          {TASK_STATUSES.map(status => (
            <div className="kanban-column" key={status.value}>
              <div className="kanban-column-header">
                <span className="kanban-column-title"><span className="legend-dot" style={{ background: status.color }}></span>{status.label}</span>
                <span className="kanban-count">{groupedTasks[status.value]?.length || 0}</span>
              </div>
              <div className="kanban-column-body">
                {groupedTasks[status.value]?.map(task => (
                  <div className="kanban-card" key={task._id} onClick={() => isAdmin && openEditTask(task)}>
                    <div className="kanban-card-title">{task.title}</div>
                    <div className="kanban-card-meta">
                      <span className={`badge badge-${task.priority}`} style={{ fontSize: '10px' }}>{task.priority}</span>
                    </div>
                    <div className="kanban-card-bottom">
                      {task.assignedTo && <Avatar name={task.assignedTo.name} size="sm" />}
                      {task.dueDate && <span className={`task-due ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`} style={{ fontSize: '11px' }}>{formatDate(task.dueDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="members-grid">
            {project.members?.map(member => (
              <div className="member-card" key={member._id}>
                <Avatar name={member.name} size="lg" />
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-email">{member.email}</div>
                  <span className={`badge badge-${member.role || 'member'}`} style={{ marginTop: '4px' }}>{member._id === project.owner?._id ? 'Owner' : (member.role || 'member')}</span>
                </div>
                {(isAdmin || isOwner) && member._id !== project.owner?._id && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMember(member._id)} style={{ color: 'var(--accent-danger)' }}>Remove</button>
                )}
              </div>
            ))}
          </div>
          {(isAdmin || isOwner) && (
            <div className="add-member-section">
              <h3 style={{ fontSize: 'var(--font-base)', marginBottom: '8px' }}>Add Member</h3>
              <div className="add-member-row">
                <input className="form-input" placeholder="Search by name or email..." value={searchQuery} onChange={e => handleSearchMembers(e.target.value)} />
              </div>
              {searchResults.length > 0 && (
                <div className="user-search-results">
                  {searchResults.map(u => (
                    <div className="user-search-item" key={u._id} onClick={() => handleAddMember(u._id)}>
                      <Avatar name={u.name} size="sm" /><span>{u.name}</span><span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>({u.email})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows="3" placeholder="Task description" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} style={{ resize: 'vertical' }} />
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
                      {project.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
