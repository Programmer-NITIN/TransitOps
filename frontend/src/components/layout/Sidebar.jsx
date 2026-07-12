import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

// Role-based navigation access control
const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
  { path: '/fleet', icon: 'local_shipping', label: 'Fleet', roles: ['Fleet Manager', 'Safety Officer', 'Financial Analyst'] },
  { path: '/drivers', icon: 'badge', label: 'Drivers', roles: ['Fleet Manager', 'Safety Officer'] },
  { path: '/trips', icon: 'route', label: 'Trips', roles: ['Fleet Manager', 'Driver', 'Safety Officer'] },
  { path: '/maintenance', icon: 'build', label: 'Maintenance', roles: ['Fleet Manager', 'Safety Officer', 'Financial Analyst'] },
  { path: '/fuel-logs', icon: 'local_gas_station', label: 'Fuel Logs', roles: ['Fleet Manager', 'Driver'] },
  { path: '/expenses', icon: 'account_balance_wallet', label: 'Expenses', roles: ['Fleet Manager', 'Financial Analyst'] },
  { path: '/analytics', icon: 'analytics', label: 'Analytics', roles: ['Fleet Manager', 'Financial Analyst'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const userRole = user?.role || 'Fleet Manager';

  // Filter nav items by role
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

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
        {visibleItems.map((item) => (
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
        <div className="user-role-badge">{userRole}</div>
        <button className="nav-item logout-btn" onClick={logout}>
          <span className="material-symbols-outlined nav-icon">logout</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
