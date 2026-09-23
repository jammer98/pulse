import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function Layout() {
  const { user, logout } = useAuth();
  const { status, unreadCount, toast } = useSocket();
  const navigate = useNavigate();
  const statusLabel = { live: 'Live', connecting: 'Connecting', disconnected: 'Offline' }[status];
  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>Pulse<span>.</span></div>
        <nav>
          <NavLink to="/">Inbox</NavLink>
          <NavLink to="/preferences">Preferences</NavLink>
          <NavLink to="/demo">Demo</NavLink>
        </nav>
        <div className="nav-actions">
          <span className={`connection ${status}`} title={`Socket: ${statusLabel}`}><i />{statusLabel}</span>
          <span className="unread-badge" aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
          <span className="user-name">{user?.name}</span>
          <button className="link-button" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>
      {toast && <div className="toast" role="status"><strong>New:</strong> {toast.title}</div>}
      <main className="page"><Outlet /></main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</div>;
}

export function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

export function ErrorMessage({ message }) { return message ? <p className="error-message">{message}</p> : null; }
