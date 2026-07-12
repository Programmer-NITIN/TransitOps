import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/fleet', icon: 'local_shipping', label: 'Fleet' },
  { path: '/drivers', icon: 'badge', label: 'Drivers' },
  { path: '/trips', icon: 'route', label: 'Trips' },
  { path: '/maintenance', icon: 'build', label: 'Maintenance' },
  { path: '/expenses', icon: 'account_balance_wallet', label: 'Expenses' },
  { path: '/analytics', icon: 'analytics', label: 'Analytics' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <span className="material-symbols-outlined">hub</span>
        </div>
        <div className="brand-text">
          <span className="brand-name">TransitOps</span>
          <span className="brand-tag">Command Center</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">OPERATIONS</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.path === location.pathname && <div className="active-indicator" />}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <span className="material-symbols-outlined nav-icon">logout</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
