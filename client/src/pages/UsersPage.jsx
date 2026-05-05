import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUserRole } from '../api/users';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try { const res = await getUsers(); setUsers(res.data.users); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try { await updateUserRole(userId, newRole); toast.success('Role updated'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header"><div><h1>Users</h1><p>Manage team members and roles</p></div></div>
      <div className="members-grid">
        {users.map(u => (
          <div className="member-card" key={u._id}>
            <Avatar name={u.name} size="lg" />
            <div className="member-info">
              <div className="member-name">{u.name} {u._id === user?.id && '(You)'}</div>
              <div className="member-email">{u.email}</div>
            </div>
            {u._id !== user?.id ? (
              <select className="filter-select" value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} style={{ minWidth: '100px' }}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            ) : (
              <span className={`badge badge-${u.role}`}>{u.role}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
