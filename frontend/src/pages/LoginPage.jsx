import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role_id: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setForm({ ...form, email, password: 'TransitOps@123' });
    setError('');
  };

  return (
    <div className="login-page">
      {/* Ambient Glow Effects */}
      <div className="login-glow glow-1" />
      <div className="login-glow glow-2" />

      {/* Left Panel — Branding */}
      <div className="login-left">
        <div className="login-brand-content">
          <div className="login-brand-icon">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <h1 className="login-brand-title">TransitOps</h1>
          <p className="login-brand-subtitle">Fleet Command Center</p>
          <p className="login-brand-desc">
            Enterprise-grade fleet intelligence. Command your logistics network with absolute precision.
          </p>

          <div className="login-features">
            {[
              { icon: 'local_shipping', label: 'Fleet Management' },
              { icon: 'route', label: 'Trip Dispatching' },
              { icon: 'analytics', label: 'Real-time Analytics' },
              { icon: 'build', label: 'Maintenance Tracking' },
            ].map((f) => (
              <div key={f.label} className="login-feature-item">
                <span className="material-symbols-outlined">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="login-right">
        <div className="login-form-container glass-panel">
          <div className="login-form-header">
            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isRegister ? 'Set up your fleet operations account' : 'Sign in to your command center'}</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    type="text"
                    name="full_name"
                    className="input input-with-icon"
                    placeholder="Rajesh Kumar"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  name="email"
                  className="input input-with-icon"
                  placeholder="fleet@transitops.in"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type="password"
                  name="password"
                  className="input input-with-icon"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role_id"
                  className="select"
                  value={form.role_id}
                  onChange={handleChange}
                >
                  <option value={1}>Fleet Manager</option>
                  <option value={2}>Driver</option>
                  <option value={3}>Safety Officer</option>
                  <option value={4}>Financial Analyst</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="material-symbols-outlined spin">progress_activity</span>
                  {isRegister ? 'Creating...' : 'Signing in...'}
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined">{isRegister ? 'person_add' : 'login'}</span>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          {!isRegister && (
            <div className="demo-accounts">
              <span className="demo-label">Quick Login:</span>
              <div className="demo-buttons">
                {[
                  { email: 'fleet@transitops.in', label: 'Fleet Mgr', icon: 'local_shipping' },
                  { email: 'driver@transitops.in', label: 'Driver', icon: 'badge' },
                  { email: 'safety@transitops.in', label: 'Safety', icon: 'shield' },
                  { email: 'finance@transitops.in', label: 'Finance', icon: 'payments' },
                ].map((d) => (
                  <button key={d.email} type="button" className="demo-btn" onClick={() => fillDemo(d.email)}>
                    <span className="material-symbols-outlined">{d.icon}</span>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="login-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" className="toggle-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
