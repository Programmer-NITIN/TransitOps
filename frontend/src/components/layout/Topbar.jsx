import { useAuth } from '../../context/AuthContext';
import './Topbar.css';

export default function Topbar() {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-greeting">
          <span className="greeting-text">{getGreeting()},</span>
          <span className="greeting-name">{user?.full_name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search vehicles, drivers, trips..."
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-btn" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notification-dot"></span>
        </button>
        <button className="topbar-btn" title="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="topbar-user">
          <div className="user-avatar">{getInitials(user?.full_name)}</div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || 'User'}</span>
            <span className="user-role">{user?.role || 'Member'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
