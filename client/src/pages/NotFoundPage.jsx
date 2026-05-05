import { Link } from 'react-router-dom';
import '../styles/auth.css';

const NotFoundPage = () => (
  <div className="auth-page">
    <div className="auth-bg"></div>
    <div className="auth-container" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>404 — Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  </div>
);

export default NotFoundPage;
