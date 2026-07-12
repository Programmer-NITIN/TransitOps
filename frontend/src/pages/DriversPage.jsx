import { useState, useEffect } from 'react';
import api from '../services/api';
import './DriversPage.css';

const LICENSE_CATS = ['A', 'B', 'C', 'D', 'E', 'CE', 'DE'];
const emptyForm = { name: '', license_number: '', license_category: 'C', license_expiry: '', contact_number: '', safety_score: '5.0' };

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);
    Promise.all([api.get(`/drivers?${params}`), api.get('/drivers/stats')])
      .then(([d, s]) => { setDrivers(d.data); setStats(s.data); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter.status]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, license_number: d.license_number, license_category: d.license_category, license_expiry: d.license_expiry?.split('T')[0] || '', contact_number: d.contact_number, safety_score: d.safety_score }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put(`/drivers/${editing.id}`, form); showToast('Driver updated'); }
      else { await api.post('/drivers', form); showToast('Driver added'); }
      setModal(false); load();
    } catch (err) { showToast(err.error || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const isExpired = (date) => new Date(date) < new Date();
  const isExpiringSoon = (date) => { const d = new Date(date); const now = new Date(); const diff = (d - now) / (1000 * 60 * 60 * 24); return diff >= 0 && diff <= 30; };
  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/\s+/g, '-')}`}>{s}</span>;

  const safetyColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Driver Network</h1><p className="page-subtitle">Manage driver profiles, compliance, and safety scores</p></div>
        <button className="btn btn-primary" onClick={openAdd}><span className="material-symbols-outlined">person_add</span> Add Driver</button>
      </div>

      {/* KPI Row */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'Total Drivers', value: stats.total, icon: 'groups', cls: 'primary' },
            { label: 'Available', value: stats.available, icon: 'check_circle', cls: 'available' },
            { label: 'On Trip', value: stats.on_trip, icon: 'route', cls: 'on-trip' },
            { label: 'Avg Safety', value: `${stats.avg_safety_score}/10`, icon: 'shield', cls: 'success' },
            { label: 'Expired Licenses', value: stats.expired_licenses, icon: 'warning', cls: 'in-shop' },
          ].map((k) => (
            <div key={k.label} className="card glass-panel kpi-glow fleet-kpi">
              <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
              <div className="fleet-kpi-value">{k.value}</div>
              <div className="fleet-kpi-label font-label-md">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="fleet-filters glass-panel card">
        <div className="filter-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18 }}>filter_list</span>
          <select className="select filter-select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="Available">Available</option><option value="On Trip">On Trip</option><option value="Off Duty">Off Duty</option><option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="filter-search">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>search</span>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or license..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="drivers-grid">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton driver-card-skeleton" />) : drivers.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}><span className="material-symbols-outlined">badge</span><p>No drivers found</p></div>
        ) : drivers.map((d) => (
          <div key={d.id} className="driver-card glass-panel card">
            <div className="driver-card-header">
              <div className="driver-avatar" style={{ borderColor: safetyColor(d.safety_score) }}>{d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div className="driver-info">
                <div className="driver-name">{d.name}</div>
                <div className="driver-license font-label-md">{d.license_number}</div>
              </div>
              {statusBadge(d.status)}
            </div>
            <div className="driver-details">
              <div className="driver-detail"><span className="material-symbols-outlined">category</span> Cat {d.license_category}</div>
              <div className="driver-detail"><span className="material-symbols-outlined">phone</span> {d.contact_number}</div>
              <div className={`driver-detail ${isExpired(d.license_expiry) ? 'expired' : isExpiringSoon(d.license_expiry) ? 'expiring' : ''}`}>
                <span className="material-symbols-outlined">{isExpired(d.license_expiry) ? 'error' : 'event'}</span>
                {new Date(d.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="driver-footer">
              <div className="safety-score">
                <span className="safety-label">Safety</span>
                <div className="safety-bar-track"><div className="safety-bar-fill" style={{ width: `${(d.safety_score / 10) * 100}%`, background: safetyColor(d.safety_score) }} /></div>
                <span className="safety-value" style={{ color: safetyColor(d.safety_score) }}>{d.safety_score}</span>
              </div>
              <button className="btn-ghost" onClick={() => openEdit(d)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{editing ? 'Edit Driver' : 'Add New Driver'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">License Number</label><input className="input" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">License Category</label><select className="select" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })}>{LICENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">License Expiry</label><input className="input" type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Contact Number</label><input className="input" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Safety Score (0-10)</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Driver' : 'Add Driver')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
