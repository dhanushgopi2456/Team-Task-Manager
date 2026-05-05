import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📋</div>
          <div className="sidebar-brand">
            <h2>TaskFlow</h2>
            <span>Team Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose} end>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <span className="nav-icon">📁</span> Projects
          </NavLink>
          <NavLink to="/tasks" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <span className="nav-icon">✅</span> Tasks
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Admin</div>
              <NavLink to="/users" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="nav-icon">👥</span> Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.name} size="md" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name truncate">{user?.name}</div>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
            <button className="sidebar-logout" onClick={logout} title="Logout">🚪</button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
