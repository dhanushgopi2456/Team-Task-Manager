import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getOverdueTasks } from '../api/tasks';
import Avatar from '../components/common/Avatar';
import { formatRelativeDate, isOverdue, formatDate } from '../utils/helpers';
import { TASK_STATUSES } from '../utils/constants';
import '../styles/dashboard.css';

const DonutChart = ({ stats }) => {
  const total = stats.total || 1;
  const data = [
    { key: 'todo', value: stats.todo || 0, color: '#64748b' },
    { key: 'in-progress', value: stats['in-progress'] || 0, color: '#3b82f6' },
    { key: 'review', value: stats.review || 0, color: '#f59e0b' },
    { key: 'completed', value: stats.completed || 0, color: '#10b981' },
  ];
  const radius = 54, circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="status-chart">
      <div className="donut-chart">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {data.map((d) => {
            const pct = d.value / total;
            const dashArray = `${pct * circumference} ${circumference}`;
            const dashOffset = -offset * circumference;
            offset += pct;
            return <circle key={d.key} cx="70" cy="70" r={radius} fill="none" stroke={d.color} strokeWidth="12" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" />;
          })}
        </svg>
        <div className="donut-center">
          <span className="donut-value">{stats.total || 0}</span>
          <span className="donut-label">Total</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.map(d => (
          <div className="legend-item" key={d.key}>
            <div className="legend-item-left">
              <span className="legend-dot" style={{ background: d.color }}></span>
              <span className="legend-label">{d.key.replace('-', ' ')}</span>
            </div>
            <span className="legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, overdueRes] = await Promise.all([getDashboardStats(), getOverdueTasks()]);
        setData(statsRes.data);
        setOverdue(overdueRes.data.tasks);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  const stats = data?.stats || {};
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Here's what's happening with your projects today.</p>
        </div>
      </div>

      <div className="dashboard-stats stagger-children">
        <div className="stat-card stat-total">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{stats['in-progress'] || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{data?.overdueCount || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="quick-stats-row stagger-children">
        <div className="quick-stat">
          <span className="quick-stat-icon">📁</span>
          <div className="quick-stat-info">
            <div className="quick-stat-value">{data?.projectCount || 0}</div>
            <div className="quick-stat-label">Projects</div>
          </div>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-icon">👥</span>
          <div className="quick-stat-info">
            <div className="quick-stat-value">{data?.memberCount || 0}</div>
            <div className="quick-stat-label">Team Members</div>
          </div>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-icon">📝</span>
          <div className="quick-stat-info">
            <div className="quick-stat-value">{stats.review || 0}</div>
            <div className="quick-stat-label">In Review</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header"><h3>📈 Task Distribution</h3></div>
          <div className="dashboard-card-body">
            <DonutChart stats={stats} />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header"><h3>⚠️ Overdue Tasks</h3></div>
          <div className="dashboard-card-body">
            {overdue.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>🎉 No overdue tasks!</p>
              </div>
            ) : (
              overdue.slice(0, 5).map(task => (
                <div className="overdue-item" key={task._id}>
                  <div className="overdue-info">
                    <div className="overdue-title truncate">{task.title}</div>
                    <div className="overdue-date">Due {formatDate(task.dueDate)}</div>
                  </div>
                  <span className="badge badge-overdue">Overdue</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card full-width">
          <div className="dashboard-card-header"><h3>🕐 Recent Activity</h3></div>
          <div className="dashboard-card-body">
            {(!data?.recentTasks || data.recentTasks.length === 0) ? (
              <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>No recent activity yet.</p>
              </div>
            ) : (
              <div className="activity-list">
                {data.recentTasks.slice(0, 8).map(task => (
                  <div className="activity-item" key={task._id}>
                    <Avatar name={task.createdBy?.name || 'U'} size="sm" />
                    <div className="activity-content">
                      <div className="activity-title truncate">{task.title}</div>
                      <div className="activity-meta">
                        <span>{task.project?.name}</span>
                        <span>·</span>
                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                        <span>·</span>
                        <span>{formatRelativeDate(task.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
