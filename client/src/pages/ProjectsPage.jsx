import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, deleteProject } from '../api/projects';
import Avatar from '../components/common/Avatar';
import { getProgressPercentage } from '../utils/helpers';
import toast from 'react-hot-toast';
import '../styles/projects.css';

const GRADIENTS = ['', 'gradient-2', 'gradient-3', 'gradient-4'];

const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.projects);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProject(form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create project'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err) { toast.error('Failed to delete project'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>Projects</h1><p>Manage your team's projects</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>+ Create Project</button>}
        </div>
      ) : (
        <div className="projects-grid stagger-children">
          {projects.map((project, i) => {
            const progress = getProgressPercentage(project.taskCounts);
            return (
              <div className="project-card" key={project._id} onClick={() => navigate(`/projects/${project._id}`)}>
                <div className={`project-card-gradient ${GRADIENTS[i % 4]}`}></div>
                <div className="project-card-body">
                  <div className="project-card-top">
                    <div>
                      <div className="project-card-title">{project.name}</div>
                      <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </div>
                    {isAdmin && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => handleDelete(project._id, e)} title="Delete">🗑️</button>
                    )}
                  </div>
                  <div className="project-card-desc">{project.description || 'No description'}</div>
                  <div className="project-progress">
                    <div className="progress-label">
                      <span>Progress</span><span>{progress}%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progress}%` }}></div></div>
                  </div>
                </div>
                <div className="project-card-footer">
                  <div className="project-members-preview">
                    <div className="avatar-stack">
                      {project.members?.slice(0, 3).map(m => <Avatar key={m._id} name={m.name} size="sm" />)}
                      {project.members?.length > 3 && <div className="avatar avatar-sm avatar-more">+{project.members.length - 3}</div>}
                    </div>
                  </div>
                  <span className="project-task-count">{project.taskCounts?.total || 0} tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input className="form-input" placeholder="Enter project name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows="3" placeholder="Project description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
