import { useState, useEffect } from 'react';
import api from '../services/api';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const emptyForm = { vehicle_id: '', service_type: '', description: '', cost: '', priority: 'Medium', start_date: '' };

export default function MaintenancePage() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    Promise.all([api.get('/maintenance'), api.get('/maintenance/stats'), api.get('/vehicles')])
      .then(([m, s, v]) => { setLogs(m.data); setStats(s.data); setVehicles(v.data); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const openEdit = (m) => { setEditing(m); setForm({ vehicle_id: m.vehicle_id, service_type: m.service_type, description: m.description || '', cost: m.cost, priority: m.priority, start_date: m.start_date?.split('T')[0] || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/maintenance/${editing.id}`, form); showToast('Updated'); }
      else { await api.post('/maintenance', form); showToast('Added'); }
      setModal(false); load();
    } catch (err) { showToast(err.error || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`/maintenance/${id}`); showToast('Deleted'); load(); }
    catch (err) { showToast(err.error || 'Failed', 'error'); }
  };

  const priorityColor = (p) => ({ Low: '#94a3b8', Medium: '#4d8eff', High: '#f59e0b', Critical: '#ef4444' }[p] || '#94a3b8');
  const statusColor = (s) => s === 'Open' ? '#f59e0b' : '#10b981';
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Maintenance Tracker</h1><p className="page-subtitle">Track vehicle service history and maintenance logs</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }}><span className="material-symbols-outlined">add</span> Log Service</button>
      </div>

      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'Total Records', value: stats.total, icon: 'build', cls: 'primary' },
            { label: 'Total Cost', value: `₹${fmt(stats.total_cost)}`, icon: 'payments', cls: 'revenue' },
            { label: 'Open', value: stats.open_count, icon: 'pending', cls: 'in-shop' },
            { label: 'Closed', value: stats.closed_count, icon: 'check_circle', cls: 'available' },
            { label: 'High Priority', value: stats.high_priority, icon: 'warning', cls: 'in-shop' },
          ].map((k) => (
            <div key={k.label} className="card glass-panel fleet-kpi">
              <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
              <div className="fleet-kpi-value">{k.value}</div>
              <div className="fleet-kpi-label font-label-md">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Vehicle</th><th>Service Type</th><th>Description</th><th>Cost</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>) : logs.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><span className="material-symbols-outlined">build</span><p>No maintenance records</p></div></td></tr>
            ) : logs.map((m) => (
              <tr key={m.id}>
                <td><span style={{ color: 'var(--primary)' }} className="font-label-md">{m.registration_number}</span><br /><span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{m.name_model}</span></td>
                <td>{m.service_type}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description || '—'}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>₹{fmt(m.cost)}</td>
                <td><span className="badge" style={{ background: `${priorityColor(m.priority)}20`, color: priorityColor(m.priority) }}>{m.priority}</span></td>
                <td><span className="badge" style={{ background: `${statusColor(m.status)}20`, color: statusColor(m.status) }}>{m.status}</span></td>
                <td>{new Date(m.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={() => openEdit(m)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                  <button className="btn-ghost" onClick={() => handleDelete(m.id)}><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{editing ? 'Edit Record' : 'Log Maintenance'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Vehicle</label>
                  <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Service Type</label><input className="input" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="Oil Change, Brake Repair, etc." required /></div>
              <div className="form-group"><label className="form-label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Cost (₹)</label><input className="input" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Log Service')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
